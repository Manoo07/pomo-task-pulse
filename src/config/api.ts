// src/config/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.pomofocus.com' 
  : 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    SETTINGS: `${API_BASE_URL}/api/settings`,
  },
  TASKS: {
    LIST: `${API_BASE_URL}/api/tasks`,
    CREATE: `${API_BASE_URL}/api/tasks`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    STATUS: (id: string) => `${API_BASE_URL}/api/tasks/${id}/status`,
  },
  SESSIONS: {
    LIST: `${API_BASE_URL}/api/sessions`,
    CREATE: `${API_BASE_URL}/api/sessions`,
    COMPLETE: (id: string) => `${API_BASE_URL}/api/sessions/${id}/complete`,
  },
  TRACKS: {
    LIST: `${API_BASE_URL}/api/tracks`,
    CREATE: `${API_BASE_URL}/api/tracks`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
  },
  ANALYTICS: {
    DAILY: `${API_BASE_URL}/api/analytics/daily`,
    WEEKLY: `${API_BASE_URL}/api/analytics/weekly`,
    MONTHLY: `${API_BASE_URL}/api/analytics/monthly`,
  },
} as const;

export default API_BASE_URL;
