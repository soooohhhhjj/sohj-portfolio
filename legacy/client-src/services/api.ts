const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<TResponse>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<TResponse> {
  const { method = 'GET', body, headers } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}