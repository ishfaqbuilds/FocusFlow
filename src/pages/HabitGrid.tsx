import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Session, Settings } from "@/hooks/useSessions";
import { formatTime } from "@/lib/utils";
import { Grid3x3, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface HabitGridProps {
  sessions: Session[];
  settings: Settings;
}

type ViewMode = "month" | "week";

export default function HabitGrid({ sessions, settings }: HabitGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get all subjects that have at least one session
  const subjects = useMemo(() => {
    const subjectSet = new Set(sessions.map((s) => s.subject));
    return Array.from(subjectSet).sort();
  }, [sessions]);

  // Group sessions by subject and date
  const sessionGrid = useMemo(() => {
    const grid = new Map<string, Map<string, Session[]>>();

    sessions.forEach((session) => {
      if (!grid.has(session.subject)) {
        grid.set(session.subject, new Map());
      }
      const subjectMap = grid.get(session.subject)!;
      const dateSessions = subjectMap.get(session.date) || [];
      subjectMap.set(session.date, [...dateSessions, session]);
    });

    return grid;
  }, [sessions]);

  // Calculate hours per subject per date
  const hoursGrid = useMemo(() => {
    const grid = new Map<string, Map<string, number>>();

    sessions.forEach((session) => {
      if (!grid.has(session.subject)) {
        grid.set(session.subject, new Map());
      }
      const subjectMap = grid.get(session.subject)!;
      const existing = subjectMap.get(session.date) || 0;
      subjectMap.set(session.date, existing + session.hours);
    });

    return grid;
  }, [sessions]);

  const getDaysInView = (): { day: number; dateStr: string }[] => {
    if (viewMode === "week") {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);

      return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return {
          day: date.getDate(),
          dateStr: date.toISOString().split("T")[0],
        };
      });
    } else {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return { day, dateStr };
      });
    }
  };

  const days = getDaysInView();

  const getCellIntensity = (hours: number): string => {
    if (hours === 0) return "bg-muted/20";
    if (hours < 1) return "bg-primary/25";
    if (hours < 2) return "bg-primary/50";
    if (hours < 4) return "bg-primary/75";
    return "bg-primary";
  };

  const formatViewTitle = () => {
    if (viewMode === "week") {
      return "Current Week";
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Grid3x3 className="h-6 w-6" />
              Study Habit Grid - {formatViewTitle()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                data-testid="button-view-week"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                data-testid="button-view-month"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No study sessions yet. Start logging to see your habit grid!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Day headers */}
                <div className="flex mb-2">
                  <div className="w-32 flex-shrink-0" />
                  <div className="flex gap-1">
                    {days.map(({ day }, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject rows */}
                <div className="space-y-2">
                  {subjects.map((subject, subjectIndex) => (
                    <motion.div
                      key={subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: subjectIndex * 0.05 }}
                      className="flex items-center"
                    >
                      <div className="w-32 flex-shrink-0 pr-4 text-sm font-medium truncate">
                        {subject}
                      </div>
                      <div className="flex gap-1">
                        {days.map(({ dateStr }, dayIndex) => {
                          const hours =
                            hoursGrid.get(subject)?.get(dateStr) || 0;
                          const daySessions =
                            sessionGrid.get(subject)?.get(dateStr) || [];
                          const hasData = hours > 0;

                          return (
                            <Tooltip key={dayIndex}>
                              <TooltipTrigger asChild>
                                <div
                                  data-testid={`grid-cell-${subject}-${dayIndex}`}
                                  className={`
                                    w-8 h-8 rounded-sm transition-all cursor-pointer
                                    ${getCellIntensity(hours)}
                                    ${hasData ? "hover:scale-110 hover:shadow-md" : ""}
                                  `}
                                />
                              </TooltipTrigger>
                              {hasData && (
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <div className="font-semibold">
                                      {subject} - {dateStr}
                                    </div>
                                    <div className="text-sm">
                                      Total: {hours.toFixed(1)} hours
                                    </div>
                                    {daySessions.map((session, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {session.goalTopic} ({session.hours}h)
                                        {session.timeStart !== "00:00" && (
                                          <span className="ml-1">
                                            ({formatTime(session.timeStart, settings.timeFormat)} - {formatTime(session.timeEnd, settings.timeFormat)})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    {daySessions[0]?.remarks && (
                                      <div className="text-xs italic border-t pt-1 mt-1">
                                        {daySessions[0].remarks.slice(0, 100)}
                                        {daySessions[0].remarks.length > 100 && "..."}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-muted/20" />
                    <div className="w-4 h-4 rounded bg-primary/25" />
                    <div className="w-4 h-4 rounded bg-primary/50" />
                    <div className="w-4 h-4 rounded bg-primary/75" />
                    <div className="w-4 h-4 rounded bg-primary" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
