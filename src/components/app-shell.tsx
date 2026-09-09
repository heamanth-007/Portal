import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  User as UserIcon,
  Users,
  LogOut,
  Menu,
  Settings,
  Download,
  Share,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const employeeNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/attendance", label: "Attendance", icon: Clock },
  { to: "/app/holidays", label: "Holidays", icon: CalendarDays },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
];

const adminNav = [
  { to: "/app/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/app/admin/employees", label: "Employees", icon: Users },
  { to: "/app/admin/attendance", label: "Attendance", icon: Clock },
  { to: "/app/admin/holidays", label: "Holidays", icon: CalendarDays },
  { to: "/app/admin/settings", label: "Settings", icon: Settings },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, state } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nav = currentUser?.role === "admin" ? adminNav : employeeNav;

  const { isInstallable, installApp } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsSafari(/^((?!chrome|android).)*safari/i.test(userAgent));
  }, []);

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center px-4 h-16 border-b border-sidebar-border">
          <CompanyLogo size="sm" showText={true} />
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
                <div className="flex items-center px-4 h-14 border-b border-border">
                  <CompanyLogo size="sm" showText={true} />
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

            <CompanyLogo size="sm" showText={true} className="ml-1" />
          </div>
          <div className="flex items-center gap-1">
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
