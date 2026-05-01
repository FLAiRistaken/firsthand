const PROXY_URL = 'https://firsthand-tjvn5.ondigitalocean.app';
const PROXY_SECRET = process.env.EXPO_PUBLIC_PROXY_SECRET;

export const callClaude = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  system: string,
  maxTokens: number = 150,
  model: string = 'claude-sonnet-4-6'
): Promise<string> => {
  if (!PROXY_SECRET) {
    throw new Error('EXPO_PUBLIC_PROXY_SECRET is not set');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proxy-secret': PROXY_SECRET,
      },
      body: JSON.stringify({
        messages,
        system,
        model,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw Object.assign(
        new Error(`Proxy error ${response.status}: ${JSON.stringify(errorData)}`),
        { status: response.status }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === 'text'
    );
    return (textBlock as { type: string; text: string } | undefined)?.text ?? '';
  } finally {
    clearTimeout(timeout);
  }
};
