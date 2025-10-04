import { useEffect } from 'react';
import { TimerMode, TimerStatus } from '@/types/pomodoro';

interface UseKeyboardShortcutsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void;
}

export const useKeyboardShortcuts = ({
  status,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (status === 'running') {
            onPause();
          } else {
            onStart();
          }
          break;
        case 'r':
          e.preventDefault();
          onReset();
          break;
        case '1':
          e.preventDefault();
          onSwitchMode('pomodoro');
          break;
        case '2':
          e.preventDefault();
          onSwitchMode('shortBreak');
          break;
        case '3':
          e.preventDefault();
          onSwitchMode('longBreak');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [status, onStart, onPause, onReset, onSwitchMode]);
};
