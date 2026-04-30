const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROXY_SECRET = process.env.PROXY_SECRET;
const PORT = process.env.PORT || 3000;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

if (!PROXY_SECRET) {
  console.error('PROXY_SECRET environment variable is required');
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Anthropic proxy endpoint
app.post('/api/chat', (req, res) => {
  // Validate shared secret
  const secret = req.headers['x-proxy-secret'];
  if (!secret || secret !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const { messages, system, model, max_tokens } = req.body;

  // Validate required fields
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: 'model string is required' });
  }
  if (!max_tokens || typeof max_tokens !== 'number') {
    return res.status(400).json({ error: 'max_tokens number is required' });
  }

  // Cap max_tokens to prevent abuse
  const safeMaxTokens = Math.min(max_tokens, 1000);

  const body = {
    model,
    max_tokens: safeMaxTokens,
    messages,
    ...(system ? { system } : {}),
  };

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': ANTHROPIC_API_KEY,
    },
    body: JSON.stringify(body),
  })
    .then(async (anthropicRes) => {
      const data = await anthropicRes.json();
      if (!anthropicRes.ok) {
        return res.status(anthropicRes.status).json(data);
      }
      return res.json(data);
    })
    .catch((err) => {
      console.error('Anthropic fetch error:', err);
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
