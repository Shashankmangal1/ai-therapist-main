const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to login. Please try again.',
    }));
    throw new Error(error.message || 'Invalid email or password.');
  }

  return response.json();
}




export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Registration failed");
  }
  return res.json();
}




