import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import type { Session, Attachment, Settings } from "@/hooks/useSessions";
import { formatTimeStr } from "@/lib/utils";
import {
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Clock,
  Calendar,
  BookOpen,
  X,
  Plus,
  Upload,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionsLogProps {
  sessions: Session[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Session>) => void;
  settings: Settings;
}

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Expert"] as const;

function AttachmentViewer({ att }: { att: Attachment }) {
  if (att.type === "link") {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-lg transition-colors group"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium">{att.name || att.url}</span>
      </a>
    );
  }
  // File
  const isPdf = att.mimeType === "application/pdf";
  const isImage = att.mimeType?.startsWith("image/");

  const handleView = () => {
    if (!att.data) return;
    const win = window.open();
    if (!win) return;
    if (isPdf) {
      win.document.write(
        `<iframe src="${att.data}" style="width:100%;height:100%;border:0"></iframe>`
      );
    } else if (isImage) {
      win.document.write(
        `<img src="${att.data}" style="max-width:100%;display:block;margin:auto" />`
      );
    } else {
      // Download
      const a = win.document.createElement("a");
      a.href = att.data!;
      a.download = att.name;
      a.click();
      win.close();
    }
  };

  const handleDownload = () => {
    if (!att.data) return;
    const a = document.createElement("a");
    a.href = att.data;
    a.download = att.name;
    a.click();
  };

  return (
    <div className="flex items-center gap-2 text-xs bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg transition-colors group">
      {isPdf ? (
        <FileText className="h-4 w-4 text-red-400 shrink-0" />
      ) : (
        <FileText className="h-4 w-4 text-blue-400 shrink-0" />
      )}
      <button
        onClick={handleView}
        className="text-primary hover:underline truncate font-medium flex-1 text-left"
      >
        {att.name}
      </button>
      <button 
        onClick={handleDownload} 
        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

function EditSessionDialog({
  session,
  onSave,
  onClose,
}: {
  session: Session;
  onSave: (updates: Partial<Session>) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(session.subject);
  const [date, setDate] = useState(session.date);
  const [hours, setHours] = useState(String(session.hours));
  const [goalTopic, setGoalTopic] = useState(session.goalTopic);
  const [remarks, setRemarks] = useState(session.remarks);
  const [difficulty, setDifficulty] = useState(session.difficulty ?? "");
  const [mood, setMood] = useState(session.mood ?? 0);
  const [tags, setTags] = useState((session.tags ?? []).join(", "));
  const [attachments, setAttachments] = useState<Attachment[]>(session.attachments ?? []);
  const [linkInput, setLinkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: `${file.name} exceeds 2MB` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "file", name: file.name, data: ev.target?.result as string, mimeType: file.type, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    setAttachments((prev) => [...prev, { id: crypto.randomUUID(), type: "link", name: url, url }]);
    setLinkInput("");
  };

  const handleSave = () => {
    const h = parseFloat(hours);
    if (!subject || !goalTopic || isNaN(h) || h <= 0) {
      toast.error("Missing fields", { description: "Subject, topic and valid hours are required" });
      return;
    }
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({
      subject,
      date,
      hours: h,
      goalTopic,
      remarks,
      difficulty: (difficulty as Session["difficulty"]) || undefined,
      mood: mood || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Hours</Label>
            <Input type="number" step="any" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Goal / Topic</Label>
            <Input value={goalTopic} onChange={(e) => setGoalTopic(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes / Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {DIFFICULTY_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mood (1–5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMood(mood === n ? 0 : n)}
                    className={`text-lg transition-opacity ${mood >= n ? "opacity-100" : "opacity-30"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="exam-prep, homework, review" />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2">
                <AttachmentViewer att={att} />
                <button
                  type="button"
                  onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
              />
              <Button type="button" size="sm" variant="outline" onClick={addLink}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
            <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-2">
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionsLog({ sessions, onDelete, onUpdate, settings }: SessionsLogProps) {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const allSubjects = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.subject))).sort(),
    [sessions]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let result = sessions.filter((s) => {
      const matchQ =
        !q ||
        s.subject.toLowerCase().includes(q) ||
        s.goalTopic.toLowerCase().includes(q) ||
        s.remarks.toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        s.date.includes(q);
      const matchSubject = subjectFilter === "all" || s.subject === subjectFilter;
      return matchQ && matchSubject;
    });
    result = [...result].sort((a, b) =>
      sortOrder === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    );
    return result;
  }, [sessions, query, subjectFilter, sortOrder]);

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
    toast("Session moved to Recycle Bin", { description: "You can restore it from the menu" });
  };

  const difficultyColor: Record<string, string> = {
    Easy: "bg-green-500/20 text-green-400 border-green-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Expert: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search sessions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {allSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {sessions.length} sessions
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No sessions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((session) => {
              const isExpanded = expandedId === session.id;
              return (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header row */}
                      <button
                        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{session.subject}</span>
                            {session.difficulty && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${difficultyColor[session.difficulty]}`}>
                                {session.difficulty}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {session.date}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{session.goalTopic}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-primary font-bold text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {session.hours}h
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                              {session.timeStart !== "00:00" && (
                                <p className="text-xs text-muted-foreground">
                                  🕐 {formatTimeStr(session.timeStart, settings.timeFormat)} – {formatTimeStr(session.timeEnd, settings.timeFormat)}
                                </p>
                              )}

                              {session.remarks && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm">{session.remarks}</p>
                                </div>
                              )}

                              {(session.tags ?? []).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {session.tags!.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}

                              {session.mood && (
                                <p className="text-xs text-muted-foreground">
                                  Mood: {"★".repeat(session.mood)}{"☆".repeat(5 - session.mood)}
                                </p>
                              )}

                              {/* Attachments */}
                              {(session.attachments ?? []).length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium text-muted-foreground">Attachments</p>
                                  {session.attachments!.map((att) => (
                                    <AttachmentViewer key={att.id} att={att} />
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  onClick={() => setEditingSession(session)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-destructive hover:text-destructive hover:border-destructive"
                                  onClick={() => setDeleteConfirmId(session.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit dialog */}
      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          onSave={(updates) => onUpdate(editingSession.id, updates)}
          onClose={() => setEditingSession(null)}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
            <AlertDialogDescription>
              This session will be moved to the Recycle Bin. You can restore it from the menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
