import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Session, Goal } from "@/hooks/useSessions";
import {
  Target,
  Plus,
  Trash2,
  Search,
  MessageSquare,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface GoalsRemarksProps {
  sessions: Session[];
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  onDeleteGoal: (id: string) => void;
}

export default function GoalsRemarks({
  sessions,
  goals,
  onAddGoal,
  onDeleteGoal,
}: GoalsRemarksProps) {
  const { toast } = useToast();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalSubject, setNewGoalSubject] = useState("");
  const [newGoalType, setNewGoalType] = useState<"weekly" | "monthly">("weekly");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [remarkSearch, setRemarkSearch] = useState("");
  const [remarkSubjectFilter, setRemarkSubjectFilter] = useState("all");

  // Calculate progress for each goal
  const goalProgress = useMemo(() => {
    const now = new Date();
    const progressMap = new Map<string, { current: number; percentage: number }>();

    goals.forEach((goal) => {
      let relevantSessions: Session[];

      if (goal.type === "weekly") {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split("T")[0];
        relevantSessions = sessions.filter(
          (s) => s.subject === goal.subject && s.date >= weekStartStr
        );
      } else {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split("T")[0];
        relevantSessions = sessions.filter(
          (s) => s.subject === goal.subject && s.date >= monthStartStr
        );
      }

      const current = relevantSessions.reduce((sum, s) => sum + s.hours, 0);
      const percentage = Math.min((current / goal.targetHours) * 100, 100);

      progressMap.set(goal.id, { current, percentage });
    });

    return progressMap;
  }, [goals, sessions]);

  const handleAddGoal = () => {
    if (!newGoalSubject || !newGoalTarget) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      toast({
        title: "Invalid target",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
      return;
    }

    onAddGoal({
      subject: newGoalSubject,
      type: newGoalType,
      targetHours: target,
    });

    toast({
      title: "Goal created",
      description: `${newGoalType} goal for ${newGoalSubject} added`,
    });

    setNewGoalSubject("");
    setNewGoalTarget("");
    setIsAddGoalOpen(false);
  };

  // Get unique subjects for filter
  const allSubjects = useMemo(() => {
    const subjects = new Set(sessions.map((s) => s.subject));
    return Array.from(subjects).sort();
  }, [sessions]);

  // Filter remarks
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const matchesSearch =
          remarkSearch === "" ||
          s.remarks?.toLowerCase().includes(remarkSearch.toLowerCase()) ||
          s.goalTopic.toLowerCase().includes(remarkSearch.toLowerCase());

        const matchesSubject =
          remarkSubjectFilter === "all" || s.subject === remarkSubjectFilter;

        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.timeStart.localeCompare(a.timeStart);
      });
  }, [sessions, remarkSearch, remarkSubjectFilter]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="goals" data-testid="tab-goals">
            <Target className="h-4 w-4 mr-2" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="remarks" data-testid="tab-remarks">
            <MessageSquare className="h-4 w-4 mr-2" />
            Remarks
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Study Goals</h2>
            <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-goal">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalSubject">Subject</Label>
                    <Input
                      id="goalSubject"
                      data-testid="input-goal-subject"
                      value={newGoalSubject}
                      onChange={(e) => setNewGoalSubject(e.target.value)}
                      placeholder="e.g., Math, Programming"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalType">Goal Type</Label>
                    <Select
                      value={newGoalType}
                      onValueChange={(v) => setNewGoalType(v as "weekly" | "monthly")}
                    >
                      <SelectTrigger id="goalType" data-testid="select-goal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalTarget">Target Hours</Label>
                    <Input
                      id="goalTarget"
                      data-testid="input-goal-target"
                      type="number"
                      step="0.5"
                      min="0"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="e.g., 20"
                    />
                  </div>
                  <Button
                    onClick={handleAddGoal}
                    className="w-full"
                    data-testid="button-create-goal"
                  >
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {goals.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No goals set yet. Create one to track your progress!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal, index) => {
                const progress = goalProgress.get(goal.id) || {
                  current: 0,
                  percentage: 0,
                };

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {goal.subject}
                            </CardTitle>
                            <Badge variant="outline" className="mt-2">
                              {goal.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteGoal(goal.id)}
                            data-testid={`button-delete-goal-${goal.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {progress.current.toFixed(1)} / {goal.targetHours}h
                            </span>
                          </div>
                          <Progress value={progress.percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {progress.percentage.toFixed(0)}% complete
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Remarks Tab */}
        <TabsContent value="remarks" className="space-y-4">
          <h2 className="text-2xl font-bold">Study Remarks & Notes</h2>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      data-testid="input-search-remarks"
                      placeholder="Search remarks and topics..."
                      value={remarkSearch}
                      onChange={(e) => setRemarkSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={remarkSubjectFilter}
                  onValueChange={setRemarkSubjectFilter}
                >
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-subject-filter">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No remarks found matching your search.</p>
                </CardContent>
              </Card>
            ) : (
              filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge>{session.subject}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {session.date}
                          </span>
                          {session.mood && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: session.mood }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-primary text-primary"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {session.hours}h
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{session.goalTopic}</h3>
                      {session.remarks && (
                        <p className="text-sm text-muted-foreground">
                          {session.remarks}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {session.timeStart} - {session.timeEnd}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
