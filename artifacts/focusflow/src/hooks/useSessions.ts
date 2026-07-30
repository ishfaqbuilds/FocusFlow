import { useLocalStorage } from "./useLocalStorage";
import { useMemo } from "react";

export interface Session {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD
  timeStart: string; // HH:MM
  timeEnd: string; // HH:MM
  hours: number;
  goalTopic: string;
  remarks: string;
  mood?: number; // 1-5
}

export interface Goal {
  id: string;
  subject: string;
  type: "weekly" | "monthly";
  targetHours: number;
  createdAt: string;
}

export interface Settings {
  theme: "dark" | "light";
  weeklyGoalHours: number;
  customSubjects: string[];
}

const defaultSettings: Settings = {
  theme: "dark",
  weeklyGoalHours: 20,
  customSubjects: [],
};

export function useSessions() {
  const [sessions, setSessions] = useLocalStorage<Session[]>(
    "focusflow_sessions",
    []
  );

  const addSession = (session: Omit<Session, "id">) => {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
    };
    setSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return { sessions, addSession, deleteSession, updateSession, setSessions };
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

  return { settings, updateSettings };
}

export function useStats(sessions: Session[]) {
  return useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = sessions.filter((s) => s.date === today);
    const todayHours = todaySessions.reduce((sum, s) => sum + s.hours, 0);

    // Calculate current streak
    let streak = 0;
    const sortedDates = Array.from(
      new Set(sessions.map((s) => s.date))
    ).sort((a, b) => b.localeCompare(a));

    let checkDate = new Date();
    for (const dateStr of sortedDates) {
      const sessionDate = new Date(dateStr + "T00:00:00");
      const daysDiff = Math.floor(
        (checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak || (streak === 0 && daysDiff === 0)) {
        streak++;
        checkDate = sessionDate;
      } else {
        break;
      }
    }

    // Weekly goal progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weekSessions = sessions.filter((s) => s.date >= weekStartStr);
    const weekHours = weekSessions.reduce((sum, s) => sum + s.hours, 0);

    // Monthly completion rate
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const monthSessions = sessions.filter((s) => s.date >= monthStartStr);
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    ).getDate();
    const daysWithSessions = new Set(monthSessions.map((s) => s.date)).size;
    const monthCompletionRate = Math.round(
      (daysWithSessions / daysInMonth) * 100
    );

    return {
      todayHours,
      streak,
      weekHours,
      monthCompletionRate,
    };
  }, [sessions]);
}
