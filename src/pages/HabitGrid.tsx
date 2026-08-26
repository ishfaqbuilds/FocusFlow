import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import type { Session, Settings } from "@/hooks/useSessions";
import { formatTimeStr } from "@/lib/utils";
import { 
  Grid3x3, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, EyeOff, 
  Pin, PinOff, Settings as SettingsIcon, 
  ArrowUpDown, Clock, TrendingUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HabitGridProps {
  sessions: Session[];
  settings: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

type ViewMode = "month" | "week";
type SortOrder = "name" | "hours" | "recent" | "manual";

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PRESET_SUBJECTS = [
  "Math", "Science", "Programming", "Design", "Other",
];

export default function HabitGrid({ sessions, settings, onUpdateSettings }: HabitGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHiddenSubjects, setShowHiddenSubjects] = useState(false);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get all subjects that have at least one session
  const allSubjects = useMemo(() => {
    const subjectSet = new Set(sessions.map((s) => s.subject));
    return Array.from(subjectSet);
  }, [sessions]);

  // Calculate subject statistics
  const subjectStats = useMemo(() => {
    const stats = new Map<string, { totalHours: number; sessionCount: number; lastSession: string }>();
    
    sessions.forEach((session) => {
      const existing = stats.get(session.subject) || { totalHours: 0, sessionCount: 0, lastSession: session.date };
      stats.set(session.subject, {
        totalHours: existing.totalHours + session.hours,
        sessionCount: existing.sessionCount + 1,
        lastSession: session.date > existing.lastSession ? session.date : existing.lastSession,
      });
    });
    
    return stats;
  }, [sessions]);

  // Sort subjects based on selected order
  const sortedSubjects = useMemo(() => {
    const pinned = settings.pinnedSubjects || [];
    const sortOrder = settings.subjectSortOrder || "recent";
    
    let sorted = [...allSubjects];
    
    switch (sortOrder) {
      case "name":
        sorted.sort((a, b) => a.localeCompare(b));
        break;
      case "hours":
        sorted.sort((a, b) => {
          const aHours = subjectStats.get(a)?.totalHours || 0;
          const bHours = subjectStats.get(b)?.totalHours || 0;
          return bHours - aHours;
        });
        break;
      case "recent":
        sorted.sort((a, b) => {
          const aLast = subjectStats.get(a)?.lastSession || "";
          const bLast = subjectStats.get(b)?.lastSession || "";
          return bLast.localeCompare(aLast);
        });
        break;
      case "manual":
        // Keep pinned subjects first (in order they were pinned), then others alphabetically
        const pinnedSet = new Set(pinned);
        const orderedPinned = pinned.filter(s => pinnedSet.has(s));
        const unpinnedSubjects = sorted.filter(s => !pinnedSet.has(s)).sort((a, b) => a.localeCompare(b));
        sorted = [...orderedPinned, ...unpinnedSubjects];
        break;
    }
    
    return sorted;
  }, [allSubjects, subjectStats, settings.pinnedSubjects, settings.subjectSortOrder]);

  // Filter subjects based on hidden settings
  const subjects = useMemo(() => {
    if (showHiddenSubjects) {
      return sortedSubjects;
    }
    return sortedSubjects.filter(subject => !settings.hiddenSubjects?.includes(subject));
  }, [sortedSubjects, settings.hiddenSubjects, showHiddenSubjects]);

  // Get hidden subjects that still have sessions
  const hiddenSubjectsWithSessions = useMemo(() => {
    return sortedSubjects.filter(subject => 
      settings.hiddenSubjects?.includes(subject)
    );
  }, [sortedSubjects, settings.hiddenSubjects]);

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
      const dayOfWeek = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

      return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return {
          day: date.getDate(),
          dateStr: formatLocalDate(date),
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
      const weekStart = new Date(currentDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(currentDate.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      };
      
      const isCurrentWeek = () => {
        const today = new Date();
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - today.getDay());
        return weekStart.toDateString() === currentWeekStart.toDateString();
      };
      
      if (isCurrentWeek()) {
        return "Current Week";
      }
      
      return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getCurrentPeriodLabel = () => {
    if (viewMode === "week") {
      return formatViewTitle();
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const goToPrevious = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    if (selectedDate) {
      if (viewMode === 'month') {
        // For month view, use the 1st of the selected date's month
        setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      } else {
        // For week view, use the exact selected date
        setCurrentDate(selectedDate);
      }
    } else {
      setCurrentDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1));
    }
    setSelectedDate(null);
    setCalendarOpen(false);
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleShowSubject = (subject: string) => {
    if (onUpdateSettings) {
      onUpdateSettings({ 
        hiddenSubjects: (settings.hiddenSubjects || []).filter((s) => s !== subject) 
      });
      toast("Subject shown", { description: `"${subject}" is now visible in habits view` });
    }
  };

  const handleTogglePin = (subject: string) => {
    if (onUpdateSettings) {
      const currentPinned = settings.pinnedSubjects || [];
      if (currentPinned.includes(subject)) {
        onUpdateSettings({ 
          pinnedSubjects: currentPinned.filter((s) => s !== subject) 
        });
      } else {
        // When pinning, automatically switch to manual sort to show pinned subjects at top
        onUpdateSettings({ 
          pinnedSubjects: [...currentPinned, subject],
          subjectSortOrder: "manual"
        });
      }
    }
  };

  const handleBulkHide = () => {
    if (onUpdateSettings && selectedSubjects.size > 0) {
      const currentHidden = settings.hiddenSubjects || [];
      const newHidden = [...currentHidden, ...Array.from(selectedSubjects).filter(s => !currentHidden.includes(s))];
      onUpdateSettings({ hiddenSubjects: newHidden });
      setSelectedSubjects(new Set());
      toast("Subjects hidden", { description: `${selectedSubjects.size} subjects hidden from habits view` });
    }
  };

  const handleBulkShow = () => {
    if (onUpdateSettings && selectedSubjects.size > 0) {
      const newHidden = (settings.hiddenSubjects || []).filter(s => !selectedSubjects.has(s));
      onUpdateSettings({ hiddenSubjects: newHidden });
      setSelectedSubjects(new Set());
      toast("Subjects shown", { description: `${selectedSubjects.size} subjects restored to habits view` });
    }
  };

  const handleToggleSubjectSelection = (subject: string) => {
    setSelectedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Grid3x3 className="h-6 w-6" />
                Study Habit Grid
                <span className="text-lg text-muted-foreground">→ {getCurrentPeriodLabel()}</span>
                <Popover open={calendarOpen} onOpenChange={(open) => {
                  setCalendarOpen(open);
                  if (open) {
                    setSelectedDate(null);
                    setCalendarDate(new Date(currentDate));
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateCalendar('prev')}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="font-semibold">
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateCalendar('next')}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().map((day, index) => (
                          <button
                            key={index}
                            onClick={() => day.isCurrentMonth && handleDateSelect(day.date)}
                            disabled={!day.isCurrentMonth}
                            className={`
                              h-8 w-8 text-sm rounded-md transition-colors
                              ${day.isCurrentMonth 
                                ? 'hover:bg-primary/20 cursor-pointer' 
                                : 'text-muted-foreground cursor-not-allowed'
                              }
                              ${selectedDate?.toDateString() === day.date.toDateString() || (!selectedDate && currentDate.toDateString() === day.date.toDateString())
                                ? 'bg-primary text-primary-foreground' 
                                : ''
                              }
                            `}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(null);
                            setCalendarOpen(false);
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleApply}
                          className="flex-1"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                data-testid="button-view-week"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                data-testid="button-view-month"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Month
              </Button>
              <Button
                variant={showManagementPanel ? "default" : "outline"}
                onClick={() => setShowManagementPanel(!showManagementPanel)}
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Management Panel */}
        <AnimatePresence>
          {showManagementPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b px-6 py-4 space-y-4"
            >
              {/* Sorting Options */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort by:</span>
                  <Select 
                    value={settings.subjectSortOrder || "recent"} 
                    onValueChange={(value: SortOrder) => onUpdateSettings?.({ subjectSortOrder: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">View:</span>
                  <Badge variant="outline">{allSubjects.length} subjects</Badge>
                  {hiddenSubjectsWithSessions.length > 0 && (
                    <Badge variant="secondary">{hiddenSubjectsWithSessions.length} hidden</Badge>
                  )}
                  {(settings.pinnedSubjects?.length || 0) > 0 && (
                    <Badge variant="default">{settings.pinnedSubjects.length} pinned</Badge>
                  )}
                </div>

                {hiddenSubjectsWithSessions.length > 0 && (
                  <Button
                    variant={showHiddenSubjects ? "default" : "outline"}
                    onClick={() => setShowHiddenSubjects(!showHiddenSubjects)}
                    className="gap-2"
                    size="sm"
                  >
                    {showHiddenSubjects ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hide Hidden
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Hidden ({hiddenSubjectsWithSessions.length})
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedSubjects.size > 0 && (
                <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{selectedSubjects.size} selected</span>
                  <Button size="sm" variant="destructive" onClick={handleBulkHide}>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Selected
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkShow}>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSubjects(new Set())}>
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Instructions */}
              {selectedSubjects.size === 0 && (
                <div className="text-xs text-muted-foreground">
                  Select subjects using checkboxes to hide or show them in bulk
                </div>
              )}

              {/* Subject Statistics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allSubjects.slice(0, 4).map((subject) => {
                  const stats = subjectStats.get(subject);
                  if (!stats) return null;
                  return (
                    <div key={subject} className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground truncate">{subject}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-sm font-semibold">{stats.totalHours.toFixed(1)}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No study sessions yet. Start logging to see your habit grid!</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="inline-block min-w-full">
                {/* Day headers */}
                <div className="flex mb-2">
                  <div className="w-56 flex-shrink-0 flex items-center gap-2">
                    {showManagementPanel && (
                      <input
                        type="checkbox"
                        checked={selectedSubjects.size === subjects.length && subjects.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">Subject</span>
                  </div>
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
                  {subjects.map((subject, subjectIndex) => {
                    const stats = subjectStats.get(subject);
                    const isPinned = settings.pinnedSubjects?.includes(subject);
                    const isSelected = selectedSubjects.has(subject);
                    
                    return (
                      <motion.div
                        key={subject}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: subjectIndex * 0.05 }}
                        className={`flex items-center group ${isSelected ? "bg-primary/5" : ""}`}
                      >
                        <div className="w-56 flex-shrink-0 pr-4 flex items-center gap-2">
                          {showManagementPanel && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSubjectSelection(subject)}
                              className="h-4 w-4"
                            />
                          )}
                          <div className="flex-1 flex items-center gap-2">
                            {isPinned && <Pin className="h-3 w-3 text-primary" />}
                            <span className="text-sm font-medium truncate">{subject}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0">
                            {showManagementPanel && (
                              <>
                                {settings.hiddenSubjects?.includes(subject) ? (
                                  <button
                                    onClick={() => handleShowSubject(subject)}
                                    className="p-1 hover:bg-muted rounded transition-colors hover:text-primary"
                                    title="Show subject in habits"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const currentHidden = settings.hiddenSubjects || [];
                                      if (!currentHidden.includes(subject)) {
                                        onUpdateSettings?.({ hiddenSubjects: [...currentHidden, subject] });
                                        toast({ title: "Subject hidden", description: `"${subject}" hidden from habits view` });
                                      }
                                    }}
                                    className="p-1 hover:bg-muted rounded transition-colors hover:text-destructive"
                                    title="Hide subject"
                                  >
                                    <EyeOff className="h-3 w-3" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleTogglePin(subject)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title={isPinned ? "Unpin subject" : "Pin subject"}
                            >
                              {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                            </button>
                          </div>
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
                                  <div className="space-y-1 font-playfair-display">
                                    <div className="font-semibold">
                                      {subject} ➔ {dateStr.replace(/-/g, '/')}
                                    </div>
                                    <div className="text-sm">
                                      Total: {hours.toFixed(1)} hours
                                    </div>
                                    {daySessions.map((session, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-foreground dark:text-blue-600"
                                      >
                                        {session.goalTopic} ({session.hours.toFixed(1)}h)
                                        {session.timeStart !== "00:00" && (
                                          <span className="ml-1">
                                            ({formatTimeStr(session.timeStart, settings.timeFormat)} - {formatTimeStr(session.timeEnd, settings.timeFormat)})
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
                    );
                  })}
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
