// src/utils/api.ts
import { API_ENDPOINTS } from '@/config/api';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = false,
    } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireAuth) {
      Object.assign(requestHeaders, this.getAuthHeaders());
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(email: string, password: string) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: { email, password },
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  // User methods
  async getUserProfile() {
    return this.request(API_ENDPOINTS.USERS.PROFILE, {
      requireAuth: true,
    });
  }

  async updateUserProfile(data: any) {
    return this.request(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PUT',
      body: data,
      requireAuth: true,
    });
  }

  // Task methods
  async getTasks(params?: Record<string, string>) {
    const url = new URL(API_ENDPOINTS.TASKS.LIST);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async createTask(taskData: any) {
    return this.request(API_ENDPOINTS.TASKS.CREATE, {
      method: 'POST',
      body: taskData,
      requireAuth: true,
    });
  }

  async updateTask(id: string, taskData: any) {
    return this.request(API_ENDPOINTS.TASKS.UPDATE(id), {
      method: 'PUT',
      body: taskData,
      requireAuth: true,
    });
  }

  async deleteTask(id: string) {
    return this.request(API_ENDPOINTS.TASKS.DELETE(id), {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  async updateTaskStatus(id: string, status: string) {
    return this.request(API_ENDPOINTS.TASKS.STATUS(id), {
      method: 'PUT',
      body: { status },
      requireAuth: true,
    });
  }

  // Session methods
  async getSessions(params?: Record<string, string>) {
    const url = new URL(API_ENDPOINTS.SESSIONS.LIST);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async createSession(sessionData: any) {
    return this.request(API_ENDPOINTS.SESSIONS.CREATE, {
      method: 'POST',
      body: sessionData,
      requireAuth: true,
    });
  }

  async completeSession(id: string, sessionData: any) {
    return this.request(API_ENDPOINTS.SESSIONS.COMPLETE(id), {
      method: 'PUT',
      body: sessionData,
      requireAuth: true,
    });
  }

  // Settings methods
  async getSettings() {
    return this.request(API_ENDPOINTS.USERS.SETTINGS, {
      requireAuth: true,
    });
  }

  async updateSettings(settingsData: any) {
    return this.request(API_ENDPOINTS.USERS.SETTINGS, {
      method: 'PUT',
      body: settingsData,
      requireAuth: true,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
