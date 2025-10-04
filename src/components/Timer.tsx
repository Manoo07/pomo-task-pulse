import { TimerMode, TimerStatus } from '@/types/pomodoro';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerProps {
  mode: TimerMode;
  status: TimerStatus;
  secondsLeft: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const modeLabels: Record<TimerMode, string> = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export const Timer = ({
  mode,
  status,
  secondsLeft,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
}: TimerProps) => {
  const modeColors: Record<TimerMode, string> = {
    pomodoro: 'bg-pomodoro',
    shortBreak: 'bg-short-break',
    longBreak: 'bg-long-break',
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8">
        {(['pomodoro', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onSwitchMode(m)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-smooth ${
              mode === m
                ? 'bg-card text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div
        className={`${modeColors[mode]} rounded-2xl p-12 timer-shadow transition-smooth`}
      >
        <div className="text-center">
          <div className="text-8xl font-bold mb-8 text-white tracking-tight">
            {formatTime(secondsLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={status === 'running' ? onPause : onStart}
              className="bg-white text-background hover:bg-white/90 px-12 py-6 text-xl font-semibold transition-smooth"
            >
              {status === 'running' ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </>
              )}
            </Button>
            
            {status !== 'idle' && (
              <Button
                size="lg"
                variant="ghost"
                onClick={onReset}
                className="text-white hover:bg-white/10"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <kbd className="px-2 py-1 bg-card rounded">Space</kbd> to start/pause •{' '}
        <kbd className="px-2 py-1 bg-card rounded">R</kbd> to reset •{' '}
        <kbd className="px-2 py-1 bg-card rounded">1</kbd>
        <kbd className="px-2 py-1 bg-card rounded">2</kbd>
        <kbd className="px-2 py-1 bg-card rounded">3</kbd> to switch modes
      </div>
    </div>
  );
};
