// src/config/api.ts
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.pomofocus.com"
    : "http://localhost:3000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    CHECK_EMAIL: (email: string) => `${API_BASE_URL}/api/auth/check-email/${email}`,
    CHECK_USERNAME: (username: string) => `${API_BASE_URL}/api/auth/check-username/${username}`,
  },
  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    DEACTIVATE: `${API_BASE_URL}/api/users/profile`,
  },
  TASKS: {
    LIST: `${API_BASE_URL}/api/tasks`,
    CREATE: `${API_BASE_URL}/api/tasks`,
    GET: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    STATS: `${API_BASE_URL}/api/tasks/stats`,
    BY_TRACK: (trackId: string) => `${API_BASE_URL}/api/tasks/track/${trackId}`,
  },
  SESSIONS: {
    START: `${API_BASE_URL}/api/sessions/start`,
    COMPLETE: (id: string) => `${API_BASE_URL}/api/sessions/${id}/complete`,
    CANCEL: (id: string) => `${API_BASE_URL}/api/sessions/${id}/cancel`,
    ACTIVE: `${API_BASE_URL}/api/sessions/active`,
    HISTORY: `${API_BASE_URL}/api/sessions/history`,
    STATS: `${API_BASE_URL}/api/sessions/stats`,
  },
  TRACKS: {
    LIST: `${API_BASE_URL}/api/tracks`,
    CREATE: `${API_BASE_URL}/api/tracks`,
    GET: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
    STATS: `${API_BASE_URL}/api/tracks/stats`,
    POPULAR: `${API_BASE_URL}/api/tracks/popular`,
    SEARCH: `${API_BASE_URL}/api/tracks/search`,
  },
  SETTINGS: {
    GET: `${API_BASE_URL}/api/settings`,
    UPDATE: `${API_BASE_URL}/api/settings`,
    RESET: `${API_BASE_URL}/api/settings/reset`,
    THEMES: `${API_BASE_URL}/api/settings/themes`,
    LANGUAGES: `${API_BASE_URL}/api/settings/languages`,
  },
  ANALYTICS: {
    GENERAL: `${API_BASE_URL}/api/analytics`,
    INSIGHTS: `${API_BASE_URL}/api/analytics/insights`,
    STREAK: `${API_BASE_URL}/api/analytics/streak`,
    DAILY: `${API_BASE_URL}/api/analytics/daily`,
    WEEKLY: `${API_BASE_URL}/api/analytics/weekly`,
    MONTHLY: `${API_BASE_URL}/api/analytics/monthly`,
  },
} as const;

export default API_BASE_URL;
