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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold">Edit Employee Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update personal, contact, and employment information for {employee?.name || "the employee"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onEdit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="font-semibold text-xs">Employee ID (Read Only)</Label>
              <Input value={employee?.employeeId || ""} disabled className="bg-muted font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Email Address *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Department *</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Designation</Label>
              <Input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Role</Label>
              <select
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Status</Label>
              <select
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Date of Birth</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Joining Date</Label>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
