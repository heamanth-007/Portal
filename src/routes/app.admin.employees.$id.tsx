import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

import { fetchEmployeeById } from "@/services/employeeService";
import EmployeeProfile from "@/components/EmployeeProfile";

export const Route = createFileRoute("/app/admin/employees/$id")({
  component: EmployeeProfileRoute,
});

function EmployeeProfileRoute() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { currentUser, updateUser } = useStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchEmployeeById(id);
        setEmployee(profile);
      } catch (err: any) {
        console.error("Failed to load profile", err);
        setError(err?.message || "Failed to load employee profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "admin" && currentUser.id !== id)
    return <Navigate to="/app/dashboard" />;

  const handleUpdate = (updatedData: any) => {
    setEmployee((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
    if (currentUser.id === id) {
      updateUser(currentUser.id, updatedData);
    }
  };

  return (
    <EmployeeProfile
      employee={employee}
      loading={loading}
      error={error}
      onBack={() => navigate({ to: "/app/admin/employees" })}
      currentUser={currentUser}
      onUpdate={handleUpdate}
    />
  );
}
