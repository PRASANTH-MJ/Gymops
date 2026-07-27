const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "gymflow_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

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
  login: (email: string, password: string) =>
    request<{ token: string; staff: { id: string; name: string; role: string; outlet_id: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  registerOutlet: (payload: {
    outletName: string;
    location?: string;
    ownerName: string;
    email: string;
    phone?: string;
    password: string;
  }) =>
    request<{ token: string; outletId: string }>("/api/auth/register-outlet", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getOutlet: () => request("/api/outlets/me"),

  getMembers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/members${qs ? `?${qs}` : ""}`);
  },
  getMember: (id: string) => request(`/api/members/${id}`),
  createMember: (payload: Record<string, unknown>) =>
    request("/api/members", { method: "POST", body: JSON.stringify(payload) }),
  updateMember: (id: string, payload: Record<string, unknown>) =>
    request(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  renewMember: (id: string, payload: Record<string, unknown>) =>
    request(`/api/members/${id}/renew`, { method: "POST", body: JSON.stringify(payload) }),

  getPlans: () => request("/api/plans"),
  createPlan: (payload: Record<string, unknown>) =>
    request("/api/plans", { method: "POST", body: JSON.stringify(payload) }),

  getExpenses: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/expenses${qs ? `?${qs}` : ""}`);
  },
  createExpense: (payload: Record<string, unknown>) =>
    request("/api/expenses", { method: "POST", body: JSON.stringify(payload) }),

  getEnquiries: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/enquiries${qs ? `?${qs}` : ""}`);
  },
  createEnquiry: (payload: Record<string, unknown>) =>
    request("/api/enquiries", { method: "POST", body: JSON.stringify(payload) }),

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
  getInvoice: (transactionId: string) => request(`/api/transactions/${transactionId}/invoice`),

  getAttendanceToday: () => request<{ count: number }>("/api/attendance/today"),
  checkIn: (memberId: string, source = "manual") =>
    request("/api/attendance", { method: "POST", body: JSON.stringify({ member_id: memberId, source }) }),

  getReminderTemplates: () => request("/api/reminder-templates"),
  updateReminderTemplate: (type: string, body: string) =>
    request(`/api/reminder-templates/${type}`, { method: "PUT", body: JSON.stringify({ body }) }),

  getSubscriptionTiers: () => request("/api/subscriptions/tiers"),
  getCurrentSubscription: () => request("/api/subscriptions/current"),
  purchaseSubscription: (tier: string) =>
    request("/api/subscriptions/purchase", { method: "POST", body: JSON.stringify({ tier }) }),
};
