import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchAdminDateAttendance,
  fetchAdminMonthlyAttendance,
  fetchAdminAllAttendance,
  fetchAdminMonthlySummaries,
  generateAdminMonthlySummary,
} from "@/lib/attendanceService";
import { getStatusBadgeClass, formatWorkingHours } from "@/lib/attendanceUtils";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  Info,
  AlertTriangle,
  ShieldAlert,
  Laptop,
  Network,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/app/admin/attendance")({
  component: AdminAttendance,
});

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AdminAttendance() {
  const { currentUser } = useStore();
  const [tab, setTab] = useState("list");

  // Filters
  const [viewMode, setViewMode] = useState<"date" | "month" | "all">("all");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [statusFilter, setStatusFilter] = useState<"all" | "PRESENT" | "ABSENT" | "HOLIDAY">("all");
  const [searchName, setSearchName] = useState("");
  const [geofenceOnly, setGeofenceOnly] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Summaries
  const [summaries, setSummaries] = useState<any[]>([]);
  const [summaryMonth, setSummaryMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [summaryYear, setSummaryYear] = useState(String(new Date().getFullYear()));
  const [generatingSummary, setGeneratingSummary] = useState(false);

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "admin") return <Navigate to="/app/dashboard" />;

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (viewMode === "date") {
        const data = await fetchAdminDateAttendance(date);
        setRecords(data.data?.records || data.records || []);
      } else if (viewMode === "month") {
        const data = await fetchAdminMonthlyAttendance(month, year);
        setRecords(data.data?.records || data.records || []);
      } else {
        const data = await fetchAdminAllAttendance();
        setRecords(data.data?.records || data.records || []);
      }
      setPage(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [viewMode, date, month, year]);

  const loadSummaries = async () => {
    try {
      const data = await fetchAdminMonthlySummaries(summaryMonth, summaryYear);
      setSummaries(data.data?.summaries || data.summaries || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load summaries");
    }
  };

  useEffect(() => {
    if (tab === "summary") {
      loadSummaries();
    }
  }, [tab, summaryMonth, summaryYear]);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const data = await generateAdminMonthlySummary(summaryMonth, summaryYear);
      setSummaries(data.data?.summaries || data.summaries || []);
      toast.success("Monthly summary generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Calendar logic
  const [calendarRecords, setCalendarRecords] = useState<any[]>([]);
  const loadCalendarMonth = async (m: string, y: string) => {
    try {
      const data = await fetchAdminMonthlyAttendance(m, y);
      setCalendarRecords(data.data?.records || data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDatesSet = (arg: any) => {
    const d = arg.view.currentStart;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = String(d.getFullYear());
    loadCalendarMonth(m, y);
  };

  // Convert records to events
  const calendarEvents = useMemo(() => {
    const map = new Map<string, number>();
    calendarRecords.forEach((r) => {
      const d = r.date;
      if (r.status === "PRESENT") {
        map.set(d, (map.get(d) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([d, count]) => ({
      title: `${count} Present`,
      date: d,
      allDay: true,
      color: "#22c55e",
    }));
  }, [calendarRecords]);

  // Pagination
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return records;
    return records.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
  const paginatedRecords = filteredByStatus.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Attendance Management"
        description="View full attendance history and manage records."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Filter By</Label>
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Specific Date</SelectItem>
                    <SelectItem value="month">Month & Year</SelectItem>
                    <SelectItem value="all">All Records</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v: any) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {viewMode === "date" ? (
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              ) : viewMode === "month" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => {
                          const m = String(i + 1).padStart(2, "0");
                          return (
                            <SelectItem key={m} value={m}>
                              {new Date(2000, i).toLocaleString("default", { month: "long" })}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }).map((_, i) => {
                          const y = String(new Date().getFullYear() - 2 + i);
                          return (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Total Hrs</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((r: any) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {r.employeeId?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.employeeId?.designation || "Employee"}
                        </TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{fmt(r.checkInTime)}</TableCell>
                        <TableCell>{fmt(r.checkOutTime)}</TableCell>
                        <TableCell>{formatWorkingHours(r.totalHours)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {!loading && totalPages > 1 && (
                <div className="p-4 border-t flex justify-end gap-2 items-center">
                  <span className="text-xs text-muted-foreground mr-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-4">
              <div className="min-h-[600px]">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  datesSet={handleDatesSet}
                  dateClick={(arg) => {
                    setDate(arg.dateStr);
                    setViewMode("date");
                    setTab("list");
                  }}
                  height="auto"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-end justify-between">
              <div className="flex gap-4">
                <div className="space-y-1.5">
                  <Label>Month</Label>
                  <Select value={summaryMonth} onValueChange={setSummaryMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = String(i + 1).padStart(2, "0");
                        return (
                          <SelectItem key={m} value={m}>
                            {new Date(2000, i).toLocaleString("default", { month: "long" })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Select value={summaryYear} onValueChange={setSummaryYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const y = String(new Date().getFullYear() - 2 + i);
                        return (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateSummary} disabled={generatingSummary}>
                {generatingSummary ? "Generating..." : "Generate / Update Summary"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-center">Worked Days</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Leave</TableHead>
                    <TableHead className="text-center">Holiday</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-right">Total Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                        No monthly summary found. Click Generate to calculate for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaries.map((s: any) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">
                          {s.employeeId?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.employeeId?.designation || "Employee"}
                        </TableCell>
                        <TableCell className="text-center font-bold">{s.totalWorkedDays}</TableCell>
                        <TableCell className="text-center text-green-600">
                          {s.totalPresent}
                        </TableCell>
                        <TableCell className="text-center text-yellow-600">
                          {s.totalLeave}
                        </TableCell>
                        <TableCell className="text-center text-purple-600">
                          {s.totalHoliday || 0}
                        </TableCell>
                        <TableCell className="text-center text-red-600">{s.totalAbsent}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatWorkingHours(s.totalHours)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
