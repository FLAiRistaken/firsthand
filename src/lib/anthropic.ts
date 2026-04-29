const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

if (!API_KEY) {
  throw new Error("Missing EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable. Please check your .env file.");
}

export async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  system: string,
  maxTokens: number = 150
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system: system,
      messages: messages
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (data.content && data.content.length > 0 && data.content[0].text) {
    return data.content[0].text;
  }

  throw new Error("Unexpected response format from Anthropic API");
}
