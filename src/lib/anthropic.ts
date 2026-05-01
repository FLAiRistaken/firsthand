const _rawProxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
if (!_rawProxyUrl || _rawProxyUrl.trim() === '') {
  throw new Error(
    'Missing required environment variable EXPO_PUBLIC_PROXY_URL. ' +
      'Set PROXY_URL / EXPO_PUBLIC_PROXY_URL in your .env.local file before starting the app.'
  );
}
const PROXY_URL = _rawProxyUrl.trim();

export const callClaude = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  system: string,
  maxTokens: number = 150,
  model: string = 'claude-sonnet-4-6'
): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    if (!textBlock || !(textBlock as { type: string; text?: string }).text) {
      throw new Error(
        `No text block found in response. Response data: ${JSON.stringify(data)}`
      );
    }

    return (textBlock as { type: string; text: string }).text;
  } finally {
    clearTimeout(timeout);
  }
};
