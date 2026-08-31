import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ApprovalsPage } from "@/components/approvals/ApprovalsPage";

export const Route = createFileRoute("/app/admin/approvals")({
  component: AdminApprovalsRoute,
});

function AdminApprovalsRoute() {
  const { currentUser } = useStore();

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "admin") return <Navigate to="/app/dashboard" />;

  return <ApprovalsPage />;
}
