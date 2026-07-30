import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/hooks/useSessions";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";

interface CalendarViewProps {
  sessions: Session[];
}

export default function CalendarView({ sessions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const today = new Date().toISOString().split("T")[0];

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const existing = map.get(session.date) || [];
      map.set(session.date, [...existing, session]);
    });
    return map;
  }, [sessions]);

  // Calculate hours per day for color intensity
  const hoursPerDate = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      const existing = map.get(session.date) || 0;
      map.set(session.date, existing + session.hours);
    });
    return map;
  }, [sessions]);

  // Check if date has consecutive day before (for streak)
  const hasStreak = (dateStr: string): boolean => {
    const date = new Date(dateStr + "T00:00:00");
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    return sessionsByDate.has(yesterdayStr);
  };

  const getIntensityColor = (hours: number): string => {
    if (hours === 0) return "bg-muted/30";
    if (hours < 2) return "bg-primary/30";
    if (hours < 4) return "bg-primary/50";
    if (hours < 6) return "bg-primary/70";
    return "bg-primary/90 glow-primary";
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const selectedDateSessions = selectedDate
    ? sessionsByDate.get(selectedDate) || []
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              {formatMonthYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hours = hoursPerDate.get(dateStr) || 0;
              const hasSessions = sessionsByDate.has(dateStr);
              const isToday = dateStr === today;
              const showStreak = hasSessions && hasStreak(dateStr);

              return (
                <motion.button
                  key={day}
                  data-testid={`calendar-day-${day}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  onClick={() => hasSessions && setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-lg p-2 relative transition-all
                    ${getIntensityColor(hours)}
                    ${hasSessions ? "cursor-pointer hover:scale-105 hover:shadow-lg" : ""}
                    ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                  `}
                >
                  <div className="text-sm font-medium">{day}</div>
                  {hours > 0 && (
                    <div className="text-xs font-bold text-primary-foreground mt-1">
                      {hours.toFixed(1)}h
                    </div>
                  )}
                  {showStreak && (
                    <div className="absolute top-1 right-1 text-xs">🔥</div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/30" />
              <span>No study</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/30" />
              <span>&lt; 2h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/70" />
              <span>4-6h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/90" />
              <span>6h+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session details dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessions on {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedDateSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge>{session.subject}</Badge>
                  <span className="text-lg font-bold text-primary">
                    {session.hours}h
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.timeStart} - {session.timeEnd}
                </div>
                <div className="font-medium">{session.goalTopic}</div>
                {session.remarks && (
                  <div className="text-sm text-muted-foreground">
                    {session.remarks}
                  </div>
                )}
                {session.mood && (
                  <div className="text-sm">
                    Mood: {"⭐".repeat(session.mood)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
