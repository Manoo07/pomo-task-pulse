import { useState } from 'react';
import { Task } from '@/types/pomodoro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  currentTaskId?: string;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export const TaskList = ({
  tasks,
  currentTaskId,
  onAddTask,
  onDeleteTask,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
}: TaskListProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What are you working on?"
            className="flex-1 bg-card border-border"
          />
          <Button onClick={handleAddTask} size="icon">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className={`group bg-card rounded-lg p-4 border-2 transition-smooth ${
              currentTaskId === task.id
                ? 'border-primary'
                : 'border-transparent hover:border-border'
            }`}
            onClick={() => onSelectTask(task.id)}
          >
            <div className="flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-0.5 opacity-0 group-hover:opacity-100 transition-smooth" />
              
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleTask(task.id)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <Input
                    defaultValue={task.title}
                    onBlur={(e) => {
                      onUpdateTask(task.id, { title: e.target.value });
                      setEditingId(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        onUpdateTask(task.id, { title: e.currentTarget.value });
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background"
                  />
                ) : (
                  <div
                    className="font-medium cursor-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(task.id);
                    }}
                  >
                    {task.title}
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                  </span>
                  {task.project && (
                    <span className="text-primary">#{task.project}</span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-smooth text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card rounded-lg p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={true} onCheckedChange={() => onToggleTask(task.id)} />
                  <div className="flex-1 line-through text-muted-foreground">
                    {task.title}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
