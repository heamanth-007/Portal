import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Eye, Edit, Key, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";

export const Route = createFileRoute("/app/admin/employees")({
  component: AdminEmployees,
});

type SortField = "name" | "department" | "employeeId";

function AdminEmployees() {
  const navigate = useNavigate();
  const { currentUser, state, removeUser } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("employeeId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = currentUser?.role === "admin";
  const location = useLocation();
  const isProfileRoute =
    location.pathname.startsWith("/app/admin/employees/") &&
    location.pathname !== "/app/admin/employees";

  // Get today's date for attendance check
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Get Present employees for today
  const presentEmployeesToday = useMemo(() => {
    const todayAttendance = state.attendance.filter(
      (a) => a.date === todayDate && a.status === "PRESENT",
    );
    return new Set(todayAttendance.map((a) => a.userId));
  }, [state.attendance, todayDate]);

  // Filter employees
  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          state.users
            .filter((u) => u.role === "employee")
            .map((u) => u.department || "")
            .filter(Boolean),
        ),
      ).sort(),
    [state.users],
  );

  const filteredEmployees = useMemo(
    () =>
      state.users
        .filter((u) => u.role === "employee")
        .filter((u) => (departmentFilter ? u.department === departmentFilter : true))
        .filter((u) =>
          query.trim()
            ? `${u.name} ${u.email} ${u.department} ${u.employeeId}`
                .toLowerCase()
                .includes(query.toLowerCase())
            : true,
        ),
    [state.users, query, departmentFilter],
  );

  // Sort employees
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    sorted.sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";

      if (sortBy === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortBy === "department") {
        aVal = a.department || "";
        bVal = b.department || "";
      } else if (sortBy === "employeeId") {
        aVal = a.employeeId || "";
        bVal = b.employeeId || "";
      }

      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sorted;
  }, [filteredEmployees, sortBy, sortOrder]);

  // Paginate employees
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedEmployees.slice(start, end);
  }, [sortedEmployees, currentPage]);

  if (!currentUser) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/app/dashboard" />;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status?.toLowerCase() === "active" || !status) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-none">
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold shadow-none">
        Inactive
      </Badge>
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleEditClick = (employee: any) => {
    setSelectedEmployee(employee);
    setEditOpen(true);
  };

  const handleResetPasswordClick = (employee: any) => {
    setSelectedEmployee(employee);
    setResetOpen(true);
  };

  // Stats for the top cards
  const stats = useMemo(() => {
    const total = state.users.filter((u) => u.role === "employee").length;
    const active = state.users.filter((u) => u.role === "employee" && (u.status?.toLowerCase() === "active" || !u.status)).length;
    const present = presentEmployeesToday.size;
    const deptCount = departments.length;
    return { total, active, present, deptCount };
  }, [state.users, presentEmployeesToday, departments]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {!isProfileRoute && (
        <>
          <PageHeader
            title="Employees Management"
            description="Manage your team members, view detailed profiles and track attendance."
            actions={
              <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            }
          />

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees</div>
              <div className="text-2xl font-bold mt-1 text-foreground">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Status</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.active}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Present Today</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{stats.present} / {stats.total}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Departments</div>
              <div className="text-2xl font-bold mt-1 text-purple-600">{stats.deptCount}</div>
            </div>
          </div>

          <AddEmployeeModal open={addOpen} onOpenChange={setAddOpen} />
          {selectedEmployee && (
            <EditEmployeeModal
              open={editOpen}
              onOpenChange={setEditOpen}
              employee={selectedEmployee}
            />
          )}
          {selectedEmployee && (
            <ResetPasswordModal
              open={resetOpen}
              onOpenChange={setResetOpen}
              employee={selectedEmployee}
            />
          )}

          <Card className="shadow-sm border-border overflow-hidden">
            <CardContent className="p-0">
              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-border bg-muted/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm flex-1 min-w-[240px]">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search by ID, name, email, department…"
                      className="pl-9 bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Department:</span>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[200px]">
                        <button
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase tracking-wider font-bold text-xs"
                          onClick={() => toggleSort("name")}
                        >
                          Employee
                          {sortBy === "name" ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[130px]">
                        <button
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase tracking-wider font-bold text-xs"
                          onClick={() => toggleSort("employeeId")}
                        >
                          Employee ID
                          {sortBy === "employeeId" ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[220px]">
                        Email
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[140px]">
                        <button
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase tracking-wider font-bold text-xs"
                          onClick={() => toggleSort("department")}
                        >
                          Department
                          {sortBy === "department" ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[160px]">
                        Designation
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[140px]">
                        Phone
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[110px] text-center">
                        Status
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[150px] text-center">
                        Attendance Today
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[140px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                          {filteredEmployees.length === 0
                            ? "No employees found matching your search."
                            : "No results on this page."}
                        </TableCell>
                      </TableRow>
                    )}
                    {paginatedEmployees.map((u) => (
                      <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors border-b border-border/60">
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                              {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                              <div className="font-semibold text-sm text-foreground">{u.name}</div>
                              <div className="text-[11px] text-muted-foreground font-medium">{u.role?.toUpperCase() || "EMPLOYEE"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                            {u.employeeId || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-sm text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle">
                          {u.department ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 uppercase text-[11px] font-semibold tracking-wide">
                              {u.department}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-sm text-foreground font-medium">
                          {u.designation || "Employee"}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-sm text-muted-foreground">
                          {u.phone || "—"}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-center">
                          {getStatusBadge(u.status)}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-center">
                          {presentEmployeesToday.has(u.id) ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs shadow-none">
                              Present
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground bg-slate-50 border-slate-200 font-medium">
                              Not Marked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => navigate({ to: `/app/admin/employees/${u.id}` })}
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                              title="Edit"
                              onClick={() => handleEditClick(u)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                              title="Reset Password"
                              onClick={() => handleResetPasswordClick(u)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${u.name}?`)) {
                                  await removeUser(u.id);
                                  toast.success("Employee removed successfully");
                                  if (paginatedEmployees.length === 1 && currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                  }
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, sortedEmployees.length)} of{" "}
                    {sortedEmployees.length} employees
                  </div>
                  <div className="flex gap-1.5">
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
        </>
      )}

      <Outlet />
    </div>
  );
}
