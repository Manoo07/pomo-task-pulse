export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type Priority = 'none' | 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface LearningTrack {
  id: string;
  name: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  trackId: string;
  priority: Priority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  notes?: string;
  status: TaskStatus;
  orderIndex: number;
  completed: boolean;
  forDate: string;
  createdAt: string;
  updatedAt: string;
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
