import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Session, Settings } from "@/hooks/useSessions";
import {
  Menu,
  User,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Target,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToJSON, exportToCSV, importFromJSON } from "@/lib/dataUtils";

interface SideMenuProps {
  sessions: Session[];
  trash: Session[];
  settings: Settings;
  goals: { id: string }[];
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onRestoreSession: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onSetSessions: (sessions: Session[]) => void;
  onSetGoals: (goals: any[]) => void;
}

const AVATAR_OPTIONS = [
  "📚", "🎯", "⚡", "🌟", "🧠", "🔥",
  "✨", "🦁", "🚀", "🎓", "💡", "🌿",
  "🏆", "⚔️", "🧩", "🎵",
];

type Section = "profile" | "trash" | "data" | null;

export default function SideMenu({
  sessions,
  trash,
  settings,
  goals,
  onUpdateSettings,
  onRestoreSession,
  onPermanentlyDelete,
  onEmptyTrash,
  onSetSessions,
  onSetGoals,
}: SideMenuProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState<Section>("profile");
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState(settings.profile?.name ?? "");
  const [bio, setBio] = useState(settings.profile?.bio ?? "");
  const [avatar, setAvatar] = useState(settings.profile?.avatar ?? "📚");
  const [weeklyGoal, setWeeklyGoal] = useState(String(settings.weeklyGoalHours));

  const toggle = (s: Section) => setOpenSection((prev) => (prev === s ? null : s));

  const saveProfile = () => {
    const goal = parseFloat(weeklyGoal);
    onUpdateSettings({
      profile: { name: name.trim(), bio: bio.trim(), avatar },
      weeklyGoalHours: isNaN(goal) || goal <= 0 ? 20 : goal,
    });
    toast({ title: "Profile saved" });
  };

  const toggleTheme = () => {
    onUpdateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  const handleExportJSON = () => {
    exportToJSON(sessions, goals as any);
    toast({ title: "Exported as JSON" });
  };
  const handleExportCSV = () => {
    exportToCSV(sessions);
    toast({ title: "Exported as CSV" });
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
          (s, g) => {
            onSetSessions(s);
            onSetGoals(g);
            toast({ title: "Data imported", description: `${s.length} sessions restored` });
          },
          (err) => toast({ title: "Import failed", description: err, variant: "destructive" })
        );
      }
    };
    input.click();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-xl">{settings.profile?.avatar ?? "📚"}</span>
              <span>{settings.profile?.name || "FocusFlow"}</span>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="py-3 space-y-1">

              {/* ── Theme toggle ── */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                {settings.theme === "dark" ? (
                  <Sun className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-400" />
                )}
                Switch to {settings.theme === "dark" ? "Light" : "Dark"} mode
              </button>

              <div className="h-px bg-border mx-5 my-1" />

              {/* ── Profile ── */}
              <div>
                <button
                  onClick={() => toggle("profile")}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-left font-medium">Profile</span>
                  {openSection === "profile" ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {openSection === "profile" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3">
                        {/* Avatar */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Avatar</Label>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {AVATAR_OPTIONS.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => setAvatar(e)}
                                className={`w-8 h-8 text-base rounded-md border transition-all ${
                                  avatar === e
                                    ? "border-primary bg-primary/20 scale-110"
                                    : "border-transparent hover:border-primary/30 hover:bg-muted"
                                }`}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Bio</Label>
                          <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Your study motto…"
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" /> Weekly Goal (hrs)
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            step="0.5"
                            value={weeklyGoal}
                            onChange={(e) => setWeeklyGoal(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        <Button onClick={saveProfile} size="sm" className="w-full">
                          Save Profile
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-border mx-5 my-1" />

              {/* ── Recycle Bin ── */}
              <div>
                <button
                  onClick={() => toggle("trash")}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left font-medium">Recycle Bin</span>
                  {trash.length > 0 && (
                    <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {trash.length}
                    </span>
                  )}
                  {openSection === "trash" ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {openSection === "trash" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-2">
                        {trash.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            Recycle Bin is empty
                          </p>
                        ) : (
                          <>
                            {trash.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-start gap-2 bg-muted/40 rounded-lg p-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{s.subject}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{s.goalTopic}</p>
                                  <p className="text-[10px] text-muted-foreground">{s.date} · {s.hours}h</p>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button
                                    onClick={() => onRestoreSession(s.id)}
                                    title="Restore"
                                    className="text-primary hover:opacity-70"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(s.id)}
                                    title="Delete permanently"
                                    className="text-destructive hover:opacity-70"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full"
                              onClick={() => setConfirmEmptyTrash(true)}
                            >
                              Empty Bin
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-border mx-5 my-1" />

              {/* ── Data ── */}
              <div>
                <button
                  onClick={() => toggle("data")}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left font-medium">Import / Export</span>
                  {openSection === "data" ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {openSection === "data" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-2">
                        <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleExportJSON}>
                          <Download className="h-3.5 w-3.5" /> Export JSON
                        </Button>
                        <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleExportCSV}>
                          <Download className="h-3.5 w-3.5" /> Export CSV
                        </Button>
                        <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleImport}>
                          <Upload className="h-3.5 w-3.5" /> Import JSON
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Confirm empty trash */}
      <AlertDialog open={confirmEmptyTrash} onOpenChange={setConfirmEmptyTrash}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Recycle Bin?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {trash.length} session{trash.length !== 1 ? "s" : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onEmptyTrash(); setConfirmEmptyTrash(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Empty Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm permanent delete */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This session will be gone forever and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDeleteId) onPermanentlyDelete(confirmDeleteId); setConfirmDeleteId(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
