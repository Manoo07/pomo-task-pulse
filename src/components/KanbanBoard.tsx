import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LearningTrack, Task, TaskStatus } from "@/types/pomodoro";
import { Trash2 } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  tracks: LearningTrack[];
  currentTaskId?: string;
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onStartTimer?: () => void;
}

const priorityColors = {
  none: "bg-muted text-muted-foreground border-subtle",
  low: "bg-success/20 text-success border-success hover:bg-success/30",
  medium: "bg-warning/20 text-warning border-warning hover:bg-warning/30",
  high: "bg-destructive/20 text-destructive border-error hover:bg-destructive/30",
};

const priorityLabels = {
  none: "No Priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const KanbanBoard = ({
  tasks,
  tracks,
  currentTaskId,
  onSelectTask,
  onCompleteTask,
  onDeleteTask,
  onStartTimer,
}: KanbanBoardProps) => {
  const todoTasks = tasks.filter((t) => t.status === "todo" && !t.completed);
  const doingTasks = tasks.filter((t) => t.status === "doing" && !t.completed);
  const doneTasks = tasks.filter((t) => t.status === "done" || t.completed);

  const getTrackName = (trackId: string) => {
    return tracks.find((t) => t.id === trackId)?.name || "Unknown Track";
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const progress =
      task.estimatedPomodoros > 0
        ? Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100)
        : 0;

    return (
      <div
        className={`bg-card/60 border border-white/10 rounded-lg p-4 cursor-pointer transition-all hover:bg-card/70 hover:border-white/20 ${
          currentTaskId === task.id
            ? "ring-2 ring-primary/30 border-primary shadow-lg scale-[1.02]"
            : ""
        }`}
        onClick={() => onSelectTask(task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-foreground font-medium flex-1">{task.title}</h3>
          <div className="flex gap-2 ml-2">
            {currentTaskId === task.id && (
              <Badge className="bg-primary/20 text-primary border border-primary/30">
                Active
              </Badge>
            )}
            {task.priority !== "none" && (
              <Badge
                className={`${priorityColors[task.priority]} transition-colors`}
              >
                {priorityLabels[task.priority]}
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-3">
          <Badge className="bg-muted/50 text-muted-foreground border border-white/10 hover:bg-muted/70">
            {getTrackName(task.trackId)}
          </Badge>
        </div>

        {task.notes && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {task.notes}
          </p>
        )}

        <div className="flex items-center gap-1 text-foreground text-sm mb-4">
          <span>
            {task.completedPomodoros.toFixed(2)}/
            {task.estimatedPomodoros.toFixed(2)}
          </span>
          <span>🍅</span>
          <span className="text-muted-foreground">({progress}%)</span>
        </div>

        <div className="flex gap-2">
          {task.status === "todo" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTask(task.id);
                onStartTimer?.();
              }}
              className="flex-1 border border-white/10 hover:border-primary bg-primary/20 text-primary hover:bg-primary/30"
            >
              Select & Start
            </Button>
          )}
          {task.status === "doing" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCompleteTask(task.id);
              }}
              className="flex-1 border border-white/10 bg-success/30 text-success hover:bg-success/40 hover:border-success/70"
            >
              Mark Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border border-white/10 hover:border-destructive/70"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const Column = ({
    title,
    tasks: columnTasks,
    bgColor,
    borderColor,
  }: {
    title: string;
    tasks: Task[];
    bgColor: string;
    borderColor: string;
  }) => (
    <div className="flex-1 min-w-[280px]">
      <div
        className={`${bgColor} border border-white/10 rounded-t-xl p-4 flex items-center justify-between`}
      >
        <h2 className="text-white font-bold text-lg">{title}</h2>
        <Badge className="bg-white/20 text-white border border-white/30">
          {columnTasks.length}
        </Badge>
      </div>
      <div className="bg-card/30 border border-white/10 rounded-b-xl p-4 min-h-[400px] space-y-3">
        {columnTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {title === "TODO" && "No pending tasks"}
            {title === "DOING" && "One task active at a time"}
            {title === "DONE" && "No completed tasks"}
          </p>
        ) : (
          columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[900px]">
        <Column
          title="TODO"
          tasks={todoTasks}
          bgColor="bg-card/90"
          borderColor=""
        />
        <Column
          title="DOING"
          tasks={doingTasks}
          bgColor="bg-warning/90"
          borderColor=""
        />
        <Column
          title="DONE"
          tasks={doneTasks}
          bgColor="bg-success/90"
          borderColor=""
        />
      </div>
    </div>
  );
};
