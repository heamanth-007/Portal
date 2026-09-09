import { createFileRoute, Navigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { BirthdayPanel } from "@/components/birthday-panel";
import { BirthdayPopup } from "@/components/birthday-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, ArrowRight } from "lucide-react";
import { getUpcomingBirthdays, isBirthdayToday } from "@/lib/birthday";
import { StatusBadge } from "./app.dashboard";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();
  // Only show AdminOverview at the exact /app/admin path
  if (location.pathname === "/app/admin") {
    return <AdminOverview />;
  }
  // For child routes like /app/admin/employees, render the outlet
  return <Outlet />;
}

function AdminOverview() {
  const { currentUser, state } = useStore();
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "admin") return <Navigate to="/app/dashboard" />;

  const today = useMemo(() => new Date(), []);
  const todayKey = `gemshine.birthday-popup-seen.${currentUser.id}`;
  const employees = state.users.filter((u) => u.role === "employee");
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(employees, 30, today),
    [employees, today],
  );
  const todayBirthdays = useMemo(
    () => employees.filter((u) => isBirthdayToday(u.dateOfBirth, today)),
    [employees, today],
  );

  useEffect(() => {
    if (todayBirthdays.length === 0) return;
    try {
      const seenDate = localStorage.getItem(todayKey);
      const todayString = today.toISOString().slice(0, 10);
      if (seenDate !== todayString) {
        setBirthdayModalOpen(true);
      }
    } catch {
      setBirthdayModalOpen(true);
    }
  }, [todayBirthdays.length, todayKey, today]);

  const closeBirthdayModal = () => {
    try {
      localStorage.setItem(todayKey, today.toISOString().slice(0, 10));
    } catch {
      // ignore
    }
    setBirthdayModalOpen(false);
  };

  const todayString = today.toISOString().slice(0, 10);
  const presentToday = state.attendance.filter((a) => a.date === todayString).length;
  const absentToday = Math.max(0, employees.length - presentToday);

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <PageHeader
        title="Admin overview"
        description="Snapshot of daily attendance, employees, and operations."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Total employees"
          value={employees.length}
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label="Present today"
          value={`${presentToday}/${employees.length}`}
          icon={<Clock className="h-4 w-4" />}
        />
        <Stat
          label="Absent today"
          value={absentToday}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <BirthdayPanel title="Upcoming Birthdays" employees={upcomingBirthdays} highlightToday />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Quick Management</CardTitle>
            <Link
              to="/app/admin/attendance"
              className="text-xs text-primary inline-flex items-center gap-1 font-medium"
            >
              Attendance Manager <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/app/admin/employees"
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Employee Directory</div>
                  <div className="text-xs text-muted-foreground">Manage employee profiles and roles</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              to="/app/admin/attendance"
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Daily Attendance Logs</div>
                  <div className="text-xs text-muted-foreground">Review punch records and geofence tracking</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              to="/app/admin/settings"
              className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Company & Geofence Settings</div>
                  <div className="text-xs text-muted-foreground">Configure office radius and shifts</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
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

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="h-7 w-7 rounded-md bg-primary-soft flex items-center justify-center text-accent-foreground">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold mt-2 tracking-tight">{value}</div>
    </div>
  );
}
