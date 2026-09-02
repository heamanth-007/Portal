import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  checkIn,
  checkOut,
  fetchTodayAttendance,
  fetchMonthlyAttendance,
  fetchAllAttendance,
  fetchMonthlySummaries,
  fetchCompanySettings,
} from "@/lib/attendanceService";
import { MapPin, Navigation, Compass, Shield, Laptop, Network, Globe } from "lucide-react";
import { format } from "date-fns";
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
import { getStatusBadgeClass, formatWorkingHours } from "@/lib/attendanceUtils";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export const Route = createFileRoute("/app/attendance")({
  component: AttendancePage,
});

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getClientMetadata() {
  const userAgent = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (userAgent.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
  else if (userAgent.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
  else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) browser = "Opera";
  else if (userAgent.indexOf("Trident") > -1) browser = "Microsoft Internet Explorer";
  else if (userAgent.indexOf("Edge") > -1) browser = "Microsoft Edge";
  else if (userAgent.indexOf("Chrome") > -1) browser = "Google Chrome";
  else if (userAgent.indexOf("Safari") > -1) browser = "Apple Safari";

  if (userAgent.indexOf("Windows") > -1) os = "Windows";
  else if (userAgent.indexOf("Macintosh") > -1) os = "macOS";
  else if (userAgent.indexOf("Android") > -1) os = "Android";
  else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) os = "iOS";
  else if (userAgent.indexOf("Linux") > -1) os = "Linux";

  return {
    deviceInfo: `${os} Device`,
    browserDetails: browser,
  };
}

function AttendancePage() {
  const { currentUser } = useStore();

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === "admin") return <Navigate to="/app/admin/attendance" />;

  const [todayRecord, setTodayRecord] = useState<any>(null);

  // Geofencing states
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [employeeCoords, setEmployeeCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "success" | "error">("idle");
  const [gpsError, setGpsError] = useState<string>("");
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState<boolean | null>(null);

  // Tabs & Views
  const [tab, setTab] = useState("list");

  // Filters
  const [viewMode, setViewMode] = useState<"month" | "all">("all");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [statusFilter, setStatusFilter] = useState<"all" | "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY">(
    "all",
  );

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

  // Calendar logic
  const [calendarRecords, setCalendarRecords] = useState<any[]>([]);

  const fetchToday = async () => {
    try {
      const res = await fetchTodayAttendance();
      if (res.data?.attendance) {
        setTodayRecord(res.data.attendance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetchCompanySettings();
      if (res.data?.settings) {
        setCompanySettings(res.data.settings);
      }
    } catch (e) {
      console.error("Failed to fetch geofencing settings", e);
    }
  };

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setGpsStatus("acquiring");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setEmployeeCoords(coords);
        setGpsStatus("success");
        setGpsError("");
      },
      (error) => {
        setGpsStatus("error");
        let msg = "Failed to acquire location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enable GPS permissions in browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS coordinates unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out.";
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  useEffect(() => {
    fetchToday();
    fetchSettings();
    acquireLocation();
  }, []);

  useEffect(() => {
    if (employeeCoords && companySettings) {
      const dist = getDistanceFromLatLonInM(
        employeeCoords.latitude,
        employeeCoords.longitude,
        companySettings.latitude,
        companySettings.longitude,
      );
      setDistanceFromOffice(dist);
      setIsInsideRadius(dist <= companySettings.allowedRadius);
    }
  }, [employeeCoords, companySettings]);

  const handleCheckIn = async () => {
    if (companySettings && companySettings.enforceGeofencing && isInsideRadius === false) {
      toast.error("You are outside the company location. Check-In not allowed.");
      return;
    }

    try {
      const metadata = getClientMetadata();
      const payload = {
        latitude: employeeCoords?.latitude ?? 0,
        longitude: employeeCoords?.longitude ?? 0,
        accuracy: employeeCoords?.accuracy ?? 0,
        ...metadata,
      };

      await checkIn(payload);
      toast.success("Checked in successfully!");
      fetchToday();
      if (tab === "list") loadRecords();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      const metadata = getClientMetadata();
      const payload = {
        latitude: employeeCoords?.latitude ?? 0,
        longitude: employeeCoords?.longitude ?? 0,
        accuracy: employeeCoords?.accuracy ?? 0,
        ...metadata,
      };

      await checkOut(payload);
      toast.success("Checked out successfully!");
      fetchToday();
      if (tab === "list") loadRecords();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to check out");
    }
  };

  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  // List View Loading
  const loadRecords = async () => {
    setLoading(true);
    try {
      if (viewMode === "month") {
        const data = await fetchMonthlyAttendance(month, year);
        setRecords(data.data?.records || data.records || []);
      } else {
        const data = await fetchAllAttendance();
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
    if (tab === "list") {
      loadRecords();
    }
  }, [viewMode, month, year, tab]);

  // Summaries Loading
  const loadSummaries = async () => {
    try {
      const data = await fetchMonthlySummaries(summaryMonth, summaryYear);
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

  // Calendar Loading
  const loadCalendarMonth = async (m: string, y: string) => {
    try {
      const data = await fetchMonthlyAttendance(m, y);
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

  const calendarEvents = useMemo(() => {
    return calendarRecords.map((r) => {
      let color = "#9ca3af"; // default gray
      if (r.status === "PRESENT") color = "#22c55e";
      if (r.status === "LEAVE") color = "#eab308";

      return {
        title: r.status,
        date: r.date,
        allDay: true,
        color,
      };
    });
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
        description="View your attendance history and manage records."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Status Card */}
        <Card className="lg:col-span-2 shadow-md border-0 ring-1 ring-black/5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex flex-col justify-between">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Today's Status</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {todayRecord?.status || "NOT MARKED"}
                    </span>
                    {todayRecord?.status && (
                      <span
                        className={`w-3 h-3 rounded-full ${todayRecord.status === "PRESENT" ? "bg-green-500" : "bg-red-500"}`}
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Check In</p>
                  <p className="text-xl font-bold">{fmt(todayRecord?.checkInTime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Check Out</p>
                  <p className="text-xl font-bold">{fmt(todayRecord?.checkOutTime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-xl font-bold">{formatWorkingHours(todayRecord?.totalHours)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6 pt-6 border-t border-indigo-100/50">
              <div className="text-xs text-muted-foreground leading-relaxed">
                {companySettings?.enforceGeofencing && isInsideRadius === false ? (
                  <span className="text-red-600 font-medium">
                    ⚠️ Check-in blocked: You are outside the office geofence.
                  </span>
                ) : (
                  <span>Ensure your location services are active before marking attendance.</span>
                )}
              </div>
              <div className="flex gap-4 w-full sm:w-auto shrink-0">
                <Button
                  onClick={handleCheckIn}
                  disabled={
                    hasCheckedIn ||
                    (companySettings?.enforceGeofencing && isInsideRadius === false) ||
                    gpsStatus === "acquiring"
                  }
                  className="flex-grow sm:flex-none w-32 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                  size="lg"
                >
                  Check In
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckOut}
                  disabled={!hasCheckedIn || hasCheckedOut || gpsStatus === "acquiring"}
                  className="flex-grow sm:flex-none w-32 bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold"
                  size="lg"
                >
                  Check Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Location Status Card */}
        <Card className="shadow-md border-0 ring-1 ring-black/5 bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-600 animate-pulse" />
              <div>
                <CardTitle className="text-sm font-bold">Office Geofencing</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {companySettings?.companyName || "GPS Settings"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              {/* GPS Connection Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">GPS Signal:</span>
                {gpsStatus === "acquiring" ? (
                  <span className="inline-flex items-center text-amber-600 font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping" />
                    Acquiring GPS...
                  </span>
                ) : gpsStatus === "success" ? (
                  <span className="inline-flex items-center text-green-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                    Active / Connected
                  </span>
                ) : gpsStatus === "error" ? (
                  <span className="inline-flex items-center text-red-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                    GPS Error
                  </span>
                ) : (
                  <span className="text-muted-foreground">Inactive</span>
                )}
              </div>

              {/* Geofence Status Badge */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Geofence Status:</span>
                {gpsStatus === "success" && isInsideRadius !== null ? (
                  isInsideRadius ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold text-[10px] border border-green-200">
                      Inside office radius
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold text-[10px] border border-red-200">
                      Outside office boundary
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              {/* Distance logs */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Distance from Office:</span>
                <span className="font-bold text-foreground">
                  {distanceFromOffice !== null ? `${distanceFromOffice} meters` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">GPS Accuracy:</span>
                <span className="font-semibold text-muted-foreground">
                  {employeeCoords ? `± ${employeeCoords.accuracy} meters` : "—"}
                </span>
              </div>
            </div>

            {gpsStatus === "error" && (
              <div className="p-2.5 rounded-md bg-red-50 border border-red-100 text-[11px] leading-relaxed text-red-700 font-medium">
                {gpsError || "Please allow location access to continue."}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={acquireLocation}
                disabled={gpsStatus === "acquiring"}
                className="w-full bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Compass className="h-3.5 w-3.5" />
                Refresh Current GPS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Filter By</Label>
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="month">Month & Year</SelectItem>
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
                    <SelectItem value="LEAVE">Leave</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {viewMode === "month" && (
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((r: any) => (
                      <TableRow key={r._id}>
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
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-end justify-start">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No monthly summary generated yet for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaries.map((s: any) => (
                      <TableRow key={s._id}>
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
