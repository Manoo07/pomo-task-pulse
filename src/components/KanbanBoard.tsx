import { Task, TaskStatus, LearningTrack } from '@/types/pomodoro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  tracks: LearningTrack[];
  currentTaskId?: string;
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityColors = {
  none: 'bg-muted/50 text-white',
  low: 'bg-success text-white',
  medium: 'bg-warning text-white',
  high: 'bg-destructive text-white',
};

const priorityLabels = {
  none: 'No Priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const KanbanBoard = ({
  tasks,
  tracks,
  currentTaskId,
  onSelectTask,
  onCompleteTask,
  onDeleteTask,
}: KanbanBoardProps) => {
  const todoTasks = tasks.filter(t => t.status === 'todo' && !t.completed);
  const doingTasks = tasks.filter(t => t.status === 'doing' && !t.completed);
  const doneTasks = tasks.filter(t => t.status === 'done' || t.completed);

  const getTrackName = (trackId: string) => {
    return tracks.find(t => t.id === trackId)?.name || 'Unknown Track';
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const progress = task.estimatedPomodoros > 0 
      ? Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100)
      : 0;

    return (
      <div 
        className={`bg-white/10 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/15 ${
          currentTaskId === task.id ? 'ring-2 ring-white' : ''
        }`}
        onClick={() => onSelectTask(task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-medium flex-1">{task.title}</h3>
          {task.priority !== 'none' && (
            <Badge className={`${priorityColors[task.priority]} ml-2`}>
              {priorityLabels[task.priority]}
            </Badge>
          )}
        </div>

        <div className="mb-3">
          <Badge className="bg-white/20 text-white border-white/30">
            {getTrackName(task.trackId)}
          </Badge>
        </div>

        {task.notes && (
          <p className="text-white/70 text-sm mb-3 line-clamp-2">{task.notes}</p>
        )}

        <div className="flex items-center gap-1 text-white/90 text-sm mb-4">
          <span>{task.completedPomodoros.toFixed(2)}/{task.estimatedPomodoros.toFixed(2)}</span>
          <span>🍅</span>
          <span className="text-white/70">({progress}%)</span>
        </div>

        <div className="flex gap-2">
          {task.status !== 'done' && (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask(task.id);
                }}
                className="flex-1 bg-white/20 text-white hover:bg-white/30 border-0"
              >
                Select
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask(task.id);
                }}
                className="flex-1 bg-success text-white hover:bg-success/90"
              >
                Complete
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/20"
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
    bgColor 
  }: { 
    title: string; 
    tasks: Task[]; 
    bgColor: string;
  }) => (
    <div className="flex-1 min-w-[280px]">
      <div className={`${bgColor} rounded-t-xl p-4 flex items-center justify-between`}>
        <h2 className="text-white font-bold text-lg">{title}</h2>
        <Badge className="bg-white/20 text-white border-0">{columnTasks.length}</Badge>
      </div>
      <div className="bg-card/30 rounded-b-xl p-4 min-h-[400px] space-y-3">
        {columnTasks.length === 0 ? (
          <p className="text-white/50 text-center py-8">
            {title === 'DOING' ? 'Select a task and start timer' : 'No tasks'}
          </p>
        ) : (
          columnTasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[900px]">
        <Column title="TODO" tasks={todoTasks} bgColor="bg-card" />
        <Column title="DOING" tasks={doingTasks} bgColor="bg-warning" />
        <Column title="DONE" tasks={doneTasks} bgColor="bg-success" />
      </div>
    </div>
  );
};
