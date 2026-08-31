import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  ClipboardList,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/task-management")({
  component: AdminTaskManagement,
});

function AdminTaskManagement() {
  const { currentUser, state, createTask, updateTask, deleteTask } = useStore();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form states
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
  });

  const employees = state.users.filter((u) => u.role === "employee");
  const todayStr = new Date().toISOString().slice(0, 10);

  // Metrics
  const metrics = useMemo(() => {
    const total = state.tasks.length;
    const pending = state.tasks.filter((t) => t.status === "Pending").length;
    const completed = state.tasks.filter((t) => t.status === "Completed").length;
    const overdue = state.tasks.filter(
      (t) => t.status === "Pending" && t.dueDate < todayStr,
    ).length;

    return { total, pending, completed, overdue };
  }, [state.tasks, todayStr]);

  // Filtering
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      // Tab filter
      if (activeTab === "pending" && t.status !== "Pending") return false;
      if (activeTab === "completed" && t.status !== "Completed") return false;

      // Priority filter
      if (priorityFilter && t.priority !== priorityFilter) return false;

      // Search filter (Employee Name or Task Title)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const emp = state.users.find((u) => u.id === t.assignedTo);
        const empName = emp ? emp.name.toLowerCase() : "";
        const taskTitle = t.title.toLowerCase();
        if (!empName.includes(query) && !taskTitle.includes(query)) return false;
      }

      return true;
    });
  }, [state.tasks, activeTab, priorityFilter, searchQuery, state.users]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTasks.slice(start, end);
  }, [filteredTasks, currentPage]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo || !form.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTask({
        title: form.title,
        description: form.description,
        priority: form.priority,
        assignedTo: form.assignedTo,
        dueDate: new Date(form.dueDate).toISOString(),
      });

      toast.success("Task assigned successfully");
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        dueDate: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to assign task");
    }
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title || !editForm.assignedTo || !editForm.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedTask) return;

    try {
      await updateTask(selectedTask.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        assignedTo: editForm.assignedTo,
        dueDate: new Date(editForm.dueDate).toISOString(),
      });

      toast.success("Task updated successfully");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(id);
        toast.success("Task deleted successfully");
        if (paginatedTasks.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to delete task");
      }
    }
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

  const getUserDetails = (userId: string) => {
    const user = state.users.find((u) => u.id === userId);
    return {
      name: user ? user.name : "Unknown Employee",
      avatar: user?.avatarUrl,
      initials: user
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "?",
    };
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
  if (currentUser.role !== "admin") return <Navigate to="/app/dashboard" />;

  return (
    <div className="p-6 sm:p-8 max-w-full">
      <PageHeader
        title="Task Management"
        description="Assign tasks to employees, monitor progress, and manage updates."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Assign Task
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
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
            <AlertCircle className="h-5 w-5 text-amber-500" />
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
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{metrics.completed}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
            <Calendar className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-red-600">
              {metrics.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card className="shadow-sm">
        <div className="border-b border-border bg-muted/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "pending"
                  ? "bg-white text-blue-700 shadow-sm border border-border"
                  : "text-muted-foreground hover:bg-gray-100"
              }`}
            >
              Pending Tasks
            </button>
            <button
              onClick={() => {
                setActiveTab("completed");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "completed"
                  ? "bg-white text-blue-700 shadow-sm border border-border"
                  : "text-muted-foreground hover:bg-gray-100"
              }`}
            >
              Completed Tasks
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or title…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Task Title</TableHead>
                  <TableHead className="max-w-xs truncate">Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  {activeTab === "pending" ? (
                    <TableHead>Due Date</TableHead>
                  ) : (
                    <TableHead>Completed Date</TableHead>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((t) => {
                    const empDetails = getUserDetails(t.assignedTo);
                    const isOverdue = t.status === "Pending" && t.dueDate < todayStr;
                    return (
                      <TableRow
                        key={t.id}
                        className={isOverdue ? "bg-red-50/20 hover:bg-red-50/30" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {empDetails.avatar && <AvatarImage src={empDetails.avatar} />}
                              <AvatarFallback className="bg-primary-soft text-accent-foreground text-xs">
                                {empDetails.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-sm">{empDetails.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{t.title}</TableCell>
                        <TableCell
                          className="text-sm text-muted-foreground max-w-xs truncate"
                          title={t.description}
                        >
                          {t.description || "—"}
                        </TableCell>
                        <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                        <TableCell className="text-sm">{formatDate(t.assignedDate)}</TableCell>
                        {activeTab === "pending" ? (
                          <TableCell className="text-sm">
                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                              {formatDate(t.dueDate)}
                            </span>
                            {isOverdue && (
                              <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 text-[10px] px-1 py-0 h-4">
                                Overdue
                              </Badge>
                            )}
                          </TableCell>
                        ) : (
                          <TableCell className="text-sm text-green-700 font-medium">
                            {formatDate(t.completedDate)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditClick(t)}
                              title="Edit Task"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteClick(t.id)}
                              title="Delete Task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of{" "}
                {filteredTasks.length} tasks
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign New Task</DialogTitle>
            <DialogDescription>
              Fill out the form below to assign a task to an employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="employee">Assign To Employee *</Label>
              <select
                id="employee"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} - {emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Update Monthly Financial Report"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Task Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Provide detailed instruction for the task..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task Details</DialogTitle>
            <DialogDescription>Modify the assigned task details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-employee">Assign To Employee *</Label>
              <select
                id="edit-employee"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={editForm.assignedTo}
                onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} - {emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Task Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Task Description</Label>
              <textarea
                id="edit-description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-priority">Priority *</Label>
                <select
                  id="edit-priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-dueDate">Due Date *</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
