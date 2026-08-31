import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { updateMyProfile, changePassword } from "@/services/employeeService";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  IdCard,
  MapPin,
  HeartPulse,
  Cake,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { currentUser, updateUser } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");
  const isEmployee = currentUser?.role === "employee";

  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    department: currentUser?.department ?? "",
    phone: currentUser?.phone ?? "",
    employeeId: currentUser?.employeeId ?? "",
    designation: currentUser?.designation ?? "",
    manager: currentUser?.manager ?? "",
    joinedDate: currentUser?.joinedDate ?? "",
    dateOfBirth: currentUser?.dateOfBirth ?? "",
    gender: currentUser?.gender ?? ("" as "" | "male" | "female" | "other"),
    bloodGroup: currentUser?.bloodGroup ?? "",
    address: currentUser?.address ?? "",
    emergencyContactName: currentUser?.emergencyContactName ?? "",
    emergencyContactPhone: currentUser?.emergencyContactPhone ?? "",
    role: currentUser?.role ?? "employee",
    status: currentUser?.status ?? "active",
  });
  const [skills, setSkills] = useState<string[]>(currentUser?.skills ?? []);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!currentUser) return <Navigate to="/login" />;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateUser(currentUser.id, { avatarUrl: reader.result as string });
      toast.success("Photo updated");
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEmployee) {
        const patch = {
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          manager: form.manager,
          skills: skills,
          avatarUrl: currentUser.avatarUrl,
          gender: form.gender === "" ? undefined : form.gender,
          bloodGroup: form.bloodGroup,
          address: form.address,
        };
        await updateMyProfile(patch);
        updateUser(currentUser.id, patch);
      } else {
        updateUser(currentUser.id, {
          ...form,
          gender: form.gender === "" ? undefined : form.gender,
          skills,
        });
      }

      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const onPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) {
      setSkillInput("");
      return;
    }
    setSkills([...skills, s]);
    setSkillInput("");
  };

  return (
    <TooltipProvider>
      <div className="p-6 sm:p-8 max-w-5xl">
        <PageHeader title="Profile" description="Your personal and employment details." />

        {/* Hero card */}
        <Card className="mb-6 overflow-hidden border-blue-200/70">
          <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-10">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-md">
                  {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} />}
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-background shadow-sm transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
                />
              </div>
              <div className="flex-1 sm:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{currentUser.name}</h2>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 capitalize">
                    {currentUser.role}
                  </Badge>
                  {currentUser.employeeId && (
                    <Badge variant="outline" className="text-blue-700 border-blue-200">
                      {currentUser.employeeId}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentUser.designation || "—"} · {currentUser.department}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    {currentUser.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    {currentUser.phone || "—"}
                  </span>
                  {currentUser.joinedDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                      Joined {currentUser.joinedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <QuickStat
                icon={<Briefcase className="h-4 w-4" />}
                label="Designation"
                value={currentUser.designation || "—"}
              />
              <QuickStat
                icon={<Building2 className="h-4 w-4" />}
                label="Department"
                value={currentUser.department || "—"}
              />
              <QuickStat
                icon={<IdCard className="h-4 w-4" />}
                label="Manager"
                value={currentUser.manager || "—"}
              />
              <QuickStat
                icon={<HeartPulse className="h-4 w-4" />}
                label="Blood group"
                value={currentUser.bloodGroup || "—"}
              />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={onSave} className="space-y-6">
          {/* Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cake className="h-4 w-4 text-blue-600" /> Personal information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Date of birth">
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={form.gender || undefined}
                    onValueChange={(v) =>
                      setForm({ ...form, gender: v as "male" | "female" | "other" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Blood group">
                  <Input
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    placeholder="e.g. O+"
                  />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street, city, state, postal code"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Employment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" /> Employment
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1 text-muted-foreground transition hover:bg-slate-50"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-sm text-white shadow-lg">
                      <p>Only Admin can modify employment details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Employment details can only be fully updated by Admin. Employees may update their
                reporting manager.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID">
                  <Input
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Designation">
                  <Input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Reporting manager">
                  <Input
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                  />
                </Field>
                <Field label="Joined date">
                  <Input
                    type="date"
                    value={form.joinedDate}
                    onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
                    disabled={isEmployee}
                  />
                </Field>
                <Field label="Role">
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as "admin" | "employee" })}
                    disabled={isEmployee}
                  >
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
                    disabled={isEmployee}
                  >
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Skills */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Skills</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Add a skill and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.length === 0 && (
                    <span className="text-xs text-muted-foreground">No skills added yet.</span>
                  )}
                  {skills.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-600" /> Emergency contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact name">
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  />
                </Field>
                <Field label="Contact phone">
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save changes
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" /> Change password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onPasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Current password">
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="New password">
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Confirm new password" className="sm:col-span-2">
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="outline" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Hidden anchor for unused icon */}
        <span className="hidden">
          <MapPin />
        </span>
      </div>
    </TooltipProvider>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
      <div className="flex items-center gap-2 text-blue-700">
        {icon}
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium text-foreground truncate">{value}</div>
    </div>
  );
}
