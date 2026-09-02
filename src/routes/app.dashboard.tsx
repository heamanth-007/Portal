import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { BirthdayPanel } from "@/components/birthday-panel";
import { BirthdayPopup } from "@/components/birthday-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { getUpcomingBirthdays, isBirthdayToday } from "@/lib/birthday";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dashboard")({
  component: EmployeeDashboard,
});

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EmployeeDashboard() {
  const { currentUser, state, checkIn, checkOut } = useStore();
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);

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
  const myLeaves = state.leaves.filter((l) => l.userId === currentUser.id);

  const status = todayAttendance
    ? todayAttendance.checkOut
      ? "Completed"
      : "Checked in"
    : "Not marked";

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
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
          value={formatTime(todayAttendance?.checkIn)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Leave balance"
          value={`${currentUser.leaveBalance} days`}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <BirthdayPanel title="Upcoming Birthdays" employees={upcomingBirthdays} highlightToday />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today's attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <div className="text-xs text-muted-foreground">Check in</div>
                <div className="text-xl font-semibold mt-1">
                  {formatTime(todayAttendance?.checkIn)}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-xs text-muted-foreground">Check out</div>
                <div className="text-xl font-semibold mt-1">
                  {formatTime(todayAttendance?.checkOut)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await checkIn(currentUser.id);
                  toast.success("Checked in");
                }}
                disabled={!!todayAttendance}
              >
                Check in
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await checkOut(currentUser.id);
                  toast.success("Checked out");
                }}
                disabled={!todayAttendance || !!todayAttendance.checkOut}
              >
                Check out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent leave requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myLeaves.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Leave · {l.fromDate}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.reason}</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
            {myLeaves.length === 0 && (
              <div className="text-sm text-muted-foreground">No leave requests yet.</div>
            )}
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
