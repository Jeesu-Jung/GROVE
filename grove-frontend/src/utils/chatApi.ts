export interface ChatRequestBody {
  query: string;
  id: string;
}

export interface ChatResponseBody {
  answer: string;
}

export async function postChat(body: ChatRequestBody, signal?: AbortSignal): Promise<ChatResponseBody> {
  const response = await fetch('/weavy/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}


