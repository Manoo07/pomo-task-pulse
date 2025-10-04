import { useState, useCallback } from 'react';
import { Timer } from '@/components/Timer';
import { KanbanBoard } from '@/components/KanbanBoard';
import { useTimer } from '@/hooks/useTimer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Settings, TimerMode, LearningTrack, Priority, TaskStatus, Session } from '@/types/pomodoro';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

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
  const [settings] = useLocalStorage<Settings>('pomodoro-settings', defaultSettings);
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);
  const [sessions, setSessions] = useLocalStorage<Session[]>('pomodoro-sessions', []);
  const [tracks] = useLocalStorage<LearningTrack[]>('learning-tracks', [
    { id: '1', name: 'Machine Learning' },
    { id: '2', name: 'Computer Vision' },
    { id: '3', name: 'LLMs & NLP' },
  ]);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  
  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTrack, setNewTaskTrack] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('none');
  const [newTaskEstimate, setNewTaskEstimate] = useState('1');

  const handleTimerComplete = useCallback((mode: TimerMode) => {
    if (mode === 'pomodoro' && currentTaskId) {
      setTasks(prev =>
        prev.map(task =>
          task.id === currentTaskId
            ? { 
                ...task, 
                completedPomodoros: task.completedPomodoros + 1,
                status: task.status === 'todo' ? 'doing' : task.status,
                updatedAt: new Date().toISOString()
              }
            : task
        )
      );
      
      // Record session
      const newSession: Session = {
        id: Date.now().toString(),
        taskId: currentTaskId,
        mode: 'pomodoro',
        startedAt: new Date(Date.now() - settings.pomodoroDuration * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        seconds: settings.pomodoroDuration * 60,
        completed: true,
      };
      setSessions(prev => [...prev, newSession]);
    }
  }, [currentTaskId, setTasks, setSessions, settings.pomodoroDuration]);

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

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !newTaskTrack) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and select a track',
        variant: 'destructive',
      });
      return;
    }

    const estimate = parseFloat(newTaskEstimate) || 1;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      trackId: newTaskTrack,
      priority: newTaskPriority,
      estimatedPomodoros: estimate,
      completedPomodoros: 0,
      status: 'todo',
      completed: false,
      orderIndex: tasks.length,
      forDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskTrack('');
    setNewTaskPriority('none');
    setNewTaskEstimate('1');
    
    toast({
      title: 'Task added',
      description: newTaskTitle.trim(),
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (currentTaskId === id) {
      setCurrentTaskId(undefined);
    }
  };

  const handleCompleteTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id 
          ? { ...task, completed: true, status: 'done' as TaskStatus, updatedAt: new Date().toISOString() } 
          : task
      )
    );
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, status, updatedAt: new Date().toISOString() } : task))
    );
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍅</span>
            </div>
            <h1 className="text-xl font-bold text-white">Pomofocus</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="default" className="bg-white/20 text-white hover:bg-white/30">
              Timer
            </Button>
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/reports'}>
              Reports
            </Button>
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
          </nav>
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

        {/* Task Input Form */}
        <div className="max-w-4xl mx-auto mt-12 bg-card/50 rounded-2xl p-8 border border-white/10">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="What are you working on?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg py-6"
              />
            </div>
            
            <Select value={newTaskTrack} onValueChange={setNewTaskTrack}>
              <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white py-6">
                <SelectValue placeholder="Select Track..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                {tracks.map(track => (
                  <SelectItem key={track.id} value={track.id} className="text-white">
                    {track.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
              <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white py-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                <SelectItem value="none" className="text-white">No Priority</SelectItem>
                <SelectItem value="low" className="text-white">Low</SelectItem>
                <SelectItem value="medium" className="text-white">Medium</SelectItem>
                <SelectItem value="high" className="text-white">High</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              step="0.25"
              value={newTaskEstimate}
              onChange={(e) => setNewTaskEstimate(e.target.value)}
              className="w-[100px] bg-white/10 border-white/20 text-white text-center py-6"
            />

            <Button 
              onClick={handleAddTask}
              className="bg-white/20 text-white hover:bg-white/30 py-6 px-8"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Task
            </Button>
          </div>
          <p className="text-white/60 text-sm mt-4">
            💡 Use decimals (0.25, 0.5, 1.5) for custom timer durations
          </p>
        </div>

        {/* Kanban Board */}
        <div className="mt-12">
          <KanbanBoard
            tasks={tasks}
            tracks={tracks}
            currentTaskId={currentTaskId}
            onSelectTask={setCurrentTaskId}
            onCompleteTask={handleCompleteTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
