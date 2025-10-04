import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings as SettingsType, LearningTrack } from '@/types/pomodoro';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Clock, Zap, Bell, Target, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const defaultSettings: SettingsType = {
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

const Settings = () => {
  const [settings, setSettings] = useLocalStorage<SettingsType>('pomodoro-settings', defaultSettings);
  const [tracks, setTracks] = useLocalStorage<LearningTrack[]>('learning-tracks', [
    { id: '1', name: 'Machine Learning' },
    { id: '2', name: 'Computer Vision' },
    { id: '3', name: 'LLMs & NLP' },
  ]);
  
  const [newTrackName, setNewTrackName] = useState('');
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    setSettings(localSettings);
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated',
    });
  };

  const handleAddTrack = () => {
    if (newTrackName.trim()) {
      const newTrack: LearningTrack = {
        id: Date.now().toString(),
        name: newTrackName.trim(),
      };
      setTracks([...tracks, newTrack]);
      setNewTrackName('');
      toast({
        title: 'Track added',
        description: newTrackName.trim(),
      });
    }
  };

  const handleDeleteTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
    toast({
      title: 'Track deleted',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍅</span>
            </div>
            <h1 className="text-xl font-bold text-white">Pomofocus</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/'}>
              Timer
            </Button>
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/reports'}>
              Reports
            </Button>
            <Button variant="default" className="bg-white/20 text-white hover:bg-white/30">
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        {/* Timer Settings */}
        <Card className="bg-card/50 border-white/10 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-white" />
            <h2 className="text-2xl font-bold text-white">Timer Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Pomodoro Duration</Label>
                <p className="text-white/70 text-sm">Length of focus session</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localSettings.pomodoroDuration}
                  onChange={(e) => setLocalSettings({...localSettings, pomodoroDuration: parseInt(e.target.value)})}
                  className="w-20 bg-white/10 border-white/20 text-white text-center"
                />
                <span className="text-white/90">minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Short Break</Label>
                <p className="text-white/70 text-sm">Length of short break</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => setLocalSettings({...localSettings, shortBreakDuration: parseInt(e.target.value)})}
                  className="w-20 bg-white/10 border-white/20 text-white text-center"
                />
                <span className="text-white/90">minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Long Break</Label>
                <p className="text-white/70 text-sm">Length of long break</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => setLocalSettings({...localSettings, longBreakDuration: parseInt(e.target.value)})}
                  className="w-20 bg-white/10 border-white/20 text-white text-center"
                />
                <span className="text-white/90">minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Long Break Interval</Label>
                <p className="text-white/70 text-sm">Long break after N pomodoros</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localSettings.longBreakInterval}
                  onChange={(e) => setLocalSettings({...localSettings, longBreakInterval: parseInt(e.target.value)})}
                  className="w-20 bg-white/10 border-white/20 text-white text-center"
                />
                <span className="text-white/90">pomodoros</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Auto-Start */}
        <Card className="bg-card/50 border-white/10 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-white" />
            <h2 className="text-2xl font-bold text-white">Auto-Start</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Auto-start Breaks</Label>
                <p className="text-white/70 text-sm">Automatically start breaks after pomodoro</p>
              </div>
              <Switch
                checked={localSettings.autoStartBreak}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, autoStartBreak: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Auto-start Pomodoros</Label>
                <p className="text-white/70 text-sm">Automatically start pomodoro after break</p>
              </div>
              <Switch
                checked={localSettings.autoStartPomodoro}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, autoStartPomodoro: checked})}
              />
            </div>
          </div>
        </Card>

        {/* Sound & Notifications */}
        <Card className="bg-card/50 border-white/10 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-white" />
            <h2 className="text-2xl font-bold text-white">Sound & Notifications</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">End Sound</Label>
                <p className="text-white/70 text-sm">Play sound when timer ends</p>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, soundEnabled: checked})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">Volume</Label>
                <span className="text-white/90">{localSettings.volume}%</span>
              </div>
              <Slider
                value={[localSettings.volume]}
                onValueChange={(value) => setLocalSettings({...localSettings, volume: value[0]})}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Desktop Notifications</Label>
                <p className="text-white/70 text-sm">Show browser notifications</p>
              </div>
              <Switch
                checked={localSettings.notificationsEnabled}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, notificationsEnabled: checked})}
              />
            </div>
          </div>
        </Card>

        <Button 
          onClick={handleSave}
          className="w-full bg-white text-primary hover:bg-white/90 py-6 text-lg font-semibold"
        >
          Save Settings
        </Button>

        {/* Learning Tracks */}
        <Card className="bg-card/50 border-white/10 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-white" />
            <h2 className="text-2xl font-bold text-white">Learning Tracks</h2>
          </div>
          <p className="text-white/70 mb-6">Manage your learning categories. Tasks can only use these predefined tracks.</p>
          
          <div className="flex gap-2 mb-6">
            <Input
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTrack()}
              placeholder="e.g., Deep Learning, MLOps, etc."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button onClick={handleAddTrack} className="bg-white/20 text-white hover:bg-white/30">
              <Plus className="mr-2 h-4 w-4" />
              Add Track
            </Button>
          </div>

          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                <span className="text-white font-medium">{track.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTrack(track.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
