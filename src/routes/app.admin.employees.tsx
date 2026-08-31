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
import { Plus, Trash2, Search, Eye, Edit, Key } from "lucide-react";
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

  // Get WFH employees for today
  const wfhEmployeesToday = useMemo(() => {
    const todayAttendance = state.attendance.filter(
      (a) => a.date === todayDate && a.status === "WFH",
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
    if (status === "active") return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    if (status === "inactive") return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Active</Badge>;
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

  return (
    <div className="p-6 sm:p-8 max-w-full">
      {!isProfileRoute && (
        <>
          <PageHeader
            title="Employees"
            description="Manage your team members, view profiles and track attendance."
            actions={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add employee
              </Button>
            }
          />

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

          <Card>
            <CardContent className="p-0">
              {/* Search Bar */}
              <div className="p-4 border-b border-border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm flex-1 min-w-[220px]">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search employees by ID, name, email, department…"
                      className="pl-9"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All</option>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort("name")}
                        >
                          Employee
                          {sortBy === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort("employeeId")}
                        >
                          Employee ID
                          {sortBy === "employeeId" && (sortOrder === "asc" ? " ↑" : " ↓")}
                        </button>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort("department")}
                        >
                          Department
                          {sortBy === "department" && (sortOrder === "asc" ? " ↑" : " ↓")}
                        </button>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance Today</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                          {filteredEmployees.length === 0
                            ? "No employees found."
                            : "No results on this page."}
                        </TableCell>
                      </TableRow>
                    )}
                    {paginatedEmployees.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                              <AvatarFallback className="bg-primary-soft text-accent-foreground text-xs">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                              <div className="font-medium text-sm">{u.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{u.employeeId || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-sm">
                          {u.department ? (
                            <Badge className="bg-slate-100 text-slate-800 uppercase">
                              {u.department}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.designation || "Employee"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.phone}</TableCell>
                        <TableCell>{getStatusBadge(u.status)}</TableCell>
                        <TableCell>
                          {wfhEmployeesToday.has(u.id) ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">WFH</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Office
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => navigate({ to: `/app/admin/employees/${u.id}` })}
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Edit"
                              onClick={() => handleEditClick(u)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                              title="Reset Password"
                              onClick={() => handleResetPasswordClick(u)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={async () => {
                                await removeUser(u.id);
                                toast.success("Employee removed");
                                if (paginatedEmployees.length === 1 && currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
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
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, sortedEmployees.length)} of{" "}
                    {sortedEmployees.length} employees
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
        </>
      )}

      <Outlet />
    </div>
  );
}
