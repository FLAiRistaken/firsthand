const REQUEST_TIMEOUT_MS = 30_000;

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  system: string,
  maxTokens: number = 150,
  model: string = 'claude-sonnet-4-6'
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable. Please check your .env file.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        system,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as AnthropicResponse;

    const firstText = data.content?.find(
      (block): block is AnthropicContentBlock & { text: string } =>
        block.type === 'text' && typeof block.text === 'string'
    );

    if (firstText) {
      return firstText.text;
    }

    throw new Error("Unexpected response format from Anthropic API");
  } finally {
    clearTimeout(timeoutId);
  }
}
