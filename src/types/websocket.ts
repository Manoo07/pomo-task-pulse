// WebSocket message types for real-time synchronization
export interface WebSocketMessage {
  type: 
    // Session Events
    | 'SESSION_START'
    | 'SESSION_END'
    | 'SESSION_PAUSE'
    | 'SESSION_RESUME'
    | 'SESSION_UPDATE'
    | 'TIMER_SYNC'

    // Task Events
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_DELETED'
    | 'TASK_STATUS_CHANGED'
    | 'TASK_PRIORITY_CHANGED'

    // Track Events
    | 'TRACK_CREATED'
    | 'TRACK_UPDATED'
    | 'TRACK_DELETED'

    // Settings Events
    | 'SETTINGS_UPDATED'

    // Analytics Events
    | 'ANALYTICS_UPDATED'
    | 'STREAK_UPDATED'

    // Notification Events
    | 'NOTIFICATION'
    | 'ACHIEVEMENT_UNLOCKED'

    // Connection Events
    | 'CONNECTION_ESTABLISHED'
    | 'ERROR';

  userId: string;
  data: any;
  timestamp: string;
  message?: string;
}

// Session-specific WebSocket data
export interface SessionWebSocketData {
  sessionId: string;
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
  duration: number;
  startTime: string;
  taskId?: string;
  timeLeft?: number;
  isRunning?: boolean;
  completedPomodoros?: number;
  isCompleted?: boolean;
}

// Task-specific WebSocket data
export interface TaskWebSocketData {
  taskId: string;
  task?: any; // Full task object
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// Track-specific WebSocket data
export interface TrackWebSocketData {
  trackId: string;
  track?: any; // Full track object
}

// Settings-specific WebSocket data
export interface SettingsWebSocketData {
  settings: any; // Full settings object
}

// Analytics-specific WebSocket data
export interface AnalyticsWebSocketData {
  analytics: any; // Analytics data
  streak?: number;
}

// Notification-specific WebSocket data
export interface NotificationWebSocketData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  achievement?: string;
}

// WebSocket connection status
export type WebSocketConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error';

// WebSocket hook options
export interface UseWebSocketOptions {
  token: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
