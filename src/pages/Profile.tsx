import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import type { Session, Settings } from "@/hooks/useSessions";
import { getLocalDateStr } from "@/hooks/useSessions";
import {
  User,
  Share2,
  Copy,
  Check,
  Target,
  BookOpen,
  Flame,
  Clock,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProfileProps {
  sessions: Session[];
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
}

const AVATAR_OPTIONS = [
  "📚", "🎯", "⚡", "🌟", "🧠", "🔥",
  "✨", "🦁", "🚀", "🎓", "💡", "🌿",
  "🏆", "⚔️", "🧩", "🎵",
];

export default function Profile({ sessions, settings, onUpdateSettings }: ProfileProps) {
  const [name, setName] = useState(settings.profile?.name ?? "");
  const [bio, setBio] = useState(settings.profile?.bio ?? "");
  const [avatar, setAvatar] = useState(settings.profile?.avatar ?? "📚");
  const [weeklyGoal, setWeeklyGoal] = useState(String(settings.weeklyGoalHours));
  const [shareSubject, setShareSubject] = useState("all");
  const [sharePeriod, setSharePeriod] = useState("monthly");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const allSubjects = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.subject))).sort(),
    [sessions]
  );

  const overallStats = useMemo(() => {
    const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
    const totalSessions = sessions.length;
    const uniqueSubjects = new Set(sessions.map((s) => s.subject)).size;
    const uniqueDays = new Set(sessions.map((s) => s.date)).size;

    // Overall streak: count consecutive days with sessions
    // First session = streak 1, consistent days = streak++, break = streak 0
    const sortedDates = Array.from(new Set(sessions.map((s) => s.date))).sort(
      (a, b) => b.localeCompare(a)
    );
    
    if (sortedDates.length === 0) {
      return { totalHours, totalSessions, uniqueSubjects, uniqueDays, streak: 0 };
    }
    
    let streak = 0;
    const mostRecentDate = sortedDates[0];
    
    // Start counting from the most recent study day
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(mostRecentDate);
      expected.setDate(expected.getDate() - i);
      if (sortedDates[i] === getLocalDateStr(expected)) streak++;
      else break;
    }

    return { totalHours, totalSessions, uniqueSubjects, uniqueDays, streak };
  }, [sessions]);

  const handleSaveProfile = () => {
    const goalNum = parseFloat(weeklyGoal);
    onUpdateSettings({
      profile: { name: name.trim(), bio: bio.trim(), avatar },
      weeklyGoalHours: isNaN(goalNum) || goalNum <= 0 ? 20 : goalNum,
    });
    toast("Profile saved", { description: "Your profile has been updated" });
  };

  const generateShareLink = () => {
    const now = new Date();
    let filtered = [...sessions];
    let periodLabel = "All Time";

    if (shareSubject !== "all") {
      filtered = filtered.filter((s) => s.subject === shareSubject);
    }

    if (sharePeriod === "weekly") {
      const ws = new Date(now);
      ws.setDate(now.getDate() - now.getDay());
      const wsStr = getLocalDateStr(ws);
      filtered = filtered.filter((s) => s.date >= wsStr);
      periodLabel = `Week of ${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else if (sharePeriod === "monthly") {
      const ms = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      filtered = filtered.filter((s) => s.date >= ms);
      periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (sharePeriod === "yearly") {
      const ys = `${now.getFullYear()}-01-01`;
      filtered = filtered.filter((s) => s.date >= ys);
      periodLabel = String(now.getFullYear());
    }

    // Streak for filtered set: count consecutive days with sessions
    // First session = streak 1, consistent days = streak++, break = streak 0
    const sortedDates = Array.from(new Set(filtered.map((s) => s.date))).sort(
      (a, b) => b.localeCompare(a)
    );
    
    let streak = 0;
    if (sortedDates.length > 0) {
      const mostRecentDate = sortedDates[0];
      
      // Start counting from the most recent study day
      for (let i = 0; i < sortedDates.length; i++) {
        const expected = new Date(mostRecentDate);
        expected.setDate(expected.getDate() - i);
        if (sortedDates[i] === getLocalDateStr(expected)) streak++;
        else break;
      }
    }

    const shareData = {
      name: name.trim() || "A FocusFlow User",
      avatar,
      subject: shareSubject === "all" ? "All Subjects" : shareSubject,
      period: periodLabel,
      totalHours: parseFloat(filtered.reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
      sessionCount: filtered.length,
      streak,
    };

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    setShareUrl(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("Link copied!", { description: "Share it with your friends" });
    } catch {
      toast.error("Copy failed", { description: "Please copy the link manually" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Current profile preview */}
          {(name || avatar) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <span className="text-3xl">{avatar}</span>
              <div>
                <p className="font-semibold">{name || "Anonymous Learner"}</p>
                {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
              </div>
            </div>
          )}

          {/* Avatar picker */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg transition-all border-2 ${
                    avatar === emoji
                      ? "border-primary bg-primary/20 scale-110 shadow-md"
                      : "border-transparent hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Your study goals, motivation, or anything you want…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly-goal" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Weekly Study Goal (hours)
            </Label>
            <Input
              id="weekly-goal"
              type="number"
              min="1"
              max="168"
              step="0.5"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveProfile} className="w-full">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your All-Time Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Total Hours",    value: overallStats.totalHours.toFixed(1), icon: Clock },
                { label: "Sessions",       value: overallStats.totalSessions,        icon: CalendarDays },
                { label: "Days Studied",   value: overallStats.uniqueDays,            icon: CalendarDays },
                { label: "Current Streak", value: `${overallStats.streak}d`,         icon: Flame },
                { label: "Subjects",       value: overallStats.uniqueSubjects,       icon: BookOpen },
                {
                  label: "Avg hrs/session",
                  value: overallStats.totalSessions
                    ? (overallStats.totalHours / overallStats.totalSessions).toFixed(1)
                    : "—",
                  icon: Clock,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                  <Icon className="h-4 w-4 mx-auto mb-1 text-primary opacity-70" />
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Progress
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a shareable link with a snapshot of your study stats
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={shareSubject} onValueChange={setShareSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {allSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={sharePeriod} onValueChange={setSharePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="alltime">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateShareLink} variant="outline" className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            Generate Link
          </Button>

          {shareUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs font-mono" />
                <Button size="icon" onClick={handleCopy} variant="outline" className="shrink-0">
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link sees a read-only snapshot of your stats
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
