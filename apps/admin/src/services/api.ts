const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}
