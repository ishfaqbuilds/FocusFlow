import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getLocalDateStr } from "@/hooks/useSessions";
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "done";
  deadline: string; // YYYY-MM-DD
  createdAt: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("focusflow_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((task: any) => ({
          ...task,
          status: (task.status === "done" ? "done" : "pending") as "pending" | "done"
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "done">("pending");
  const [deadline, setDeadline] = useState("");

  // Save tasks to localStorage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("focusflow_tasks", JSON.stringify(newTasks));
  };

  const safeSetTasks = (newTasks: any[]) => {
    const typedTasks = newTasks.map((task) => ({
      ...task,
      status: (task.status === "done" ? "done" : "pending") as "pending" | "done"
    }));
    saveTasks(typedTasks);
  };

  const addTask = () => {
    if (!title.trim()) {
      toast.error("Title required", { description: "Please enter a task title" });
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: status as "pending" | "done",
      deadline: deadline || "",
      createdAt: getLocalDateStr(),
    };

    safeSetTasks([...tasks, newTask]);
    resetForm();
    setIsAddDialogOpen(false);
    toast("Task added", { description: "Your task has been created" });
  };

  const updateTask = () => {
    if (!editingTask || !title.trim()) {
      toast.error("Title required", { description: "Please enter a task title" });
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, title: title.trim(), description: description.trim(), status: status as "pending" | "done", deadline: deadline || "" }
        : task
    );

    safeSetTasks(updatedTasks);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingTask(null);
    toast("Task updated", { description: "Your task has been updated" });
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id);
    safeSetTasks(newTasks);
    setDeleteConfirmId(null);
    toast("Task deleted", { description: "The task has been removed" });
  };

  const toggleStatus = (id: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, status: (task.status === "pending" ? "done" : "pending") as "pending" | "done" }
        : task
    );
    safeSetTasks(newTasks);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setDeadline(task.deadline);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("pending");
    setDeadline("");
  };

  const getDeadlineStatus = (deadline: string): { status: "overdue" | "today" | "urgent" | "soon" | "normal"; days: number } | null => {
    if (!deadline) return null;

    const today = getLocalDateStr();
    const deadlineDate = new Date(deadline);
    const todayDate = new Date(today);
    
    const diffTime = deadlineDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "overdue" as const, days: Math.abs(diffDays) };
    if (diffDays === 0) return { status: "today" as const, days: 0 };
    if (diffDays <= 2) return { status: "urgent" as const, days: diffDays };
    if (diffDays <= 7) return { status: "soon" as const, days: diffDays };
    return { status: "normal" as const, days: diffDays };
  };

  const filteredTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by status (pending first), then by deadline
      if (a.status !== b.status) {
        return a.status === "pending" ? -1 : 1;
      }
      if (a.deadline && b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks]);

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    done: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const deadlineConfig = {
    overdue: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/20", label: "Overdue" },
    today: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/20", label: "Today" },
    urgent: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", label: "Due soon" },
    soon: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Upcoming" },
    normal: { icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", label: "Later" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage your study tasks and deadlines</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{tasks.filter(t => t.status === "pending").length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{tasks.filter(t => t.status === "done").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{tasks.filter(t => {
                const status = getDeadlineStatus(t.deadline);
                return status?.status === "overdue" || status?.status === "today";
              }).length}</p>
              <p className="text-xs text-muted-foreground">Overdue/Due Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet. Add your first task to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              const deadlineConfigItem = deadlineStatus ? deadlineConfig[deadlineStatus.status] : null;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className={`transition-all ${task.status === "done" ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStatus(task.id)}
                          className={`mt-1 shrink-0 ${task.status === "done" ? "text-green-500" : "text-muted-foreground hover:text-primary"}`}
                        >
                          <CheckCircle className={`h-5 w-5 ${task.status === "done" ? "fill-current" : ""}`} />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-semibold ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </h3>
                            <Badge className={`text-xs ${statusColors[task.status]}`}>
                              {task.status}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs">
                            {deadlineConfigItem && deadlineStatus && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${deadlineConfigItem.bg}`}>
                                <deadlineConfigItem.icon className={`h-3 w-3 ${deadlineConfigItem.color}`} />
                                <span className={deadlineConfigItem.color}>
                                  {deadlineConfigItem.label}
                                  {deadlineStatus.days > 0 && ` (${deadlineStatus.days}d)`}
                                  {deadlineStatus.days === 0 && " (today)"}
                                  {deadlineStatus.days < 0 && ` (${Math.abs(deadlineStatus.days)}d ago)`}
                                </span>
                              </div>
                            )}
                            {task.deadline && !deadlineConfigItem && (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {task.deadline}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditDialog(task)}
                            className="text-muted-foreground hover:text-primary p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(task.id)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v: "pending" | "done") => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={addTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={(v: "pending" | "done") => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-deadline">Deadline</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingTask(null); }}>
              Cancel
            </Button>
            <Button onClick={updateTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirmId) deleteTask(deleteConfirmId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}