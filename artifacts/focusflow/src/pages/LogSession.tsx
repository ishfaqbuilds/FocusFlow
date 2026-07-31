import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/lib/dataUtils";
import type { Session, Settings, Attachment } from "@/hooks/useSessions";
import { getLocalDateStr } from "@/hooks/useSessions";
import { Plus, Star, Link, Upload, X, FileText, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogSessionProps {
  onAddSession: (session: Omit<Session, "id">) => Session;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  weeklyGoalHours: number;
  currentWeekHours: number;
}

const PRESET_SUBJECTS = [
  "Math", "Science", "Programming", "Design",
  "Language", "Reading", "Writing", "Other",
];

const PRESET_TAGS = [
  "exam-prep", "practice", "lecture", "homework",
  "review", "project", "research", "flashcards",
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Expert"] as const;

export default function LogSession({
  onAddSession,
  settings,
  onUpdateSettings,
  weeklyGoalHours,
  currentWeekHours,
}: LogSessionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [hours, setHours] = useState("");
  const [goalTopic, setGoalTopic] = useState("");
  const [remarks, setRemarks] = useState("");
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkName, setLinkName] = useState("");

  const allSubjects = [
    ...PRESET_SUBJECTS,
    ...settings.customSubjects.filter((s) => !PRESET_SUBJECTS.includes(s)),
  ];

  const allTags = [
    ...PRESET_TAGS,
    ...(settings.customTags ?? []).filter((t) => !PRESET_TAGS.includes(t)),
  ];

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  const handleTimeChange = (start: string, end: string) => {
    setTimeStart(start);
    setTimeEnd(end);
    if (start && end) {
      const calc = calculateHours(start, end);
      if (calc > 0) setHours(calc.toFixed(2));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || selectedTags.includes(t)) return;
    setSelectedTags((prev) => [...prev, t]);
    if (!allTags.includes(t)) {
      onUpdateSettings({ customTags: [...(settings.customTags ?? []), t] });
    }
    setCustomTagInput("");
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const name = linkName.trim() || url;
    setAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "link", name, url },
    ]);
    setLinkInput("");
    setLinkName("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 2MB limit`,
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "file",
            name: file.name,
            data,
            mimeType: file.type,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === "custom" ? customSubject : subject;

    if (!finalSubject || !date || !goalTopic || !hours) {
      toast({ title: "Missing fields", description: "Subject, date, topic and hours are required", variant: "destructive" });
      return;
    }
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast({ title: "Invalid hours", description: "Please enter a valid number of hours", variant: "destructive" });
      return;
    }

    const newSession: Omit<Session, "id"> = {
      subject: finalSubject,
      date,
      timeStart: timeStart || "00:00",
      timeEnd: timeEnd || "00:00",
      hours: hoursNum,
      goalTopic,
      remarks,
      mood,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty: difficulty as Session["difficulty"] || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    onAddSession(newSession);

    if (subject === "custom" && customSubject && !settings.customSubjects.includes(customSubject)) {
      onUpdateSettings({ customSubjects: [...settings.customSubjects, customSubject] });
    }

    const newWeekTotal = currentWeekHours + hoursNum;
    if (currentWeekHours < weeklyGoalHours && newWeekTotal >= weeklyGoalHours) {
      triggerConfetti();
      toast({ title: "Weekly Goal Achieved!", description: `You've hit ${weeklyGoalHours} hours this week. Amazing!` });
    } else {
      toast({ title: "Session logged", description: `${hoursNum.toFixed(1)}h added for ${finalSubject}` });
    }

    // Reset
    setSubject("");
    setCustomSubject("");
    setDate(getLocalDateStr());
    setTimeStart("");
    setTimeEnd("");
    setHours("");
    setGoalTopic("");
    setRemarks("");
    setMood(undefined);
    setDifficulty("");
    setSelectedTags([]);
    setAttachments([]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log Study Session</CardTitle>
          <p className="text-sm text-muted-foreground">Press Ctrl+N from anywhere to jump here</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {allSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add Custom Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {subject === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="customSubject">Custom Subject Name *</Label>
                  <Input
                    id="customSubject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g., Chemistry, Spanish"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeStart">Time Started</Label>
                <Input
                  id="timeStart"
                  type="time"
                  value={timeStart}
                  onChange={(e) => handleTimeChange(e.target.value, timeEnd)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeEnd">Time Ended</Label>
                <Input
                  id="timeEnd"
                  type="time"
                  value={timeEnd}
                  onChange={(e) => handleTimeChange(timeStart, e.target.value)}
                />
              </div>
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Studied *</Label>
              <Input
                id="hours"
                type="number"
                step="any"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Auto-calculated from times, or enter manually"
              />
            </div>

            {/* Goal/Topic */}
            <div className="space-y-2">
              <Label htmlFor="goalTopic">Goal / Topic Studied *</Label>
              <Input
                id="goalTopic"
                value={goalTopic}
                onChange={(e) => setGoalTopic(e.target.value)}
                placeholder="e.g., Chapter 5: Quadratic Equations"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(difficulty === d ? "" : d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      difficulty === d
                        ? getDifficultyStyle(d) + " border-transparent"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }}}
                  placeholder="Add custom tag..."
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTag}>
                  Add
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Notes</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reflections, key takeaways, what was hard..."
                rows={3}
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label>Productivity / Mood Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMood(mood === rating ? undefined : rating)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        mood && mood >= rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground hover:text-primary/60"
                      }`}
                    />
                  </button>
                ))}
                {mood && (
                  <span className="text-sm text-muted-foreground self-center ml-1">
                    {["", "Rough", "Okay", "Good", "Great", "Excellent"][mood]}
                  </span>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <Label>Attachments</Label>

              {/* Add Link */}
              <div className="rounded-xl border border-border/60 p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Link className="h-3 w-3" /> Add Link
                </p>
                <div className="flex gap-2">
                  <Input
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Label (optional)"
                    className="text-sm w-32 shrink-0"
                  />
                  <Input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); }}}
                    placeholder="https://..."
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addLink}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Upload File */}
              <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Upload className="h-3 w-3" /> Upload Files (PDF, images, docs — max 2MB each)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              {/* Attachment list */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    {attachments.map((att) => (
                      <motion.div
                        key={att.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        {att.type === "link" ? (
                          <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 truncate">{att.name}</span>
                        {att.size && (
                          <span className="text-xs text-muted-foreground">
                            {(att.size / 1024).toFixed(0)}KB
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Log Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getDifficultyStyle(d: string): string {
  switch (d) {
    case "Easy":   return "bg-green-500/20 text-green-400";
    case "Medium": return "bg-yellow-500/20 text-yellow-400";
    case "Hard":   return "bg-orange-500/20 text-orange-400";
    case "Expert": return "bg-red-500/20 text-red-400";
    default:       return "";
  }
}
