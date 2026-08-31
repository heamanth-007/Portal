import { useState } from "react";
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
import { createEmployee } from "../services/employeeService";
import { useStore } from "@/lib/store";

export function AddEmployeeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addUser } = useStore();
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
    phone: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
    joiningDate: new Date().toISOString().slice(0, 10),
    dob: "",
  });

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.name || !form.email || !form.password || !form.department) {
      toast.error("Employee ID, Name, Email, Password and Department are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      // Call addUser which hits the API and updates state
      await addUser({
        ...form,
        role: form.role.toUpperCase() as any,
        leaveBalance: 14,
        shiftTiming: "09:00 - 18:00",
        dateOfBirth: form.dob,
        joinedDate: form.joiningDate,
      } as any);

      setForm({
        employeeId: "",
        name: "",
        email: "",
        password: "",
        department: "",
        designation: "",
        phone: "",
        role: "EMPLOYEE",
        status: "ACTIVE",
        joiningDate: new Date().toISOString().slice(0, 10),
        dob: "",
      });
      onOpenChange(false);
      toast.success("Employee created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New employee</DialogTitle>
          <DialogDescription className="sr-only">
            Form to add a new employee to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Employee ID *</Label>
              <Input
                placeholder="e.g. EMP001"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
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
              <Label>Initial password *</Label>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <Button type="submit">Create employee</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
