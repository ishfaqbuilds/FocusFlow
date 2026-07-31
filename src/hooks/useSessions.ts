import { useLocalStorage } from "./useLocalStorage";
import { useMemo } from "react";

/** Returns local date as YYYY-MM-DD (not UTC). Fixes the midnight timezone bug. */
export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface Attachment {
  id: string;
  type: "link" | "file";
  name: string;
  url?: string;      // for links
  data?: string;     // base64 for files
  mimeType?: string;
  size?: number;     // bytes
}

export interface Session {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD (LOCAL date)
  timeStart: string;
  timeEnd: string;
  hours: number;
  goalTopic: string;
  remarks: string;
  mood?: number; // 1-5
  tags?: string[];
  difficulty?: "Easy" | "Medium" | "Hard" | "Expert";
  attachments?: Attachment[];
}

export interface Goal {
  id: string;
  subject: string;
  type: "weekly" | "monthly";
  targetHours: number;
  createdAt: string;
}

export interface Profile {
  name: string;
  bio: string;
  avatar: string; // emoji
}

export interface Settings {
  theme: "dark" | "light";
  weeklyGoalHours: number;
  customSubjects: string[];
  profile: Profile;
  customTags: string[];
  timeFormat: "12h" | "24h";
}

const defaultSettings: Settings = {
  theme: "dark",
  weeklyGoalHours: 20,
  customSubjects: [],
  profile: { name: "", bio: "", avatar: "📚" },
  customTags: [],
  timeFormat: "12h",
};

export function useSessions() {
  const [sessions, setSessions] = useLocalStorage<Session[]>(
    "focusflow_sessions",
    []
  );
  const [trash, setTrash] = useLocalStorage<Session[]>(
    "focusflow_trash",
    []
  );

  const addSession = (session: Omit<Session, "id">) => {
    const newSession: Session = { ...session, id: crypto.randomUUID() };
    setSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  /** Moves a session to trash (soft delete) */
  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) setTrash((t) => [target, ...t]);
      return prev.filter((s) => s.id !== id);
    });
  };

  /** Permanently delete from trash */
  const permanentlyDelete = (id: string) => {
    setTrash((prev) => prev.filter((s) => s.id !== id));
  };

  /** Restore from trash back to sessions */
  const restoreSession = (id: string) => {
    setTrash((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) setSessions((s) => [...s, target]);
      return prev.filter((s) => s.id !== id);
    });
  };

  /** Permanently clear all trash */
  const emptyTrash = () => setTrash([]);

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return {
    sessions,
    addSession,
    deleteSession,
    updateSession,
    setSessions,
    trash,
    restoreSession,
    permanentlyDelete,
    emptyTrash,
  };
}

export function useGoals() {
  const [goals, setGoals] = useLocalStorage<Goal[]>("focusflow_goals", []);

  const addGoal = (goal: Omit<Goal, "id" | "createdAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return { goals, addGoal, deleteGoal, setGoals };
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "focusflow_settings",
    defaultSettings
  );

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Migrate older stored settings that may lack new fields
  const mergedSettings: Settings = {
    ...defaultSettings,
    ...settings,
    profile: { ...defaultSettings.profile, ...(settings.profile ?? {}) },
    customTags: settings.customTags ?? [],
    timeFormat: settings.timeFormat ?? "12h",
  };

  return { settings: mergedSettings, updateSettings };
}

export function useStats(sessions: Session[]) {
  return useMemo(() => {
    const today = getLocalDateStr();
    const todaySessions = sessions.filter((s) => s.date === today);
    const todayHours = todaySessions.reduce((sum, s) => sum + s.hours, 0);

    // Streak: count consecutive days with sessions
    // First session = streak 1, consistent days = streak++, break = streak 0
    const sortedDates = Array.from(new Set(sessions.map((s) => s.date))).sort(
      (a, b) => b.localeCompare(a)
    );
    
    if (sortedDates.length === 0) {
      return { todayHours, streak: 0, weekHours, monthCompletionRate };
    }
    
    let streak = 0;
    const mostRecentDate = sortedDates[0];
    
    // Start counting from the most recent study day
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(mostRecentDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = getLocalDateStr(expected);
      
      if (sortedDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    // Weekly goal (week starts Sunday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = getLocalDateStr(weekStart);
    const weekSessions = sessions.filter((s) => s.date >= weekStartStr);
    const weekHours = weekSessions.reduce((sum, s) => sum + s.hours, 0);

    // Monthly completion
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = getLocalDateStr(monthStart);
    const monthSessions = sessions.filter((s) => s.date >= monthStartStr);
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const daysWithSessions = new Set(monthSessions.map((s) => s.date)).size;
    const monthCompletionRate = Math.round(
      (daysWithSessions / daysInMonth) * 100
    );

    return { todayHours, streak, weekHours, monthCompletionRate };
  }, [sessions]);
}
