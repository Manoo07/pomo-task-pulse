import { KanbanBoard } from "@/components/KanbanBoard";
import { Timer } from "@/components/Timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTimer } from "@/hooks/useTimer";
import { apiClient } from "@/utils/api";
import {
  LearningTrack,
  Priority,
  Session,
  Settings,
  Task,
  TaskStatus,
} from "@/types/pomodoro";
import { LogOut, Mail, Plus, User } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings] = useLocalStorage<Settings>(
    "pomodoro-settings",
    defaultSettings
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();

  // Ref for timer start button
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Load data from API on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load tasks, tracks, and sessions in parallel
        const [tasksResponse, tracksResponse, sessionsResponse] = await Promise.all([
          apiClient.getTasks(),
          apiClient.getTracks(),
          apiClient.getSessionHistory({ limit: 50 })
        ]);

        if (tasksResponse.success) {
          setTasks(tasksResponse.data || []);
        }
        
        if (tracksResponse.success) {
          setTracks(tracksResponse.data || []);
        }
        
        if (sessionsResponse.success) {
          setSessions(sessionsResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTrack, setNewTaskTrack] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("none");
  const [newTaskEstimate, setNewTaskEstimate] = useState("1");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Task management functions
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskTrack) {
      return;
    }

    try {
      const estimate = parseFloat(newTaskEstimate) || 1;
      
      const taskData = {
        title: newTaskTitle.trim(),
        description: "",
        priority: newTaskPriority === "none" ? "MEDIUM" : newTaskPriority.toUpperCase(),
        estimatedPomodoros: estimate,
        trackId: newTaskTrack,
      };

      const response = await apiClient.createTask(taskData);
      
      if (response.success) {
        setTasks((prev) => [...prev, response.data]);
        setNewTaskTitle("");
        setNewTaskTrack("");
        setNewTaskPriority("none");
        setNewTaskEstimate("1");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await apiClient.deleteTask(id);
      
      if (response.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (currentTaskId === id) {
          setCurrentTaskId(undefined);
        }
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const response = await apiClient.updateTask(id, {
        status: "COMPLETED",
        completedPomodoros: tasks.find(t => t.id === id)?.estimatedPomodoros || 0
      });
      
      if (response.success) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: true,
                  status: "done" as TaskStatus,
                  updatedAt: new Date().toISOString(),
                }
              : task
          )
        );

        // Clear current task if it was completed
        if (currentTaskId === id) {
          setCurrentTaskId(undefined);
        }
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      // Convert frontend status to backend status
      const backendStatus = status === "todo" ? "TODO" : 
                           status === "doing" ? "IN_PROGRESS" : 
                           status === "done" ? "COMPLETED" : "TODO";

      const response = await apiClient.updateTask(id, { status: backendStatus });
      
      if (response.success) {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              // If moving a task to DOING, move any current DOING task back to TODO
              if (status === "doing") {
                return { ...task, status, updatedAt: new Date().toISOString() };
              }
              return { ...task, status, updatedAt: new Date().toISOString() };
            } else if (status === "doing" && task.status === "doing") {
              // Move any other DOING task back to TODO
              return {
                ...task,
                status: "todo",
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          })
        );
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

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
    onTimerComplete: () => {},
    onTimerStart: () => {},
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-60 border-b border-white/10 bg-card/95">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Tomato icon matching the design */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">🍅</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Pomofocus</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 text-sm text-white/90">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-green-400">
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex gap-1">
              <Button
                variant="default"
                className="bg-white/20 text-white hover:bg-white/30 border border-white/10 hover:border-white/20"
              >
                Timer
              </Button>
              <Button
                variant="ghost"
                className="text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/reports");
                }}
              >
                Reports
              </Button>
              <Button
                variant="ghost"
                className="text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/settings");
                }}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                className="text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/10"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div ref={startButtonRef}>
          <Timer
            mode={mode}
            status={status}
            secondsLeft={secondsLeft}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onSwitchMode={switchMode}
            startButtonRef={startButtonRef}
          />
        </div>

        {/* Task Input Form */}
        <div className="w-full overflow-x-auto mt-12">
          <div
            className="bg-card/80 rounded-2xl p-8 border border-white/10 shadow-sm"
            style={{ minWidth: "900px" }}
          >
            <div className="flex gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What are you working on?"
                  className="bg-card/50 border border-white/10 text-foreground placeholder:text-muted-foreground text-lg py-6 focus:border-primary/70 focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <Select value={newTaskTrack} onValueChange={setNewTaskTrack}>
                <SelectTrigger className="w-[150px] bg-card/50 border border-white/10 text-foreground py-6 focus:border-primary/70 focus:ring-2 focus:ring-primary/30">
                  <SelectValue placeholder="Select Track..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-white/10">
                  {tracks.map((track) => (
                    <SelectItem
                      key={track.id}
                      value={track.id}
                      className="text-foreground hover:bg-card/50"
                    >
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newTaskPriority}
                onValueChange={(v) => setNewTaskPriority(v as Priority)}
              >
                <SelectTrigger className="w-[120px] bg-card/50 border border-white/10 text-foreground py-6 focus:border-primary/70 focus:ring-2 focus:ring-primary/30">
                  <SelectValue placeholder="No Priority" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-white/10">
                  <SelectItem
                    value="none"
                    className="text-foreground hover:bg-card/50"
                  >
                    No Priority
                  </SelectItem>
                  <SelectItem
                    value="low"
                    className="text-foreground hover:bg-card/50"
                  >
                    Low
                  </SelectItem>
                  <SelectItem
                    value="medium"
                    className="text-foreground hover:bg-card/50"
                  >
                    Medium
                  </SelectItem>
                  <SelectItem
                    value="high"
                    className="text-foreground hover:bg-card/50"
                  >
                    High
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="10"
                value={newTaskEstimate}
                onChange={(e) => setNewTaskEstimate(e.target.value)}
                className="w-[100px] bg-card/50 border border-white/10 text-foreground text-center py-6 focus:border-primary/70 focus:ring-2 focus:ring-primary/30"
              />

              <Button
                onClick={handleAddTask}
                className="border border-white/10 hover:border-primary bg-primary/20 text-primary hover:bg-primary/30 py-6 px-8 focus:border-primary/70 focus:ring-2 focus:ring-primary/30"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Task
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              💡 Use decimals (0.25, 0.5, 1.5) for custom timer durations
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your tasks...</p>
              </div>
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              tracks={tracks}
              currentTaskId={currentTaskId}
              onSelectTask={setCurrentTaskId}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
