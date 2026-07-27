import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "gymflow_token";

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => AsyncStorage.removeItem(TOKEN_KEY);

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getMe: () =>
    request<{ id: string; name: string; role: string; email: string | null; phone: string | null; outlet_name: string | null }>(
      "/api/auth/me"
    ),

  login: (email: string, password: string) =>
    request<{ token: string; staff: { id: string; name: string; role: string; outlet_id: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  getMembers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/members${qs ? `?${qs}` : ""}`);
  },
  getPlans: () => request("/api/plans"),

  getTransactions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/transactions${qs ? `?${qs}` : ""}`);
  },
  getTransactionSummary: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/transactions/summary${qs ? `?${qs}` : ""}`);
  },
  createTransaction: (payload: Record<string, unknown>) =>
    request("/api/transactions", { method: "POST", body: JSON.stringify(payload) }),

  getAttendanceToday: () => request<{ count: number }>("/api/attendance/today"),
  getAttendanceTodayList: () => request("/api/attendance/today/list"),
  checkIn: (memberId: string) =>
    request("/api/attendance", { method: "POST", body: JSON.stringify({ member_id: memberId, source: "manual" }) }),

  getReminderTemplates: () => request("/api/reminder-templates"),
  updateReminderTemplate: (type: string, body: string) =>
    request(`/api/reminder-templates/${type}`, { method: "PUT", body: JSON.stringify({ body }) }),

  getCurrentSubscription: () => request("/api/subscriptions/current"),
};
