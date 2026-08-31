import { createFileRoute, Navigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { BirthdayPanel } from "@/components/birthday-panel";
import { BirthdayPopup } from "@/components/birthday-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Home, ArrowRight } from "lucide-react";
import { getUpcomingBirthdays, isBirthdayToday } from "@/lib/birthday";
import { StatusBadge } from "./app.dashboard";
import { WFHEmployeesCard } from "@/components/WFHEmployeesCard";

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
  const pendingLeaves = state.leaves.filter((l) => l.status === "pending");
  const pendingWfh = state.wfh.filter((w) => w.status === "pending");

  const userById = (id: string) => state.users.find((u) => u.id === id);

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <PageHeader
        title="Admin overview"
        description="Snapshot of attendance and pending requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          label="Pending leaves"
          value={pendingLeaves.length}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <Stat label="Pending WFH" value={pendingWfh.length} icon={<Home className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <BirthdayPanel title="Upcoming Birthdays" employees={upcomingBirthdays} highlightToday />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending leave requests</CardTitle>
            <Link
              to="/app/admin/approvals"
              className="text-xs text-primary inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingLeaves.length === 0 && (
              <div className="text-sm text-muted-foreground">No pending leave requests.</div>
            )}
            {pendingLeaves.slice(0, 5).map((l) => {
              const u = userById(l.userId);
              return (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{u?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.fromDate} → {l.toDate} · {l.reason}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending WFH requests</CardTitle>
            <Link
              to="/app/admin/approvals"
              className="text-xs text-primary inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingWfh.length === 0 && (
              <div className="text-sm text-muted-foreground">No pending WFH requests.</div>
            )}
            {pendingWfh.slice(0, 5).map((w) => {
              const u = userById(w.userId);
              return (
                <div key={w.id} className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{u?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {w.date} · {w.reason}
                    </div>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <WFHEmployeesCard />
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
