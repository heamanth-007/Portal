import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { CompanyLogo } from "@/components/company-logo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, currentUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsSafari(/^((?!chrome|android).)*safari/i.test(userAgent));
  }, []);

  useEffect(() => {
    if (currentUser) {
      navigate({ to: currentUser.role === "admin" ? "/app/admin" : "/app/dashboard" });
    }
  }, [currentUser, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const u = await login(email, password);
    setLoading(false);
    if (!u) {
      toast.error("Invalid credentials");
      return;
    }
    toast.success(`Welcome, ${u.name.split(" ")[0]}`);
    navigate({ to: u.role === "admin" ? "/app/admin" : "/app/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-9 rounded-xl bg-white p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="Mahes Bankers" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">Mahes Bankers</span>
            <span className="text-xs text-white/80 font-medium">Employee Portal</span>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            One portal for your team's day.
          </h1>
          <p className="text-sm text-white/90 leading-relaxed">
            Fast daily check-in, geofenced attendance tracking, and employee management built
            for Mahes Bankers.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {["Attendance", "Geofencing", "Employees"].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-xs font-semibold text-center"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/75">
          © {new Date().getFullYear()} Mahes Bankers. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex items-center mb-2">
            <CompanyLogo size="md" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your work credentials to access Mahes Bankers portal.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mahesbankers.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-md shadow-orange-500/20"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {isInstallable && (
            <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 space-y-3 dark:border-orange-900/30 dark:bg-orange-950/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-500/20">
                  <Download className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                    Install Portal App
                  </h4>
                  <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                    Install Mahes Bankers Portal for a faster, native app experience on your desktop or
                    mobile device.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 shadow-sm transition-all"
                onClick={installApp}
              >
                Install Now
              </Button>
            </div>
          )}

          {isIOS && isSafari && !window.matchMedia("(display-mode: standalone)").matches && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 space-y-2 dark:border-amber-900/30 dark:bg-amber-950/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-amber-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-amber-500/20">
                  <Share className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Add to Home Screen
                  </h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
                    Tap the{" "}
                    <strong className="font-semibold text-amber-900 dark:text-amber-100">
                      Share
                    </strong>{" "}
                    button in Safari's toolbar, then scroll down and tap{" "}
                    <strong className="font-semibold text-amber-900 dark:text-amber-100">
                      "Add to Home Screen"
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
