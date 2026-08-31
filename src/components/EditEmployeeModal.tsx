import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateEmployee } from "../services/employeeService";
import { useStore } from "@/lib/store";

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}) {
  const { updateUser } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    phone: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
    joiningDate: "",
    dob: "",
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        department: employee.department || "",
        designation: employee.designation || "",
        phone: employee.phone || "",
        role: employee.role?.toUpperCase() || "EMPLOYEE",
        status: employee.status?.toUpperCase() || "ACTIVE",
        joiningDate: employee.joinedDate || employee.joiningDate || "",
        dob: employee.dateOfBirth || employee.dob || "",
      });
    }
  }, [employee]);

  const onEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department) {
      toast.error("Name, email and department are required");
      return;
    }

    try {
      // Update store which hits API and updates local state
      await updateUser(employee.id, {
        ...form,
        role: form.role.toLowerCase() as any,
        status: form.status.toLowerCase() as any,
        dateOfBirth: form.dob,
        joinedDate: form.joiningDate,
      });

      onOpenChange(false);
      toast.success("Employee updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription className="sr-only">
            Form to edit an existing employee's details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onEdit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Employee ID (Read Only)</Label>
              <Input value={employee?.employeeId || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
