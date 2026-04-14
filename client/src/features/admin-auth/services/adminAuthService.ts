export type AdminSession = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin';
};

type AdminSessionResponse = {
  admin: AdminSession;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return payload as T;
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  return parseJsonResponse<AdminSessionResponse>(response);
}

export async function getAdminSession() {
  const response = await fetch('/api/admin/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  return parseJsonResponse<AdminSessionResponse>(response);
}

export async function logoutAdmin() {
  const response = await fetch('/api/admin/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  return parseJsonResponse<{ message: string }>(response);
}
