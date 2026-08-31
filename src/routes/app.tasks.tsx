import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { Task } from "@/lib/mock-data";

export const Route = createFileRoute("/app/tasks")({
  component: EmployeeTasks,
});

function EmployeeTasks() {
  const { currentUser, state, completeTask } = useStore();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Metrics (scoped to current employee only)
  const metrics = useMemo(() => {
    const myTasks = state.tasks;
    const total = myTasks.length;
    const pending = myTasks.filter((t) => t.status === "Pending").length;
    const completed = myTasks.filter((t) => t.status === "Completed").length;

    return { total, pending, completed };
  }, [state.tasks]);

  // Scoped task list filtering
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (activeTab === "pending" && t.status !== "Pending") return false;
      if (activeTab === "completed" && t.status !== "Completed") return false;
      return true;
    });
  }, [state.tasks, activeTab]);

  const handleMarkCompleted = async (id: string) => {
    setCompletingId(id);
    try {
      await completeTask(id);
      toast.success("Task completed successfully!");
      if (detailsOpen && selectedTask?.id === id) {
        setDetailsOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark task as completed");
    } finally {
      setCompletingId(null);
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Medium</Badge>;
      case "Low":
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Low</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "employee") return <Navigate to="/app/admin" />;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="My Tasks"
        description="View and track tasks assigned to you. Mark them as completed when done."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Tasks
            </CardTitle>
            <ClipboardList className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{metrics.pending}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{metrics.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({metrics.pending})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "completed"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({metrics.completed})
        </button>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-lg border border-border border-dashed">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium text-sm">No tasks in this section.</p>
            <p className="text-xs mt-1 text-muted-foreground">You are all caught up!</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue = t.status === "Pending" && t.dueDate < todayStr;
            const isDueToday = t.status === "Pending" && t.dueDate === todayStr;

            return (
              <Card
                key={t.id}
                className={`shadow-sm relative transition-all hover:shadow-md ${
                  isOverdue ? "border-red-200 bg-red-50/10" : ""
                } ${isDueToday ? "border-amber-200 bg-amber-50/10" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold line-clamp-1">
                      {t.title}
                    </CardTitle>
                    {getPriorityBadge(t.priority)}
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">
                    {t.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-xs text-muted-foreground space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    <div>
                      <span className="font-medium">Assigned: </span>
                      {formatDate(t.assignedDate)}
                    </div>
                    {t.status === "Pending" ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Due: </span>
                        <span
                          className={`font-semibold ${
                            isOverdue
                              ? "text-red-600 flex items-center gap-0.5"
                              : isDueToday
                                ? "text-amber-600 flex items-center gap-0.5"
                                : ""
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline" />}
                          {formatDate(t.dueDate)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium text-green-700">Completed: </span>
                        <span className="font-semibold text-green-700">
                          {formatDate(t.completedDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 h-8"
                      onClick={() => handleViewDetails(t)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                    </Button>

                    {t.status === "Pending" && (
                      <Button
                        size="sm"
                        disabled={completingId === t.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 h-8 shadow-sm font-medium"
                        onClick={() => handleMarkCompleted(t.id)}
                      >
                        {completingId === t.id ? (
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between mt-2">
              <DialogTitle className="text-lg font-bold">{selectedTask?.title}</DialogTitle>
              {selectedTask && getPriorityBadge(selectedTask.priority)}
            </div>
            <DialogDescription className="sr-only">
              Detailed view of the selected task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-muted/40 p-3.5 rounded-lg border border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Description
              </span>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedTask?.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-3">
              <div>
                <span className="text-xs text-muted-foreground block">Assigned Date</span>
                <span className="font-semibold text-foreground">
                  {formatDate(selectedTask?.assignedDate)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Assigned By</span>
                <span className="font-semibold text-foreground">
                  {selectedTask?.assignedByName || "Admin"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  {selectedTask?.status === "Pending" ? "Due Date" : "Completed Date"}
                </span>
                <span
                  className={`font-semibold ${
                    selectedTask?.status === "Pending" && selectedTask?.dueDate < todayStr
                      ? "text-red-600"
                      : selectedTask?.status === "Completed"
                        ? "text-green-700"
                        : "text-foreground"
                  }`}
                >
                  {selectedTask?.status === "Pending"
                    ? formatDate(selectedTask?.dueDate)
                    : formatDate(selectedTask?.completedDate)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <Badge
                  className={
                    selectedTask?.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {selectedTask?.status}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="text-xs">
              Close
            </Button>
            {selectedTask?.status === "Pending" && (
              <Button
                disabled={completingId === selectedTask?.id}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 shadow-sm font-medium"
                onClick={() => handleMarkCompleted(selectedTask?.id)}
              >
                {completingId === selectedTask?.id ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Mark Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
