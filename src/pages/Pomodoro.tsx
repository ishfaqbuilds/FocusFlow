import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Timer, Play, Pause, RotateCcw, Coffee, Settings, Save } from "lucide-react";
import { motion } from "framer-motion";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_LABELS = {
  work: "Focus Time",
  shortBreak: "Short Break", 
  longBreak: "Long Break",
};

const MODE_COLORS = {
  work: "text-primary",
  shortBreak: "text-green-500",
  longBreak: "text-blue-500",
};

const MODE_BG_COLORS = {
  work: "bg-primary",
  shortBreak: "bg-green-500",
  longBreak: "bg-blue-500",
};

export default function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [editSettings, setEditSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pomodoroSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        setEditSettings(parsed);
        setTimeLeft(parsed.work * 60);
      } catch (e) {
        console.error("Failed to load pomodoro settings", e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(editSettings));
    setSettings(editSettings);
    setTimeLeft(editSettings[mode] * 60);
    setIsEditing(false);
    toast({ title: "Settings saved", description: "Your timer durations have been updated" });
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Play notification sound
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRAWD7eK3Nt1ZRAFP4rqeHxxlUEA");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}

    toast({
      title: mode === "work" ? "Focus session complete! 🎉" : "Break is over! ☕",
      description: mode === "work" 
        ? "Great job! Take a break to recharge." 
        : "Ready to get back to work?",
    });

    // Auto-switch to next mode
    if (mode === "work") {
      setMode("shortBreak");
      setTimeLeft(settings.shortBreak * 60);
    } else {
      setMode("work");
      setTimeLeft(settings.work * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings[mode] * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progress = ((settings[mode] * 60 - timeLeft) / (settings[mode] * 60)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Timer className="h-6 w-6" />
            Pomodoro Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2">
            {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                size="sm"
                onClick={() => switchMode(m)}
                className="flex-1"
              >
                {m === "work" && "🎯 Focus"}
                {m === "shortBreak" && "☕ Short"}
                {m === "longBreak" && "🌴 Long"}
              </Button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className={`text-7xl font-bold ${MODE_COLORS[mode]}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-muted-foreground">{MODE_LABELS[mode]}</p>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${MODE_BG_COLORS[mode]}`}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="flex-1 max-w-40"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-muted/50 rounded-lg border"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Customize Timer Durations
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Focus (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={editSettings.work}
                    onChange={(e) => setEditSettings({ ...editSettings, work: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Break (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={editSettings.shortBreak}
                    onChange={(e) => setEditSettings({ ...editSettings, shortBreak: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={editSettings.longBreak}
                    onChange={(e) => setEditSettings({ ...editSettings, longBreak: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveSettings} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditSettings(settings);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>💡 Tip: After 4 focus sessions, take a longer break</p>
            <p>🎯 Stay focused and take regular breaks to maintain productivity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}