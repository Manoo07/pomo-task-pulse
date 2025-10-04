import { Settings } from '@/types/pomodoro';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { SettingsIcon } from 'lucide-react';
import { useState } from 'react';

interface SettingsDialogProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export const SettingsDialog = ({ settings, onSave }: SettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Pomodoro timer preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Durations */}
          <div className="space-y-4">
            <h3 className="font-semibold">Timer Duration (minutes)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="pomodoro">Pomodoro</Label>
              <Input
                id="pomodoro"
                type="number"
                min="1"
                max="60"
                value={localSettings.pomodoroDuration}
                onChange={(e) => updateSetting('pomodoroDuration', parseInt(e.target.value) || 25)}
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortBreak">Short Break</Label>
              <Input
                id="shortBreak"
                type="number"
                min="1"
                max="30"
                value={localSettings.shortBreakDuration}
                onChange={(e) => updateSetting('shortBreakDuration', parseInt(e.target.value) || 5)}
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longBreak">Long Break</Label>
              <Input
                id="longBreak"
                type="number"
                min="1"
                max="60"
                value={localSettings.longBreakDuration}
                onChange={(e) => updateSetting('longBreakDuration', parseInt(e.target.value) || 15)}
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Long Break Interval</Label>
              <Input
                id="interval"
                type="number"
                min="2"
                max="10"
                value={localSettings.longBreakInterval}
                onChange={(e) => updateSetting('longBreakInterval', parseInt(e.target.value) || 4)}
                className="bg-card"
              />
            </div>
          </div>

          {/* Auto-start Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Auto-start</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoPomodoro">Auto-start Pomodoros</Label>
              <Switch
                id="autoPomodoro"
                checked={localSettings.autoStartPomodoro}
                onCheckedChange={(checked) => updateSetting('autoStartPomodoro', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoBreak">Auto-start Breaks</Label>
              <Switch
                id="autoBreak"
                checked={localSettings.autoStartBreak}
                onCheckedChange={(checked) => updateSetting('autoStartBreak', checked)}
              />
            </div>
          </div>

          {/* Sound & Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sound & Notifications</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound">Sound</Label>
              <Switch
                id="sound"
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Volume: {localSettings.volume}%</Label>
              <Slider
                id="volume"
                min={0}
                max={100}
                step={10}
                value={[localSettings.volume]}
                onValueChange={([value]) => updateSetting('volume', value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Desktop Notifications</Label>
              <Switch
                id="notifications"
                checked={localSettings.notificationsEnabled}
                onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <DialogTrigger asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button onClick={handleSave}>Save Settings</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
};
