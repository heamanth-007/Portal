import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { BirthdayPanel } from "@/components/birthday-panel";
import { BirthdayPopup } from "@/components/birthday-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CalendarDays,
  CheckCircle2,
  MapPinOff,
  Compass,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { getUpcomingBirthdays, isBirthdayToday } from "@/lib/birthday";
import { toast } from "sonner";
import {
  fetchCompanySettings,
  fetchTodayAttendance,
  checkIn as apiCheckIn,
  checkOut as apiCheckOut,
} from "@/lib/attendanceService";

export const Route = createFileRoute("/app/dashboard")({
  component: EmployeeDashboard,
});

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function getClientMetadata() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";

  return {
    deviceInfo: `${os} Device`,
    browserDetails: `${browser} Browser`,
  };
}

function EmployeeDashboard() {
  const { currentUser, state, checkIn, checkOut } = useStore();
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);

  // Geofence & Location state
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "success" | "error">("idle");
  const [employeeCoords, setEmployeeCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState<boolean | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayKey = `gemshine.birthday-popup-seen.${currentUser?.id ?? ""}`;
  const employees = state.users.filter((u) => u.role === "employee");
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(employees, 30, today),
    [employees, today],
  );
  const todayBirthdays = useMemo(
    () => employees.filter((u) => isBirthdayToday(u.dateOfBirth, today)),
    [employees, today],
  );

  const loadTodayData = useCallback(async () => {
    try {
      const res = await fetchTodayAttendance();
      if (res?.success) {
        setTodayRecord(res.data);
      }
    } catch {
      // fallback
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchCompanySettings();
      if (res?.success) {
        setCompanySettings(res.data);
      }
    } catch {
      // fallback
    }
  }, []);

  const acquireLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by your browser.");
      setIsInsideRadius(false);
      return;
    }

    setGpsStatus("acquiring");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setEmployeeCoords(coords);
        setGpsStatus("success");
      },
      (err) => {
        setGpsStatus("error");
        setIsInsideRadius(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("Location access denied. Please enable location permissions.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError("Location information unavailable.");
        } else {
          setGpsError("Location timeout. Please try refreshing GPS.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    loadTodayData();
    loadSettings();
    acquireLocation();
  }, [loadTodayData, loadSettings, acquireLocation]);

  useEffect(() => {
    if (employeeCoords && companySettings) {
      const dist = getDistanceFromLatLonInM(
        employeeCoords.latitude,
        employeeCoords.longitude,
        companySettings.latitude,
        companySettings.longitude,
      );
      setDistanceFromOffice(dist);
      setIsInsideRadius(dist <= (companySettings.allowedRadius || 100));
    }
  }, [employeeCoords, companySettings]);

  useEffect(() => {
    if (!currentUser || todayBirthdays.length === 0) return;
    try {
      const seenDate = localStorage.getItem(todayKey);
      const todayString = today.toISOString().slice(0, 10);
      if (seenDate !== todayString) {
        setBirthdayModalOpen(true);
      }
    } catch {
      setBirthdayModalOpen(true);
    }
  }, [currentUser, todayBirthdays.length, todayKey, today]);

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === "admin") return <Navigate to="/app/admin" />;

  const closeBirthdayModal = () => {
    try {
      localStorage.setItem(todayKey, today.toISOString().slice(0, 10));
    } catch {
      // ignore
    }
    setBirthdayModalOpen(false);
  };

  const todayDate = today.toISOString().slice(0, 10);
  const todayAttendance = state.attendance.find(
    (a) => a.userId === currentUser.id && a.date === todayDate,
  );

  const hasCheckedIn = !!todayRecord?.checkInTime || !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOutTime || !!todayAttendance?.checkOut;

  // Strict: check-in button is ONLY available when inside the office location
  const isCheckInAvailable =
    !hasCheckedIn &&
    (!companySettings?.enforceGeofencing || isInsideRadius === true) &&
    gpsStatus !== "acquiring" &&
    gpsStatus !== "error";

  const status = hasCheckedIn
    ? hasCheckedOut
      ? "Completed"
      : "Checked in"
    : "Not marked";

  const handleCheckInAction = async () => {
    if (!isCheckInAvailable) return;
    try {
      setActionLoading(true);
      const metadata = getClientMetadata();
      const payload = {
        latitude: employeeCoords?.latitude ?? 0,
        longitude: employeeCoords?.longitude ?? 0,
        accuracy: employeeCoords?.accuracy ?? 0,
        ...metadata,
      };

      await apiCheckIn(payload);
      toast.success("Checked in successfully!");
      await loadTodayData();
      if (currentUser) {
        await checkIn(currentUser.id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to check in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOutAction = async () => {
    try {
      setActionLoading(true);
      const metadata = getClientMetadata();
      const payload = {
        latitude: employeeCoords?.latitude ?? 0,
        longitude: employeeCoords?.longitude ?? 0,
        accuracy: employeeCoords?.accuracy ?? 0,
        ...metadata,
      };

      await apiCheckOut(payload);
      toast.success("Checked out successfully!");
      await loadTodayData();
      if (currentUser) {
        await checkOut(currentUser.id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to check out");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl space-y-6">
      <PageHeader
        title={`Hello, ${currentUser.name.split(" ")[0]}`}
        description="Here's a snapshot of your day."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today"
          value={status}
          icon={<Clock className="h-4 w-4" />}
          tone={status === "Completed" ? "success" : status === "Checked in" ? "primary" : "muted"}
        />
        <StatCard
          label="Check-in"
          value={formatTime(todayRecord?.checkInTime || todayAttendance?.checkIn)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Office Shift"
          value="09:00 - 18:00"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      <div>
        <BirthdayPanel title="Upcoming Birthdays" employees={upcomingBirthdays} highlightToday />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Today's Attendance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {companySettings?.enforceGeofencing ? "Office Geofencing Active" : "Location Attendance"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={acquireLocation}
              disabled={gpsStatus === "acquiring"}
              className="text-xs text-slate-700 hover:text-slate-900 h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${gpsStatus === "acquiring" ? "animate-spin text-blue-600" : ""}`} />
              Refresh GPS
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 bg-muted/20">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check in</div>
                <div className="text-xl font-bold mt-1 text-foreground">
                  {formatTime(todayRecord?.checkInTime || todayAttendance?.checkIn)}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 bg-muted/20">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check out</div>
                <div className="text-xl font-bold mt-1 text-foreground">
                  {formatTime(todayRecord?.checkOutTime || todayAttendance?.checkOut)}
                </div>
              </div>
            </div>

            {/* Geofence / Location Status message */}
            {!hasCheckedIn && (
              <div className="pt-1">
                {gpsStatus === "acquiring" ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                    <Compass className="h-4 w-4 animate-spin shrink-0 text-amber-600" />
                    <span>Acquiring GPS location to verify office boundary...</span>
                  </div>
                ) : companySettings?.enforceGeofencing && isInsideRadius === false ? (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                    <MapPinOff className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>Outside office boundary:</strong> You are{" "}
                      {distanceFromOffice !== null ? `${distanceFromOffice}m` : "far"} away from the office. Check-in is disabled.
                    </span>
                  </div>
                ) : companySettings?.enforceGeofencing && isInsideRadius === true ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Inside office location:</strong> ({distanceFromOffice}m from office). Check-in is available.
                    </span>
                  </div>
                ) : gpsStatus === "error" ? (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{gpsError || "Location access required to check in."}</span>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleCheckInAction}
                disabled={!isCheckInAvailable || actionLoading}
                className={`font-semibold min-w-[120px] shadow-sm ${
                  isCheckInAvailable
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-100"
                }`}
              >
                {actionLoading ? "Processing..." : "Check in"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCheckOutAction}
                disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
                className="font-semibold min-w-[120px]"
              >
                {actionLoading ? "Processing..." : "Check out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/app/attendance"
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">My Attendance Logs</div>
                  <div className="text-xs text-muted-foreground">Monthly calendar & punch history</div>
                </div>
              </div>
            </a>

            <a
              href="/app/holidays"
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Holiday Calendar</div>
                  <div className="text-xs text-muted-foreground">Company public holidays & leaves</div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>

      <BirthdayPopup
        open={birthdayModalOpen}
        onOpenChange={(open) => {
          if (!open) closeBirthdayModal();
          else setBirthdayModalOpen(true);
        }}
        birthdaysToday={todayBirthdays}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "primary" | "success" | "muted";
}) {
  const toneCls = {
    default: "bg-card",
    primary: "bg-primary-soft",
    success: "bg-[color:var(--success)]/10",
    muted: "bg-muted",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div
          className={`h-7 w-7 rounded-md flex items-center justify-center text-accent-foreground ${toneCls}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl font-semibold mt-2 tracking-tight">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "Pending", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
    approved: { label: "Approved", cls: "bg-success/15 text-success border-success/30" },
    rejected: {
      label: "Rejected",
      cls: "bg-destructive/15 text-destructive border-destructive/30",
    },
  } as const;
  const { label, cls } = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${cls}`}>
      {label}
    </Badge>
  );
}
