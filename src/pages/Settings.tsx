import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LearningTrack, Settings as SettingsType } from "@/types/pomodoro";
import { apiClient } from "@/utils/api";
import { Bell, Clock, Plus, Target, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newTrackName, setNewTrackName] = useState("");
  const [localSettings, setLocalSettings] = useState(settings);

  // Load settings and tracks from API
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const [settingsResponse, tracksResponse] = await Promise.all([
          apiClient.getSettings(),
          apiClient.getTracks(),
        ]);

        if ((settingsResponse as any).success) {
          const settingsData =
            (settingsResponse as any).data || defaultSettings;
          setSettings(settingsData);
          setLocalSettings(settingsData);
        }

        if ((tracksResponse as any).success) {
          const tracksData = Array.isArray((tracksResponse as any).data)
            ? (tracksResponse as any).data
            : [];
          setTracks(tracksData);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const settingsData = {
        pomodoroDuration: localSettings.pomodoroDuration,
        shortBreakDuration: localSettings.shortBreakDuration,
        longBreakDuration: localSettings.longBreakDuration,
        longBreakInterval: localSettings.longBreakInterval,
        autoStartBreaks: localSettings.autoStartBreak,
        autoStartPomodoros: localSettings.autoStartPomodoro,
        soundEnabled: localSettings.soundEnabled,
        desktopNotifications: localSettings.notificationsEnabled,
        emailNotifications: false, // Default value
        theme: "dark", // Default value
        language: "en", // Default value
      };

      const response = await apiClient.updateSettings(settingsData);

      if ((response as any).success) {
        setSettings(localSettings);
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated",
        });
      } else {
        throw new Error((response as any).message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTrack = async () => {
    if (!newTrackName.trim()) return;

    try {
      const trackData = {
        name: newTrackName.trim(),
        description: "",
        color: "#3B82F6", // Default blue color
        icon: "📚", // Default icon
      };

      const response = await apiClient.createTrack(trackData);

      if ((response as any).success) {
        setTracks((prev) => [...prev, (response as any).data]);
        setNewTrackName("");
        toast({
          title: "Track added",
          description: newTrackName.trim(),
        });
      } else {
        throw new Error((response as any).message || "Failed to create track");
      }
    } catch (error) {
      console.error("Failed to create track:", error);
      toast({
        title: "Error",
        description: "Failed to create track",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrack = async (id: string) => {
    try {
      const response = await apiClient.deleteTrack(id);

      if ((response as any).success) {
        setTracks((prev) => prev.filter((t) => t.id !== id));
        toast({
          title: "Track deleted",
        });
      } else {
        throw new Error((response as any).message || "Failed to delete track");
      }
    } catch (error) {
      console.error("Failed to delete track:", error);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive",
      });
    }
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
            <Button
              variant="ghost"
              className="text-white/90"
              onClick={() => navigate("/")}
            >
              Timer
            </Button>
            <Button
              variant="ghost"
              className="text-white/90"
              onClick={() => navigate("/reports")}
            >
              Reports
            </Button>
            <Button
              variant="default"
              className="bg-white/20 text-white hover:bg-white/30"
            >
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Timer Settings */}
            <Card className="bg-card/50 border-white/10 p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-white" />
                <h2 className="text-2xl font-bold text-white">
                  Timer Settings
                </h2>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Pomodoro Duration
                     </Label>
                     <p className="text-white/70 text-sm">
                       Length of focus session
                     </p>
                   </div>
                   <div className="flex items-center gap-2 ml-4">
                     <Input
                       type="number"
                       value={localSettings.pomodoroDuration}
                       onChange={(e) =>
                         setLocalSettings({
                           ...localSettings,
                           pomodoroDuration: parseInt(e.target.value),
                         })
                       }
                       className="w-20 bg-white/10 border-white/20 text-white text-center"
                     />
                     <span className="text-white/90 w-16">minutes</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Short Break
                     </Label>
                     <p className="text-white/70 text-sm">
                       Length of short break
                     </p>
                   </div>
                   <div className="flex items-center gap-2 ml-4">
                     <Input
                       type="number"
                       value={localSettings.shortBreakDuration}
                       onChange={(e) =>
                         setLocalSettings({
                           ...localSettings,
                           shortBreakDuration: parseInt(e.target.value),
                         })
                       }
                       className="w-20 bg-white/10 border-white/20 text-white text-center"
                     />
                     <span className="text-white/90 w-16">minutes</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">Long Break</Label>
                     <p className="text-white/70 text-sm">
                       Length of long break
                     </p>
                   </div>
                   <div className="flex items-center gap-2 ml-4">
                     <Input
                       type="number"
                       value={localSettings.longBreakDuration}
                       onChange={(e) =>
                         setLocalSettings({
                           ...localSettings,
                           longBreakDuration: parseInt(e.target.value),
                         })
                       }
                       className="w-20 bg-white/10 border-white/20 text-white text-center"
                     />
                     <span className="text-white/90 w-16">minutes</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Long Break Interval
                     </Label>
                     <p className="text-white/70 text-sm">
                       Long break after N pomodoros
                     </p>
                   </div>
                   <div className="flex items-center gap-2 ml-4">
                     <Input
                       type="number"
                       value={localSettings.longBreakInterval}
                       onChange={(e) =>
                         setLocalSettings({
                           ...localSettings,
                           longBreakInterval: parseInt(e.target.value),
                         })
                       }
                       className="w-20 bg-white/10 border-white/20 text-white text-center"
                     />
                     <span className="text-white/90 w-20">pomodoros</span>
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
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Auto-start Breaks
                     </Label>
                     <p className="text-white/70 text-sm">
                       Automatically start breaks after pomodoro
                     </p>
                   </div>
                   <div className="ml-4">
                     <Switch
                       checked={localSettings.autoStartBreak}
                       onCheckedChange={(checked) =>
                         setLocalSettings({
                           ...localSettings,
                           autoStartBreak: checked,
                         })
                       }
                     />
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Auto-start Pomodoros
                     </Label>
                     <p className="text-white/70 text-sm">
                       Automatically start pomodoro after break
                     </p>
                   </div>
                   <div className="ml-4">
                     <Switch
                       checked={localSettings.autoStartPomodoro}
                       onCheckedChange={(checked) =>
                         setLocalSettings({
                           ...localSettings,
                           autoStartPomodoro: checked,
                         })
                       }
                     />
                   </div>
                 </div>
              </div>
            </Card>

            {/* Sound & Notifications */}
            <Card className="bg-card/50 border-white/10 p-8">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-white" />
                <h2 className="text-2xl font-bold text-white">
                  Sound & Notifications
                </h2>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">End Sound</Label>
                     <p className="text-white/70 text-sm">
                       Play sound when timer ends
                     </p>
                   </div>
                   <div className="ml-4">
                     <Switch
                       checked={localSettings.soundEnabled}
                       onCheckedChange={(checked) =>
                         setLocalSettings({
                           ...localSettings,
                           soundEnabled: checked,
                         })
                       }
                     />
                   </div>
                 </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium">Volume</Label>
                    <span className="text-white/90">
                      {localSettings.volume}%
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.volume]}
                    onValueChange={(value) =>
                      setLocalSettings({ ...localSettings, volume: value[0] })
                    }
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <Label className="text-white font-medium">
                       Desktop Notifications
                     </Label>
                     <p className="text-white/70 text-sm">
                       Show browser notifications
                     </p>
                   </div>
                   <div className="ml-4">
                     <Switch
                       checked={localSettings.notificationsEnabled}
                       onCheckedChange={(checked) =>
                         setLocalSettings({
                           ...localSettings,
                           notificationsEnabled: checked,
                         })
                       }
                     />
                   </div>
                 </div>
              </div>
            </Card>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-white text-primary hover:bg-white/90 py-6 text-lg font-semibold"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>

            {/* Learning Tracks */}
            <Card className="bg-card/50 border-white/10 p-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-white" />
                <h2 className="text-2xl font-bold text-white">
                  Learning Tracks
                </h2>
              </div>
              <p className="text-white/70 mb-6">
                Manage your learning categories. Tasks can only use these
                predefined tracks.
              </p>

              <div className="flex gap-2 mb-6">
                <Input
                  value={newTrackName}
                  onChange={(e) => setNewTrackName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTrack()}
                  placeholder="e.g., Deep Learning, MLOps, etc."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button
                  onClick={handleAddTrack}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Track
                </Button>
              </div>

              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between bg-white/10 rounded-lg p-4"
                  >
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
          </>
        )}
      </main>
    </div>
  );
};

export default Settings;
