const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration with whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Check if the origin is in the whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-proxy-secret', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROXY_SECRET = process.env.PROXY_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 3000;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

if (!PROXY_SECRET) {
  console.error('PROXY_SECRET environment variable is required');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL environment variable is required');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Delete user account endpoint - uses Supabase service role
app.post('/api/delete-account', async (req, res) => {
  // Validate shared secret
  const secret = req.headers['x-proxy-secret'];
  if (!secret || secret !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const { userId, accessToken } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  try {
    // Verify the user's access token matches the userId they're trying to delete
    const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!verifyResponse.ok) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    const userData = await verifyResponse.json();

    if (userData.id !== userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    // Delete logs (cascade should handle this, but explicit delete for safety)
    const deleteLogsResponse = await fetch(`${SUPABASE_URL}/rest/v1/logs?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
    });

    if (!deleteLogsResponse.ok) {
      console.error('Failed to delete logs:', await deleteLogsResponse.text());
      return res.status(500).json({ error: 'Failed to delete user logs' });
    }

    // Delete profile
    const deleteProfileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
    });

    if (!deleteProfileResponse.ok) {
      console.error('Failed to delete profile:', await deleteProfileResponse.text());
      return res.status(500).json({ error: 'Failed to delete user profile' });
    }

    // Delete the auth user using admin API
    const deleteUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!deleteUserResponse.ok) {
      const errorText = await deleteUserResponse.text();
      console.error('Failed to delete auth user:', errorText);
      return res.status(500).json({ error: 'Failed to delete user account' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user account:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Anthropic proxy endpoint
app.post('/api/chat', (req, res) => {
  // Validate shared secret
  const secret = req.headers['x-proxy-secret'];
  if (!secret || secret !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const { messages, system, model, max_tokens } = req.body;

  // Validate required fields
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages array must not be empty' });
  }

  // Validate each message in the array
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
      return res.status(400).json({ error: `messages[${i}] must be an object` });
    }
    if (typeof msg.role !== 'string' || msg.role.trim() === '') {
      return res.status(400).json({ error: `messages[${i}].role must be a non-empty string` });
    }
    if (typeof msg.content !== 'string' || msg.content.trim() === '') {
      return res.status(400).json({ error: `messages[${i}].content must be a non-empty string` });
    }
  }

  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: 'model string is required' });
  }

  // Trim and validate model
  const trimmedModel = model.trim();
  if (trimmedModel === '') {
    return res.status(400).json({ error: 'model must not be empty' });
  }

  // Validate system field if present
  if (system !== undefined && typeof system !== 'string') {
    return res.status(400).json({ error: 'system must be a string if provided' });
  }

  // Validate max_tokens is a positive integer
  if (typeof max_tokens !== 'number' || !Number.isInteger(max_tokens) || max_tokens <= 0) {
    return res.status(400).json({ error: 'max_tokens must be a positive integer' });
  }

  // Cap max_tokens to prevent abuse
  const safeMaxTokens = Math.min(max_tokens, 1000);

  const body = {
    model: trimmedModel,
    max_tokens: safeMaxTokens,
    messages,
    ...(typeof system === 'string' ? { system } : {}),
  };

  const controller = new AbortController();

  // Parse and validate ANTHROPIC_TIMEOUT_MS
  let timeoutMs = 10000; // default
  if (process.env.ANTHROPIC_TIMEOUT_MS) {
    const parsed = Number.parseInt(process.env.ANTHROPIC_TIMEOUT_MS, 10);
    if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
      timeoutMs = parsed;
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': ANTHROPIC_API_KEY,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (anthropicRes) => {
      clearTimeout(timeoutId);
      const dataText = await anthropicRes.text();
      let data = dataText;
      let isJson = false;
      try {
        data = JSON.parse(dataText);
        isJson = true;
      } catch (_) {
        // body is not JSON; data remains the raw text string
      }
      if (!anthropicRes.ok) {
        return isJson
          ? res.status(anthropicRes.status).json(data)
          : res.status(anthropicRes.status).type('text').send(dataText);
      }
      return isJson ? res.json(data) : res.type('text').send(dataText);
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.error('Anthropic fetch error:', err);
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'Gateway timeout - Anthropic API did not respond in time' });
      }
      return res.status(502).json({ error: 'Failed to reach Anthropic API' });
    });
});

// Reject everything else
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Firsthand proxy listening on port ${PORT}`);
});
