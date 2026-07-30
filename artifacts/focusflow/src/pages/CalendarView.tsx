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
import { getLocalDateStr } from "@/hooks/useSessions";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
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

  // Use local date — fixes the after-midnight timezone bug
  const today = getLocalDateStr();

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth();

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

  // Check if date continues a streak (has session the day before)
  const hasStreak = (dateStr: string): boolean => {
    const date = new Date(dateStr + "T00:00:00");
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionsByDate.has(getLocalDateStr(yesterday));
  };

  const getIntensityColor = (hours: number): string => {
    if (hours === 0) return "bg-muted/30";
    if (hours < 2) return "bg-primary/30";
    if (hours < 4) return "bg-primary/50";
    if (hours < 6) return "bg-primary/70";
    return "bg-primary/90 glow-primary";
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const formatMonthYear = () =>
    currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const selectedDateSessions = selectedDate
    ? sessionsByDate.get(selectedDate) || []
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              {formatMonthYear()}
            </CardTitle>
            <div className="flex gap-2">
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  data-testid="button-go-today"
                  className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Today
                </Button>
              )}
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
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

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
                  transition={{ delay: i * 0.008 }}
                  onClick={() => hasSessions && setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-lg p-1.5 relative transition-all text-left
                    ${getIntensityColor(hours)}
                    ${hasSessions ? "cursor-pointer hover:scale-105 hover:shadow-lg" : "cursor-default"}
                    ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background font-bold" : ""}
                  `}
                >
                  <div className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{day}</div>
                  {hours > 0 && (
                    <div className="text-[10px] font-bold text-primary-foreground/90 leading-tight">
                      {hours.toFixed(1)}h
                    </div>
                  )}
                  {showStreak && (
                    <div className="absolute top-0.5 right-0.5 text-[10px]">🔥</div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span>No study</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/30" />
              <span>&lt;2h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/50" />
              <span>2–4h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/70" />
              <span>4–6h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/90" />
              <span>6h+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🔥</span>
              <span>Streak day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session details dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Sessions on {selectedDate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {selectedDateSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-muted/50 space-y-2 border border-border/50"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{session.subject}</Badge>
                    {session.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {session.difficulty}
                      </Badge>
                    )}
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {session.hours}h
                  </span>
                </div>
                {session.timeStart !== "00:00" && (
                  <div className="text-xs text-muted-foreground">
                    {session.timeStart} – {session.timeEnd}
                  </div>
                )}
                <div className="font-medium text-sm">{session.goalTopic}</div>
                {session.remarks && (
                  <div className="text-sm text-muted-foreground">
                    {session.remarks}
                  </div>
                )}
                {(session.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.tags!.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {session.mood && (
                  <div className="text-sm text-muted-foreground">
                    Mood: {"★".repeat(session.mood)}{"☆".repeat(5 - session.mood)}
                  </div>
                )}
                {(session.attachments ?? []).length > 0 && (
                  <div className="space-y-1">
                    {session.attachments!.map((att) => (
                      <div key={att.id} className="text-xs">
                        {att.type === "link" ? (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {att.name || att.url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            {att.name}
                          </span>
                        )}
                      </div>
                    ))}
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
