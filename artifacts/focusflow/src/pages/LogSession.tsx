import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/lib/dataUtils";
import type { Session, Settings } from "@/hooks/useSessions";
import { Plus, Star } from "lucide-react";
import { motion } from "framer-motion";

interface LogSessionProps {
  onAddSession: (session: Omit<Session, "id">) => Session;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  weeklyGoalHours: number;
  currentWeekHours: number;
}

const PRESET_SUBJECTS = [
  "Math",
  "Science",
  "Programming",
  "Design",
  "Language",
  "Reading",
  "Writing",
  "Other",
];

export default function LogSession({
  onAddSession,
  settings,
  onUpdateSettings,
  weeklyGoalHours,
  currentWeekHours,
}: LogSessionProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [hours, setHours] = useState("");
  const [goalTopic, setGoalTopic] = useState("");
  const [remarks, setRemarks] = useState("");
  const [mood, setMood] = useState<number | undefined>(undefined);

  const allSubjects = [
    ...PRESET_SUBJECTS,
    ...settings.customSubjects.filter((s) => !PRESET_SUBJECTS.includes(s)),
  ];

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const handleTimeChange = (start: string, end: string) => {
    setTimeStart(start);
    setTimeEnd(end);
    if (start && end) {
      const calculated = calculateHours(start, end);
      setHours(calculated.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalSubject = subject === "custom" ? customSubject : subject;

    if (!finalSubject || !date || !goalTopic || !hours) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
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
    };

    onAddSession(newSession);

    // Check if custom subject should be saved
    if (
      subject === "custom" &&
      customSubject &&
      !settings.customSubjects.includes(customSubject)
    ) {
      onUpdateSettings({
        customSubjects: [...settings.customSubjects, customSubject],
      });
    }

    // Check if goal hit
    const newWeekTotal = currentWeekHours + hoursNum;
    if (currentWeekHours < weeklyGoalHours && newWeekTotal >= weeklyGoalHours) {
      triggerConfetti();
      toast({
        title: "Weekly Goal Achieved!",
        description: `You've hit ${weeklyGoalHours} hours this week. Amazing work!`,
      });
    } else {
      toast({
        title: "Session logged successfully",
        description: `${hoursNum} hours added for ${finalSubject}`,
      });
    }

    // Reset form
    setSubject("");
    setCustomSubject("");
    setDate(new Date().toISOString().split("T")[0]);
    setTimeStart("");
    setTimeEnd("");
    setHours("");
    setGoalTopic("");
    setRemarks("");
    setMood(undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log Study Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject" data-testid="select-subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {allSubjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Custom Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {subject === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="customSubject">Custom Subject Name *</Label>
                <Input
                  id="customSubject"
                  data-testid="input-custom-subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g., Chemistry, Spanish"
                />
              </motion.div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                data-testid="input-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeStart">Time Started</Label>
                <Input
                  id="timeStart"
                  data-testid="input-time-start"
                  type="time"
                  value={timeStart}
                  onChange={(e) => handleTimeChange(e.target.value, timeEnd)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeEnd">Time Ended</Label>
                <Input
                  id="timeEnd"
                  data-testid="input-time-end"
                  type="time"
                  value={timeEnd}
                  onChange={(e) => handleTimeChange(timeStart, e.target.value)}
                />
              </div>
            </div>

            {/* Hours Studied */}
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Studied *</Label>
              <Input
                id="hours"
                data-testid="input-hours"
                type="number"
                step="0.25"
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
                data-testid="input-goal-topic"
                value={goalTopic}
                onChange={(e) => setGoalTopic(e.target.value)}
                placeholder="e.g., Chapter 5: Quadratic Equations"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Notes</Label>
              <Textarea
                id="remarks"
                data-testid="textarea-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any notes, reflections, or observations..."
                rows={4}
              />
            </div>

            {/* Mood Rating */}
            <div className="space-y-2">
              <Label>Productivity / Mood Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    data-testid={`button-mood-${rating}`}
                    onClick={() => setMood(rating)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        mood && mood >= rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-testid="button-log-session"
              className="w-full glow-primary-strong"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Log Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
