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
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode Tabs */}
      <div className="flex gap-3 mb-8 justify-center">
        {(['pomodoro', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onSwitchMode(m)}
            className={`py-3 px-6 rounded-xl font-medium transition-smooth ${
              mode === m
                ? 'bg-white/30 text-white backdrop-blur-sm'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className={`${modeColors[mode]} rounded-3xl p-16 shadow-2xl`}>
        <div className="text-center">
          <div className="text-9xl font-bold mb-4 text-white tracking-tight">
            {formatTime(secondsLeft)}
          </div>
          <div className="text-2xl text-white/90 font-medium mb-2">
            #{Math.floor((Date.now() / 86400000) % 100)} Time to focus!
          </div>
          <div className="text-lg text-white/70 italic">
            No task selected
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          size="lg"
          onClick={status === 'running' ? onPause : onStart}
          className="bg-white text-primary hover:bg-white/90 px-16 py-7 text-xl font-semibold rounded-xl shadow-lg"
        >
          {status === 'running' ? 'PAUSE' : 'START'}
        </Button>
        
        <Button
          size="lg"
          onClick={onReset}
          className="bg-white/20 text-white hover:bg-white/30 px-12 py-7 text-xl font-semibold rounded-xl"
        >
          RESET
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-8 text-center text-sm text-white/60">
        <kbd className="px-2 py-1 bg-white/10 rounded">Space</kbd> to start/pause •{' '}
        <kbd className="px-2 py-1 bg-white/10 rounded">R</kbd> to reset •{' '}
        <kbd className="px-2 py-1 bg-white/10 rounded">1</kbd>
        <kbd className="px-2 py-1 bg-white/10 rounded">2</kbd>
        <kbd className="px-2 py-1 bg-white/10 rounded">3</kbd> to switch modes
      </div>
    </div>
  );
};
