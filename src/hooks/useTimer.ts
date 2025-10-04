import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, TimerStatus, Settings } from '@/types/pomodoro';

interface UseTimerProps {
  settings: Settings;
  onTimerComplete: (mode: TimerMode) => void;
}

export const useTimer = ({ settings, onTimerComplete }: UseTimerProps) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(settings.pomodoroDuration * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getDuration = useCallback((timerMode: TimerMode): number => {
    switch (timerMode) {
      case 'pomodoro':
        return settings.pomodoroDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setStatus('idle');
    setSecondsLeft(getDuration(newMode));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [getDuration]);

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setSecondsLeft(getDuration(mode));
  }, [mode, getDuration]);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.play().catch(() => {});
    }
  }, [settings.soundEnabled, settings.volume]);

  const showNotification = useCallback((message: string) => {
    if (settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Pomodoro Timer', { body: message });
          }
        });
      }
    }
  }, [settings.notificationsEnabled]);

  const handleTimerComplete = useCallback(() => {
    playSound();
    
    if (mode === 'pomodoro') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      const nextMode = newCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      showNotification(`Pomodoro complete! Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break.`);
      
      onTimerComplete(mode);
      
      if (settings.autoStartBreak) {
        switchMode(nextMode);
        setTimeout(() => start(), 1000);
      } else {
        switchMode(nextMode);
      }
    } else {
      showNotification('Break complete! Ready for another Pomodoro?');
      
      if (settings.autoStartPomodoro) {
        switchMode('pomodoro');
        setTimeout(() => start(), 1000);
      } else {
        switchMode('pomodoro');
      }
    }
  }, [mode, pomodoroCount, settings, playSound, showNotification, onTimerComplete, switchMode, start]);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setStatus('idle');
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, handleTimerComplete]);

  useEffect(() => {
    setSecondsLeft(getDuration(mode));
  }, [settings, getDuration, mode]);

  useEffect(() => {
    // Create audio element for end sound
    audioRef.current = new Audio('/sounds/complete.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  return {
    mode,
    status,
    secondsLeft,
    pomodoroCount,
    start,
    pause,
    reset,
    switchMode,
  };
};
