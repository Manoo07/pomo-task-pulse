// src/utils/api.ts
import { API_ENDPOINTS } from "@/config/api";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        this.handleAuthFailure();
        return false;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.handleAuthFailure();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data?.tokens) {
        localStorage.setItem("access_token", data.data.tokens.accessToken);
        localStorage.setItem("refresh_token", data.data.tokens.refreshToken);
        return true;
      } else {
        this.handleAuthFailure();
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.handleAuthFailure();
      return false;
    }
  }

  private handleAuthFailure(): void {
    // Clear all auth data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    
    // Redirect to login page
    window.location.href = "/login";
  }

  async request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body, requireAuth = false } = options;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (requireAuth) {
      Object.assign(requestHeaders, this.getAuthHeaders());
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - token expired
      if (response.status === 401 && requireAuth) {
        console.log("Token expired, attempting refresh...");
        
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          // Retry the original request with new token
          const newHeaders = { ...requestHeaders, ...this.getAuthHeaders() };
          const retryConfig: RequestInit = {
            method,
            headers: newHeaders,
          };
          
          if (body && method !== "GET") {
            retryConfig.body = JSON.stringify(body);
          }
          
          const retryResponse = await fetch(url, retryConfig);
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          return retryData;
        } else {
          // Refresh failed, user will be redirected to login
          throw new Error("Authentication failed - please login again");
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: { email, password },
    });
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: userData,
    });
  }

  async logout() {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      requireAuth: true,
    });
  }

  async getCurrentUser() {
    return this.request(API_ENDPOINTS.AUTH.ME, {
      requireAuth: true,
    });
  }

  async checkEmailAvailability(email: string) {
    return this.request(API_ENDPOINTS.AUTH.CHECK_EMAIL(email));
  }

  async checkUsernameAvailability(username: string) {
    return this.request(API_ENDPOINTS.AUTH.CHECK_USERNAME(username));
  }

  // User methods
  async getUserProfile() {
    return this.request(API_ENDPOINTS.USERS.PROFILE, {
      requireAuth: true,
    });
  }

  async updateUserProfile(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    return this.request(API_ENDPOINTS.USERS.PROFILE, {
      method: "PUT",
      body: data,
      requireAuth: true,
    });
  }

  async deactivateAccount() {
    return this.request(API_ENDPOINTS.USERS.DEACTIVATE, {
      method: "DELETE",
      requireAuth: true,
    });
  }

  // Task methods
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    trackId?: string;
  }) {
    const url = new URL(API_ENDPOINTS.TASKS.LIST);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async getTask(id: string) {
    return this.request(API_ENDPOINTS.TASKS.GET(id), {
      requireAuth: true,
    });
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    estimatedPomodoros?: number;
    trackId?: string;
  }) {
    return this.request(API_ENDPOINTS.TASKS.CREATE, {
      method: "POST",
      body: taskData,
      requireAuth: true,
    });
  }

  async updateTask(
    id: string,
    taskData: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      estimatedPomodoros?: number;
      completedPomodoros?: number;
      trackId?: string;
    }
  ) {
    return this.request(API_ENDPOINTS.TASKS.UPDATE(id), {
      method: "PUT",
      body: taskData,
      requireAuth: true,
    });
  }

  async deleteTask(id: string) {
    return this.request(API_ENDPOINTS.TASKS.DELETE(id), {
      method: "DELETE",
      requireAuth: true,
    });
  }

  async getTaskStats() {
    return this.request(API_ENDPOINTS.TASKS.STATS, {
      requireAuth: true,
    });
  }

  async getTasksByTrack(trackId: string) {
    return this.request(API_ENDPOINTS.TASKS.BY_TRACK(trackId), {
      requireAuth: true,
    });
  }

  // Session methods
  async startSession(sessionData: {
    type: "POMODORO" | "SHORT_BREAK" | "LONG_BREAK";
    taskId?: string;
  }) {
    return this.request(API_ENDPOINTS.SESSIONS.START, {
      method: "POST",
      body: sessionData,
      requireAuth: true,
    });
  }

  async completeSession(id: string, duration: number) {
    return this.request(API_ENDPOINTS.SESSIONS.COMPLETE(id), {
      method: "POST",
      body: { duration },
      requireAuth: true,
    });
  }

  async cancelSession(id: string) {
    return this.request(API_ENDPOINTS.SESSIONS.CANCEL(id), {
      method: "POST",
      requireAuth: true,
    });
  }

  async getActiveSession() {
    return this.request(API_ENDPOINTS.SESSIONS.ACTIVE, {
      requireAuth: true,
    });
  }

  async getSessionHistory(params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const url = new URL(API_ENDPOINTS.SESSIONS.HISTORY);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async getSessionStats(params?: { startDate?: string; endDate?: string }) {
    const url = new URL(API_ENDPOINTS.SESSIONS.STATS);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  // Learning Track methods
  async getTracks() {
    return this.request(API_ENDPOINTS.TRACKS.LIST, {
      requireAuth: true,
    });
  }

  async getTrack(id: string) {
    return this.request(API_ENDPOINTS.TRACKS.GET(id), {
      requireAuth: true,
    });
  }

  async createTrack(trackData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    return this.request(API_ENDPOINTS.TRACKS.CREATE, {
      method: "POST",
      body: trackData,
      requireAuth: true,
    });
  }

  async updateTrack(
    id: string,
    trackData: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ) {
    return this.request(API_ENDPOINTS.TRACKS.UPDATE(id), {
      method: "PUT",
      body: trackData,
      requireAuth: true,
    });
  }

  async deleteTrack(id: string) {
    return this.request(API_ENDPOINTS.TRACKS.DELETE(id), {
      method: "DELETE",
      requireAuth: true,
    });
  }

  async getTrackStats() {
    return this.request(API_ENDPOINTS.TRACKS.STATS, {
      requireAuth: true,
    });
  }

  async getPopularTracks(limit?: number) {
    const url = new URL(API_ENDPOINTS.TRACKS.POPULAR);
    if (limit) {
      url.searchParams.append("limit", limit.toString());
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async searchTracks(query: string) {
    const url = new URL(API_ENDPOINTS.TRACKS.SEARCH);
    url.searchParams.append("q", query);
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  // Settings methods
  async getSettings() {
    return this.request(API_ENDPOINTS.SETTINGS.GET, {
      requireAuth: true,
    });
  }

  async updateSettings(settingsData: {
    pomodoroDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
    autoStartBreaks?: boolean;
    autoStartPomodoros?: boolean;
    soundEnabled?: boolean;
    desktopNotifications?: boolean;
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
  }) {
    return this.request(API_ENDPOINTS.SETTINGS.UPDATE, {
      method: "PUT",
      body: settingsData,
      requireAuth: true,
    });
  }

  async resetSettings() {
    return this.request(API_ENDPOINTS.SETTINGS.RESET, {
      method: "POST",
      requireAuth: true,
    });
  }

  async getAvailableThemes() {
    return this.request(API_ENDPOINTS.SETTINGS.THEMES);
  }

  async getAvailableLanguages() {
    return this.request(API_ENDPOINTS.SETTINGS.LANGUAGES);
  }

  // Analytics methods
  async getAnalytics(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const url = new URL(API_ENDPOINTS.ANALYTICS.GENERAL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async getProductivityInsights(days?: number) {
    const url = new URL(API_ENDPOINTS.ANALYTICS.INSIGHTS);
    if (days) {
      url.searchParams.append("days", days.toString());
    }
    return this.request(url.toString(), {
      requireAuth: true,
    });
  }

  async getStreakInfo() {
    return this.request(API_ENDPOINTS.ANALYTICS.STREAK, {
      requireAuth: true,
    });
  }

  async getDailyAnalytics() {
    return this.request(API_ENDPOINTS.ANALYTICS.DAILY, {
      requireAuth: true,
    });
  }

  async getWeeklyAnalytics() {
    return this.request(API_ENDPOINTS.ANALYTICS.WEEKLY, {
      requireAuth: true,
    });
  }

  async getMonthlyAnalytics() {
    return this.request(API_ENDPOINTS.ANALYTICS.MONTHLY, {
      requireAuth: true,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
