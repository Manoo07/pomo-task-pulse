export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  notes?: string;
  project?: string;
  completed: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Settings {
  pomodoroDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartPomodoro: boolean;
  autoStartBreak: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  volume: number;
}

export interface Session {
  id: string;
  taskId?: string;
  mode: TimerMode;
  startedAt: string;
  endedAt?: string;
  seconds: number;
  completed: boolean;
}
