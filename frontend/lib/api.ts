const API_BASE = import.meta.env.VITE_API_URL || '/api';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

const OPAQUE_KEYS = new Set(['execution_result', 'executionResult']);

function convertKeys(obj: any, converter: (key: string) => string, isOpaque = false): any {
  if (isOpaque) return obj;
  if (Array.isArray(obj)) return obj.map(item => convertKeys(item, converter));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const convertedKey = converter(key);
      acc[convertedKey] = convertKeys(obj[key], converter, OPAQUE_KEYS.has(key) || OPAQUE_KEYS.has(convertedKey));
      return acc;
    }, {} as any);
  }
  return obj;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setAccessToken(access: string) {
  localStorage.setItem('access_token', access);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setAccessToken(data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      clearTokens();
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || 'Ошибка API');
  }

  const text = await res.text();
  if (!text) return {} as T;
  const data = JSON.parse(text);
  return convertKeys(data, snakeToCamel) as T;
}

export const authApi = {
  vkLogin: (data: { access_token: string }) =>
    apiFetch<{ access: string; user: any }>('/auth/vk', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }, true),

  getMe: () => apiFetch<any>('/auth/me'),

  updateProfile: (data: { firstName: string; lastName: string }) =>
    apiFetch<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(convertKeys(data, camelToSnake)),
    }),

  deleteAccount: () =>
    apiFetch<any>('/auth/me', { method: 'DELETE' }),

  bindTelegram: (data: any) =>
    apiFetch<any>('/auth/telegram-bind', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unbindTelegram: () =>
    apiFetch<any>('/auth/telegram-bind', { method: 'DELETE' }),

  toggleTelegramNotifications: (enabled: boolean) =>
    apiFetch<any>('/auth/telegram-notifications', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};

export const modulesApi = {
    list: () => apiFetch<any[]>('/modules'),
    get: (slug: string) => apiFetch<any>(`/modules/${slug}`),
    lessons: (slug: string) => apiFetch<any[]>(`/modules/${slug}/lessons`),
  update: (slug: string, data: any) =>
    apiFetch<any>(`/modules/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(convertKeys(data, camelToSnake)),
    }),
};

export const lessonsApi = {
  get: (lessonId: string) => apiFetch<any>(`/lessons/${lessonId}`),
  validateSolution: (lessonId: string, code: string) => apiFetch<any>(`/lessons/${lessonId}/validate`, {
    method: 'POST',
    body: JSON.stringify({ code })
  }),
  create: (data: any) =>
    apiFetch<any>('/lessons', {
      method: 'POST',
      body: JSON.stringify(convertKeys(data, camelToSnake)),
    }),
  update: (lessonId: string, data: any) =>
    apiFetch<any>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(convertKeys(data, camelToSnake)),
    }),
  delete: (lessonId: string) =>
    apiFetch<any>(`/lessons/${lessonId}`, { method: 'DELETE' }),
  reorder: (moduleSlug: string, lessonIds: string[]) =>
    apiFetch<any>(`/modules/${moduleSlug}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ lesson_ids: lessonIds }),
    }),
};

export const submissionsApi = {
  list: () => apiFetch<any[]>('/submissions/'),
  create: (data: any) =>
    apiFetch<any>('/submissions/', {
      method: 'POST',
      body: JSON.stringify(convertKeys(data, camelToSnake)),
    }),
};

export const adminApi = {
  stats: () => apiFetch<any>('/admin/stats'),
  submissions: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiFetch<any[]>(`/admin/submissions${query}`);
  },
  review: (id: number, data: { status: string; feedback: string; inline_comments?: any[] }) =>
    apiFetch<any>(`/admin/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  aiCheck: (id: number) =>
    apiFetch<any>(`/admin/submissions/${id}/ai-check`, {
      method: 'POST',
    }),
};

export const notificationsApi = {
  list: () => apiFetch<any[]>('/notifications/'),
  markRead: (id: string) =>
    apiFetch<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiFetch<any>('/notifications/read-all', { method: 'POST' }),
};

export const progressApi = {
  get: () => apiFetch<{ completedLessons: string[] }>('/progress/'),
  complete: (lessonId: string) =>
    apiFetch<any>(`/progress/${lessonId}/complete`, { method: 'POST' }),
  uncomplete: (lessonId: string) =>
    apiFetch<any>(`/progress/${lessonId}/complete`, { method: 'DELETE' }),
};

export const groupsApi = {
  list: () => apiFetch<any[]>('/groups/'),
  create: (name: string, password: string = '') =>
    apiFetch<any>('/groups/', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),
  update: (id: string, data: { password?: string }) =>
    apiFetch<any>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<any>(`/groups/${id}`, { method: 'DELETE' }),
  members: (id: string) => apiFetch<any[]>(`/groups/${id}/members`),
  kick: (groupId: string, userId: string) =>
    apiFetch<any>(`/groups/${groupId}/kick/${userId}`, { method: 'POST' }),
  join: (inviteCode: string, password: string = '') =>
    apiFetch<any>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode, password }),
    }),
  checkInvite: (inviteCode: string) =>
    apiFetch<{ groupName: string; requiresPassword: boolean }>(`/groups/invite/${inviteCode}`),
};
