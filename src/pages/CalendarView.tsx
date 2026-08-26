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
import type { Session, Settings } from "@/hooks/useSessions";
import { formatTimeStr } from "@/lib/utils";
import { getLocalDateStr } from "@/hooks/useSessions";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

interface CalendarViewProps {
  sessions: Session[];
  settings: Settings;
}

export default function CalendarView({ sessions, settings }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const today = getLocalDateStr();

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth();

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const existing = map.get(session.date) || [];
      map.set(session.date, [...existing, session]);
    });
    return map;
  }, [sessions]);

  const hoursPerDate = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      const existing = map.get(session.date) || 0;
      map.set(session.date, existing + session.hours);
    });
    return map;
  }, [sessions]);

  const hasStreak = (dateStr: string): boolean => {
    const date = new Date(dateStr + "T00:00:00");
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionsByDate.has(getLocalDateStr(yesterday));
  };

  const getIntensityColor = (hours: number): string => {
    if (hours === 0) return "bg-muted/20";
    if (hours < 2)  return "bg-primary/25";
    if (hours < 4)  return "bg-primary/45";
    if (hours < 6)  return "bg-primary/65";
    return "bg-primary/85";
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday  = () => setCurrentDate(new Date());

  const formatMonthYear = () =>
    currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const selectedDateSessions = selectedDate
    ? sessionsByDate.get(selectedDate) || []
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {formatMonthYear()}
            </CardTitle>
            <div className="flex gap-1.5">
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <CalendarDays className="h-3 w-3" />
                  Today
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid — compact cells */}
          <div className="grid grid-cols-7 gap-[3px]">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
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
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.006 }}
                  onClick={() => hasSessions && setSelectedDate(dateStr)}
                  className={`
                    relative flex flex-col items-center justify-center
                    rounded-md py-1 transition-all text-center
                    ${getIntensityColor(hours)}
                    ${hasSessions ? "cursor-pointer hover:scale-105 hover:brightness-110" : "cursor-default"}
                    ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                  `}
                  style={{ minHeight: "36px" }}
                >
                  <span className={`text-[11px] font-semibold leading-none ${isToday ? "text-primary" : ""}`}>
                    {day}
                  </span>
                  {hours > 0 && (
                    <span className="text-[8px] leading-none text-primary-foreground/80 mt-0.5">
                      {hours % 1 === 0 ? hours : hours.toFixed(1)}h
                    </span>
                  )}
                  {showStreak && (
                    <span className="absolute top-0 right-0.5 text-[8px] leading-none">🔥</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {[
              { cls: "bg-muted/20", label: "None" },
              { cls: "bg-primary/25", label: "<2h" },
              { cls: "bg-primary/45", label: "2–4h" },
              { cls: "bg-primary/65", label: "4–6h" },
              { cls: "bg-primary/85", label: "6h+" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                <span>{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span>🔥</span>
              <span>Streak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session details dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {selectedDateSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-xl bg-muted/50 space-y-2 border border-border/50"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{session.subject}</Badge>
                    {session.difficulty && (
                      <Badge variant="outline" className="text-xs">{session.difficulty}</Badge>
                    )}
                  </div>
                  <span className="text-base font-bold text-primary">{session.hours}h</span>
                </div>
                {session.timeStart !== "00:00" && (
                  <div className="text-xs text-muted-foreground">
                    {formatTimeStr(session.timeStart, settings.timeFormat)} – {formatTimeStr(session.timeEnd, settings.timeFormat)}
                  </div>
                )}
                <div className="font-medium text-sm">{session.goalTopic}</div>
                {session.remarks && (
                  <div className="text-xs text-muted-foreground">{session.remarks}</div>
                )}
                {(session.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.tags!.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                {session.mood && (
                  <div className="text-xs text-muted-foreground">
                    Mood: {"★".repeat(session.mood)}{"☆".repeat(5 - session.mood)}
                  </div>
                )}
                {(session.attachments ?? []).length > 0 && (
                  <div className="space-y-0.5">
                    {session.attachments!.map((att) => (
                      <div key={att.id} className="text-xs">
                        {att.type === "link" ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline">
                            {att.name || att.url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">📎 {att.name}</span>
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
