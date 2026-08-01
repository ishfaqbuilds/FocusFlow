import { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSessions, useGoals, useSettings, getLocalDateStr } from "@/hooks/useSessions";
import SplashScreen from "@/components/SplashScreen";
import SideMenu from "@/components/SideMenu";
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Grid3x3,
  Target,
  BookOpen,
  SearchIcon,
  Flame,
  Clock,
  Timer,
  CheckCircle,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const LogSession = lazy(() => import("@/pages/LogSession"));
const CalendarView = lazy(() => import("@/pages/CalendarView"));
const HabitGrid = lazy(() => import("@/pages/HabitGrid"));
const GoalsRemarks = lazy(() => import("@/pages/GoalsRemarks"));
const SessionsLog = lazy(() => import("@/pages/SessionsLog"));
const Search = lazy(() => import("@/pages/Search"));
const Pomodoro = lazy(() => import("@/pages/Pomodoro"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Bookmarks = lazy(() => import("@/pages/Bookmarks"));

const queryClient = new QueryClient();

type TabView = "dashboard" | "log" | "calendar" | "habits" | "goals" | "sessions" | "search" | "pomodoro" | "tasks" | "bookmarks";

interface ShareData {
  name: string;
  avatar: string;
  subject: string;
  period: string;
  totalHours: number;
  sessionCount: number;
  streak: number;
}

function SharedStatsModal({ data, onClose }: { data: ShareData; onClose: () => void }) {
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
            {[
              { icon: Clock,  value: data.totalHours,   label: "Hours",    cls: "text-primary" },
              { icon: BookOpen, value: data.sessionCount, label: "Sessions", cls: "text-primary" },
              { icon: Flame,  value: data.streak,        label: "Streak",   cls: "text-orange-500" },
            ].map(({ icon: Icon, value, label, cls }) => (
              <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${cls} opacity-70`} />
                <div className={`text-2xl font-bold ${cls}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Tracked with FocusFlow — your personal study sanctuary
          </p>
          <Button className="w-full" onClick={onClose}>Start Tracking Yourself</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabView>("dashboard");
  const [sharedStats, setSharedStats] = useState<ShareData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const {
    sessions, addSession, deleteSession, updateSession, setSessions,
    trash, restoreSession, permanentlyDelete, emptyTrash,
  } = useSessions();
  const { goals, addGoal, deleteGoal, setGoals } = useGoals();
  const { settings, updateSettings } = useSettings();

  // Weekly hours for progress bar
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

  // Keyboard shortcut Ctrl+N → Log
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setCurrentTab("log");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Detect shared stats hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      try {
        const encoded = hash.slice("#share=".length);
        const data = JSON.parse(decodeURIComponent(escape(atob(encoded)))) as ShareData;
        setSharedStats(data);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch { /* ignore malformed */ }
    }
  }, []);

  const tabs: { id: TabView; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Home",      icon: LayoutDashboard },
    { id: "log",       label: "Log",       icon: PlusCircle },
    { id: "sessions",  label: "Sessions",  icon: BookOpen },
    { id: "pomodoro",  label: "Pomodoro",  icon: Timer },
    { id: "tasks",     label: "Tasks",     icon: CheckCircle },
    { id: "calendar",  label: "Calendar",  icon: Calendar },
    { id: "habits",    label: "Habits",    icon: Grid3x3 },
    { id: "goals",     label: "Goals",     icon: Target },
    { id: "bookmarks", label: "Bookmarks", icon: Globe },
    { id: "search",    label: "Search",    icon: SearchIcon },
  ];

  const profileAvatar = settings.profile?.avatar ?? "📚";
  const profileName   = settings.profile?.name ?? "";

  return (
    <>
      {!ready && <SplashScreen onDone={() => setReady(true)} />}

      <div className={`min-h-[100dvh] bg-background transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between">
              {/* Branding */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-base cursor-pointer"
                  onClick={() => setCurrentTab("dashboard")}
                >
                  {profileAvatar}
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight leading-tight">FocusFlow</h1>
                  {profileName && (
                    <p className="text-[10px] text-muted-foreground leading-tight">Hey, {profileName} 👋</p>
                  )}
                </div>
              </motion.div>

              {/* Side menu (hamburger) and Ask AI */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(true)}
                  className="gap-2 text-primary"
                >
                  <SearchIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Google Search</span>
                </Button>
                <SideMenu
                  sessions={sessions}
                  trash={trash}
                  settings={settings}
                  goals={goals}
                  onUpdateSettings={updateSettings}
                  onRestoreSession={restoreSession}
                  onPermanentlyDelete={permanentlyDelete}
                  onEmptyTrash={emptyTrash}
                  onSetSessions={setSessions}
                  onSetGoals={setGoals}
                />
              </div>
            </div>

            {/* Tab bar */}
            <nav className="mt-2 flex gap-0.5 overflow-x-auto pb-0.5 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentTab(tab.id)}
                    className="flex-shrink-0 text-xs h-7 px-2.5"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* ── Page ── */}
        <main className="container mx-auto px-4 py-5">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14 }}
          >
            <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading...</div>}>
              {currentTab === "dashboard" && (
                <Dashboard sessions={sessions} weeklyGoalHours={settings.weeklyGoalHours} settings={settings} />
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
              {currentTab === "sessions" && (
                <SessionsLog
                  sessions={sessions}
                  onDelete={deleteSession}
                  onUpdate={updateSession}
                  settings={settings}
                />
              )}
              {currentTab === "pomodoro" && <Pomodoro />}
              {currentTab === "tasks" && <Tasks />}
              {currentTab === "calendar" && <CalendarView sessions={sessions} settings={settings} />}
              {currentTab === "habits" && <HabitGrid sessions={sessions} settings={settings} />}
              {currentTab === "goals" && (
                <GoalsRemarks
                  sessions={sessions}
                  goals={goals}
                  onAddGoal={addGoal}
                  onDeleteGoal={deleteGoal}
                />
              )}
              {currentTab === "bookmarks" && <Bookmarks />}
              {currentTab === "search" && <Search sessions={sessions} />}
            </Suspense>
          </motion.div>
        </main>
      </div>

      {sharedStats && (
        <SharedStatsModal data={sharedStats} onClose={() => setSharedStats(null)} />
      )}

      {/* Google Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              Google Search
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Your Search Query</Label>
              <Textarea
                id="search-query"
                placeholder="Search for anything about your studies, productivity, or any topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your search will be automatically performed in Google
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (searchQuery.trim()) {
                  // Open Google Search with the query using ?q= parameter
                  const encodedQuery = encodeURIComponent(searchQuery);
                  window.open(`https://www.google.com/search?q=${encodedQuery}`, '_blank');
                  setSearchOpen(false);
                  setSearchQuery("");
                  toast({ 
                    title: "Opening Google", 
                    description: "Your search is being performed" 
                  });
                } else {
                  toast({ title: "Empty query", description: "Please enter a search query first", variant: "destructive" });
                }
              }}
              disabled={!searchQuery.trim()}
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
