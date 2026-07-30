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
import { useSessions, useGoals, useSettings } from "@/hooks/useSessions";
import { exportToJSON, exportToCSV, importFromJSON } from "@/lib/dataUtils";
import Dashboard from "@/pages/Dashboard";
import LogSession from "@/pages/LogSession";
import CalendarView from "@/pages/CalendarView";
import HabitGrid from "@/pages/HabitGrid";
import GoalsRemarks from "@/pages/GoalsRemarks";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type TabView = "dashboard" | "log" | "calendar" | "habits" | "goals";

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabView>("dashboard");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  const { sessions, addSession, setSessions } = useSessions();
  const { goals, addGoal, deleteGoal, setGoals } = useGoals();
  const { settings, updateSettings } = useSettings();

  const weekStats = useSessions().sessions
    .filter((s) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return s.date >= weekStart.toISOString().split("T")[0];
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

  // Keyboard shortcut: Ctrl+N to jump to Log Session
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

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === "dark" ? "light" : "dark",
    });
  };

  const handleExportJSON = () => {
    exportToJSON(sessions, goals);
    toast({
      title: "Data exported",
      description: "JSON file downloaded successfully",
    });
  };

  const handleExportCSV = () => {
    exportToCSV(sessions);
    toast({
      title: "Sessions exported",
      description: "CSV file downloaded successfully",
    });
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
            toast({
              title: "Import failed",
              description: error,
              variant: "destructive",
            });
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
    toast({
      title: "All data cleared",
      description: "Your study data has been reset",
      variant: "destructive",
    });
  };

  const tabs = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "log" as const,
      label: "Log Session",
      icon: PlusCircle,
    },
    {
      id: "calendar" as const,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "habits" as const,
      label: "Habit Grid",
      icon: Grid3x3,
    },
    {
      id: "goals" as const,
      label: "Goals & Remarks",
      icon: Target,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">FocusFlow</h1>
                <p className="text-xs text-muted-foreground">
                  Your study sanctuary
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-toggle-theme"
              >
                {settings.theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-settings-menu">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExportJSON} data-testid="menu-export-json">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV} data-testid="menu-export-csv">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImport} data-testid="menu-import">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowClearDialog(true)}
                    className="text-destructive"
                    data-testid="menu-clear-data"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-6 flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setCurrentTab(tab.id)}
                  className="flex-shrink-0"
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentTab === "dashboard" && (
            <Dashboard
              sessions={sessions}
              weeklyGoalHours={settings.weeklyGoalHours}
            />
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
        </motion.div>
      </main>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your
              study sessions, goals, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-clear"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
