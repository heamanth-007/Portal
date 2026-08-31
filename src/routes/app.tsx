import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
