import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Home,
  User as UserIcon,
  MessageSquare,
  Users,
  CheckSquare,
  LogOut,
  Building2,
  Menu,
  Settings,
  Download,
  Share,
  Bell,
  Trash2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const employeeNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/attendance", label: "Attendance", icon: Clock },
  { to: "/app/leave", label: "Leave", icon: CalendarDays },
  { to: "/app/holidays", label: "Holidays", icon: CalendarDays },
  { to: "/app/wfh", label: "Work from Home", icon: Home },
  { to: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/app/chat", label: "Team Chat", icon: MessageSquare },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
];

const adminNav = [
  { to: "/app/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/app/admin/employees", label: "Employees", icon: Users },
  { to: "/app/admin/attendance", label: "Attendance", icon: Clock },
  { to: "/app/admin/holidays", label: "Holidays", icon: CalendarDays },
  { to: "/app/admin/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/app/admin/task-management", label: "Task Management", icon: CheckSquare },
  { to: "/app/admin/settings", label: "Settings", icon: Settings },
  { to: "/app/chat", label: "Team Chat", icon: MessageSquare },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, state, markNotificationsAsRead, deleteNotification } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadNotificationsCount = state.notifications?.filter((n) => !n.isRead).length || 0;
  const nav = currentUser?.role === "admin" ? adminNav : employeeNav;

  const { isInstallable, installApp } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsSafari(/^((?!chrome|android).)*safari/i.test(userAgent));
  }, []);

  const unreadMessagesCount = state.messages.filter(
    (m) => currentUser && !m.readBy?.includes(currentUser.id),
  ).length;

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-700/20 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Gemshine
            </span>
            <span className="text-[11px] text-muted-foreground">Infotech Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to ||
              (item.to !== "/app/admin" &&
                item.to !== "/app/dashboard" &&
                location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-100 dark:text-blue-800"
                    : "text-sidebar-foreground/80 hover:bg-blue-50/60 hover:text-blue-700 dark:hover:bg-blue-100/40",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-blue-600" />
                )}
                <div className="relative flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                  {item.to === "/app/chat" && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isInstallable && (
          <div className="mx-3 mb-4 p-3 bg-blue-50/60 rounded-lg border border-blue-100/80 dark:bg-blue-950/20 dark:border-blue-900/30">
            <div className="flex gap-2">
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Portal Desktop App
                </div>
                <p className="text-[10px] text-blue-700/85 dark:text-blue-300/85 mt-0.5 leading-normal">
                  Install for full standalone experience.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={installApp}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 font-medium"
            >
              Install
            </Button>
          </div>
        )}

        {isIOS && isSafari && !window.matchMedia("(display-mode: standalone)").matches && (
          <div className="mx-3 mb-4 p-3 bg-amber-50/60 rounded-lg border border-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/30">
            <div className="flex gap-2">
              <Share className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Install App
                </div>
                <p className="text-[10px] text-amber-700/85 dark:text-amber-300/85 mt-0.5 leading-normal">
                  Tap Share, then "Add to Home Screen".
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} />}
              <AvatarFallback className="text-xs bg-primary-soft text-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{currentUser?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {currentUser?.role}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 relative text-sidebar-foreground/80 hover:text-blue-700 dark:hover:text-blue-400"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-700/20 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">Gemshine</span>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    const active =
                      location.pathname === item.to ||
                      (item.to !== "/app/admin" &&
                        item.to !== "/app/dashboard" &&
                        location.pathname.startsWith(item.to));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                          active
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-100 dark:text-blue-800"
                            : "text-foreground/80 hover:bg-blue-50/60 hover:text-blue-700 dark:hover:bg-blue-100/40",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-blue-600" />
                        )}
                        <div className="relative flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                          {item.to === "/app/chat" && unreadMessagesCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {isInstallable && (
                  <div className="mx-3 mb-4 p-3 bg-blue-50/60 rounded-lg border border-blue-100/80 dark:bg-blue-950/20 dark:border-blue-900/30">
                    <div className="flex gap-2">
                      <Download className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                          Portal App
                        </div>
                        <p className="text-[10px] text-blue-700/85 dark:text-blue-300/85 mt-0.5 leading-normal">
                          Install for a faster, native experience.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        installApp();
                      }}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 font-medium"
                    >
                      Install
                    </Button>
                  </div>
                )}

                {isIOS && isSafari && !window.matchMedia("(display-mode: standalone)").matches && (
                  <div className="mx-3 mb-4 p-3 bg-amber-50/60 rounded-lg border border-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/30">
                    <div className="flex gap-2">
                      <Share className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          Install App
                        </div>
                        <p className="text-[10px] text-amber-700/85 dark:text-amber-300/85 mt-0.5 leading-normal">
                          Tap Share, then "Add to Home Screen".
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-border p-3">
                  <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
                    <Avatar className="h-8 w-8">
                      {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} />}
                      <AvatarFallback className="text-xs bg-primary-soft text-accent-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{currentUser?.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {currentUser?.role}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center ml-2">
              <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Gemshine</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 relative mr-1"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" /> Notifications
                {unreadNotificationsCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">
                    {unreadNotificationsCount} new
                  </Badge>
                )}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              List of your task notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 divide-y divide-border/60">
            {!state.notifications || state.notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                No notifications yet.
              </div>
            ) : (
              state.notifications.map((n) => {
                const isOverdue = n.type === "TASK_OVERDUE";
                return (
                  <div
                    key={n.id}
                    className={`py-3 px-1 flex items-start gap-3 transition-colors ${
                      !n.isRead ? "bg-blue-50/20" : ""
                    }`}
                  >
                    <div className="mt-0.5">
                      {isOverdue ? (
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <ClipboardList className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      >
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} at{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteNotification(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border flex sm:justify-between items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700"
              disabled={unreadNotificationsCount === 0}
              onClick={async () => {
                await markNotificationsAsRead();
                toast.success("All marked as read");
              }}
            >
              Mark all as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotificationsOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
