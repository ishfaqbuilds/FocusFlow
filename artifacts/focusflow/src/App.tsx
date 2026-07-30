import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessions, useGoals, useSettings } from "@/hooks/useSessions";
import { getLocalDateStr } from "@/hooks/useSessions";
import { exportToJSON, exportToCSV, importFromJSON } from "@/lib/dataUtils";
import Dashboard from "@/pages/Dashboard";
import LogSession from "@/pages/LogSession";
import CalendarView from "@/pages/CalendarView";
import HabitGrid from "@/pages/HabitGrid";
import GoalsRemarks from "@/pages/GoalsRemarks";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Grid3x3,
  Target,
  Sun,
  Moon,
  Settings,
  Download,
  Upload,
  Trash2,
  SearchIcon,
  User,
  Flame,
  Clock,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type TabView = "dashboard" | "log" | "calendar" | "habits" | "goals" | "search" | "profile";

interface ShareData {
  name: string;
  avatar: string;
  subject: string;
  period: string;
  totalHours: number;
  sessionCount: number;
  streak: number;
}

function SharedStatsModal({
  data,
  onClose,
}: {
  data: ShareData;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{data.avatar}</span>
            {data.name}'s Progress
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{data.subject}</p>
            <p className="font-semibold text-primary">{data.period}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-primary opacity-70" />
              <div className="text-2xl font-bold text-primary">{data.totalHours}</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary opacity-70" />
              <div className="text-2xl font-bold text-primary">{data.sessionCount}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500 opacity-70" />
              <div className="text-2xl font-bold text-orange-500">{data.streak}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Tracked with FocusFlow — your personal study sanctuary
          </p>
          <Button className="w-full" onClick={onClose}>
            Start Tracking Yourself
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabView>("dashboard");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [sharedStats, setSharedStats] = useState<ShareData | null>(null);
  const { toast } = useToast();

  const { sessions, addSession, setSessions } = useSessions();
  const { goals, addGoal, deleteGoal, setGoals } = useGoals();
  const { settings, updateSettings } = useSettings();

  // Compute current week hours from sessions
  const weekStats = sessions
    .filter((s) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return s.date >= getLocalDateStr(weekStart);
    })
    .reduce((sum, s) => sum + s.hours, 0);

  // Apply theme
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  // Keyboard shortcut: Ctrl+N → Log Session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setCurrentTab("log");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Detect shared stats in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      try {
        const encoded = hash.slice("#share=".length);
        const decoded = decodeURIComponent(escape(atob(encoded)));
        const data = JSON.parse(decoded) as ShareData;
        setSharedStats(data);
        // Clean hash without navigation
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch {
        // Ignore malformed share links
      }
    }
  }, []);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  const handleExportJSON = () => {
    exportToJSON(sessions, goals);
    toast({ title: "Data exported", description: "JSON file downloaded" });
  };

  const handleExportCSV = () => {
    exportToCSV(sessions);
    toast({ title: "Sessions exported", description: "CSV file downloaded" });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importFromJSON(
          file,
          (importedSessions, importedGoals) => {
            setSessions(importedSessions);
            setGoals(importedGoals);
            toast({
              title: "Data imported",
              description: `${importedSessions.length} sessions and ${importedGoals.length} goals restored`,
            });
          },
          (error) => {
            toast({ title: "Import failed", description: error, variant: "destructive" });
          }
        );
      }
    };
    input.click();
  };

  const handleClearData = () => {
    setSessions([]);
    setGoals([]);
    setShowClearDialog(false);
    toast({ title: "All data cleared", description: "Your study data has been reset", variant: "destructive" });
  };

  const tabs: { id: TabView; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
    { id: "log",       label: "Log Session",   icon: PlusCircle },
    { id: "calendar",  label: "Calendar",      icon: Calendar },
    { id: "habits",    label: "Habit Grid",    icon: Grid3x3 },
    { id: "goals",     label: "Goals",         icon: Target },
    { id: "search",    label: "Search",        icon: SearchIcon },
    { id: "profile",   label: "Profile",       icon: User },
  ];

  const profileName = settings.profile?.name;
  const profileAvatar = settings.profile?.avatar ?? "📚";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">
                {profileAvatar}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-tight">FocusFlow</h1>
                {profileName ? (
                  <p className="text-xs text-muted-foreground leading-tight">
                    Hey, {profileName}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-tight">
                    Your study sanctuary
                  </p>
                )}
              </div>
            </motion.div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {settings.theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowClearDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-3 flex gap-0.5 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTab(tab.id)}
                  className="flex-shrink-0 text-xs"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {currentTab === "dashboard" && (
            <Dashboard sessions={sessions} weeklyGoalHours={settings.weeklyGoalHours} />
          )}
          {currentTab === "log" && (
            <LogSession
              onAddSession={addSession}
              settings={settings}
              onUpdateSettings={updateSettings}
              weeklyGoalHours={settings.weeklyGoalHours}
              currentWeekHours={weekStats}
            />
          )}
          {currentTab === "calendar" && <CalendarView sessions={sessions} />}
          {currentTab === "habits" && <HabitGrid sessions={sessions} />}
          {currentTab === "goals" && (
            <GoalsRemarks
              sessions={sessions}
              goals={goals}
              onAddGoal={addGoal}
              onDeleteGoal={deleteGoal}
            />
          )}
          {currentTab === "search" && <Search sessions={sessions} />}
          {currentTab === "profile" && (
            <Profile
              sessions={sessions}
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          )}
        </motion.div>
      </main>

      {/* Clear confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all your study sessions, goals, and
              settings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shared stats modal */}
      {sharedStats && (
        <SharedStatsModal data={sharedStats} onClose={() => setSharedStats(null)} />
      )}

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
