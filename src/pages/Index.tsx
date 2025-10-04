import { useState, useCallback } from 'react';
import { Timer } from '@/components/Timer';
import { TaskList } from '@/components/TaskList';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useTimer } from '@/hooks/useTimer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Settings, TimerMode } from '@/types/pomodoro';
import { toast } from '@/hooks/use-toast';

const defaultSettings: Settings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartPomodoro: false,
  autoStartBreak: false,
  soundEnabled: true,
  notificationsEnabled: true,
  volume: 50,
};

const Index = () => {
  const [settings, setSettings] = useLocalStorage<Settings>('pomodoro-settings', defaultSettings);
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();

  const handleTimerComplete = useCallback((mode: TimerMode) => {
    if (mode === 'pomodoro' && currentTaskId) {
      setTasks(prev =>
        prev.map(task =>
          task.id === currentTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task
        )
      );
    }
  }, [currentTaskId, setTasks]);

  const {
    mode,
    status,
    secondsLeft,
    pomodoroCount,
    start,
    pause,
    reset,
    switchMode,
  } = useTimer({
    settings,
    onTimerComplete: handleTimerComplete,
  });

  useKeyboardShortcuts({
    status,
    onStart: start,
    onPause: pause,
    onReset: reset,
    onSwitchMode: switchMode,
  });

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      completed: false,
      orderIndex: tasks.length,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    toast({
      title: 'Task added',
      description: title,
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (currentTaskId === id) {
      setCurrentTaskId(undefined);
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated',
    });
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-bold">Pomofocus</h1>
          </div>
          <SettingsDialog settings={settings} onSave={handleSaveSettings} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Timer
          mode={mode}
          status={status}
          secondsLeft={secondsLeft}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onSwitchMode={switchMode}
        />

        {currentTask && (
          <div className="text-center mt-6">
            <p className="text-lg text-muted-foreground">
              Working on:{' '}
              <span className="text-foreground font-semibold">{currentTask.title}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Pomodoro #{pomodoroCount + 1}
            </p>
          </div>
        )}

        <TaskList
          tasks={tasks}
          currentTaskId={currentTaskId}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onToggleTask={handleToggleTask}
          onSelectTask={setCurrentTaskId}
          onUpdateTask={handleUpdateTask}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ for focus and productivity</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
