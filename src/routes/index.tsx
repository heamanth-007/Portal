import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  return <Navigate to={currentUser.role === "admin" ? "/app/admin" : "/app/dashboard"} />;
}
