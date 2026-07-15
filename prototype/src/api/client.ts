const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("urs_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? (Array.isArray(body.message) ? body.message.join(", ") : message);
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("urs_token", token);
  else localStorage.removeItem("urs_token");
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem("urs_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown | null) {
  if (user) localStorage.setItem("urs_user", JSON.stringify(user));
  else localStorage.removeItem("urs_user");
}
