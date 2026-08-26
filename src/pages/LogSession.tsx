import { useState, useRef, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { triggerConfetti } from "@/lib/dataUtils";
import type { Session, Settings, Attachment } from "@/hooks/useSessions";
import { getLocalDateStr } from "@/hooks/useSessions";
import { Plus, Star, Link, Upload, X, FileText, ExternalLink, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogSessionProps {
  onAddSession: (session: Omit<Session, "id">) => Session;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  weeklyGoalHours: number;
  currentWeekHours: number;
}

const PRESET_SUBJECTS = [
  "Math", "Science", "Programming", "Design", "Other",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [timeStartHours, setTimeStartHours] = useState("");
  const [timeStartMinutes, setTimeStartMinutes] = useState("");
  const [timeStartPeriod, setTimeStartPeriod] = useState<"AM" | "PM">("AM");
  const [timeEndHours, setTimeEndHours] = useState("");
  const [timeEndMinutes, setTimeEndMinutes] = useState("");
  const [timeEndPeriod, setTimeEndPeriod] = useState<"AM" | "PM">("AM");
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
    ...(settings.customTags ?? []).filter((t) => !PRESET_TAGS.includes(t as string)),
  ];

  const convertTo24Hour = (hours: string, minutes: string, period: "AM" | "PM"): string => {
    if (!hours || !minutes) return "";
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (isNaN(h) || isNaN(m)) return "";
    
    if (period === "PM" && h !== 12) {
      h += 12;
    } else if (period === "AM" && h === 12) {
      h = 0;
    }
    
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const calculateHours = (): number => {
    const start24 = convertTo24Hour(timeStartHours, timeStartMinutes, timeStartPeriod);
    const end24 = convertTo24Hour(timeEndHours, timeEndMinutes, timeEndPeriod);
    
    if (!start24 || !end24) return 0;
    
    const [sh, sm] = start24.split(":").map(Number);
    const [eh, em] = end24.split(":").map(Number);
    
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    
    // If end time is earlier than start time, it means we crossed midnight
    // Add 24 hours (1440 minutes) to the end time
    const adjustedEndMinutes = endMinutes < startMinutes ? endMinutes + 1440 : endMinutes;
    
    return Math.max(0, (adjustedEndMinutes - startMinutes) / 60);
  };

  // Auto-calculate hours when time fields change
  useEffect(() => {
    const calc = calculateHours();
    setHours(calc > 0 ? calc.toFixed(2) : "");
  }, [timeStartHours, timeStartMinutes, timeStartPeriod, timeEndHours, timeEndMinutes, timeEndPeriod]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || selectedTags.includes(t) || PRESET_TAGS.includes(t as string)) return;
    setSelectedTags((prev) => [...prev, t]);
    if (!allTags.includes(t)) {
      onUpdateSettings({ customTags: [...(settings.customTags ?? []), t] });
    }
    setCustomTagInput("");
  };

  const deleteCustomTag = (tag: string) => {
    const isPreset = PRESET_TAGS.includes(tag as string);
    if (isPreset) return; // Can't delete preset tags
    onUpdateSettings({ customTags: (settings.customTags ?? []).filter((t) => t !== tag) });
    // Also remove from selected tags if it's selected
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    toast("Tag deleted", { description: `"${tag}" has been removed from your custom tags` });
  };

  const deleteCustomSubject = (subjectToDelete: string) => {
    const isPreset = PRESET_SUBJECTS.includes(subjectToDelete);
    if (isPreset) return; // Can't delete preset subjects
    onUpdateSettings({ customSubjects: settings.customSubjects.filter((s) => s !== subjectToDelete) });
    // If the deleted subject is currently selected, reset the selection
    if (subject === subjectToDelete) {
      setSubject("");
      setCustomSubject("");
    }
    toast("Subject deleted", { description: `"${subjectToDelete}" has been removed from your custom subjects` });
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
        toast.error("File too large", { description: `${file.name} exceeds 2MB limit` });
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

    if (!finalSubject || !date || !goalTopic) {
      toast.error("Missing fields", { description: "Subject, date, and topic are required" });
      return;
    }
    
    // Auto-calculate hours if not already set
    let hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      hoursNum = calculateHours();
      if (hoursNum <= 0) {
        toast.error("Invalid time range", { description: "Please enter valid start and end times" });
        return;
      }
    }

    const newSession: Omit<Session, "id"> = {
      subject: finalSubject,
      date,
      timeStart: convertTo24Hour(timeStartHours, timeStartMinutes, timeStartPeriod) || "00:00",
      timeEnd: convertTo24Hour(timeEndHours, timeEndMinutes, timeEndPeriod) || "00:00",
      hours: hoursNum,
      goalTopic,
      remarks,
      mood,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty: difficulty as Session["difficulty"] || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Update the hours field with the calculated value
    setHours(hoursNum.toFixed(2));

    onAddSession(newSession);

    if (subject === "custom" && customSubject && !settings.customSubjects.includes(customSubject)) {
      onUpdateSettings({ customSubjects: [...settings.customSubjects, customSubject] });
    }

    const newWeekTotal = currentWeekHours + hoursNum;
    if (currentWeekHours < weeklyGoalHours && newWeekTotal >= weeklyGoalHours) {
      triggerConfetti();
      toast("Weekly Goal Achieved!", { description: `You've hit ${weeklyGoalHours} hours this week. Amazing!` });
    } else {
      toast("Session logged", { description: `${hoursNum.toFixed(1)}h added for ${finalSubject}` });
    }

    // Reset
    setSubject("");
    setCustomSubject("");
    setDate(getLocalDateStr());
    setTimeStartHours("");
    setTimeStartMinutes("");
    setTimeStartPeriod("AM");
    setTimeEndHours("");
    setTimeEndMinutes("");
    setTimeEndPeriod("AM");
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
              <div className="flex flex-wrap gap-2 mb-2">
                {allSubjects.map((s) => {
                  const isCustom = !PRESET_SUBJECTS.includes(s);
                  return (
                    <div
                      key={s}
                      className="relative group"
                    >
                      <button
                        type="button"
                        onClick={() => setSubject(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          subject === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomSubject(s)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          title="Delete custom subject"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSubject("custom")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    subject === "custom"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  + Add Custom
                </button>
              </div>
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
                <div className="flex gap-2">
                  <Input
                    id="timeStartHours"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="10"
                    value={timeStartHours}
                    onChange={(e) => setTimeStartHours(e.target.value)}
                    className="w-16 no-spinner"
                  />
                  <Input
                    id="timeStartMinutes"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="30"
                    value={timeStartMinutes}
                    onChange={(e) => setTimeStartMinutes(e.target.value)}
                    className="w-16 no-spinner"
                  />
                  <Select value={timeStartPeriod} onValueChange={(v) => setTimeStartPeriod(v as "AM" | "PM")}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeEnd">Time Ended</Label>
                <div className="flex gap-2">
                  <Input
                    id="timeEndHours"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="12"
                    value={timeEndHours}
                    onChange={(e) => setTimeEndHours(e.target.value)}
                    className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Input
                    id="timeEndMinutes"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    value={timeEndMinutes}
                    onChange={(e) => setTimeEndMinutes(e.target.value)}
                    className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Select value={timeEndPeriod} onValueChange={(v) => setTimeEndPeriod(v as "AM" | "PM")}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                readOnly
                placeholder="Auto-calculated from times"
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from time range (converted to 24-hour format internally)
              </p>
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
                {allTags.map((tag) => {
                  const isCustom = !PRESET_TAGS.includes(tag);
                  return (
                    <div
                      key={tag}
                      className="relative group"
                    >
                      <button
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
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomTag(tag)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          title="Delete custom tag"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
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
