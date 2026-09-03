import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  ShieldAlert,
  Zap,
  Cake,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateMyProfile } from "@/services/employeeService";

interface EmployeeProfileProps {
  employee: any;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  currentUser?: any;
  onUpdate?: (data: any) => void;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusBadge = (status?: string) => {
  if (status?.toUpperCase() === "ACTIVE") {
    return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
  }
  if (status?.toUpperCase() === "INACTIVE") {
    return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-800">Unknown</Badge>;
};

const getInitials = (name?: string) => {
  if (!name) return "EM";
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function EmployeeProfile({
  employee,
  loading,
  error,
  onBack,
  currentUser,
  onUpdate,
}: EmployeeProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const isOwnProfile = currentUser && currentUser.id === employee?.id;

  const [editForm, setEditForm] = useState({
    manager: employee?.manager || "",
    skills: employee?.skills || [],
    emergencyContactName: employee?.emergencyContactName || "",
    emergencyContactPhone: employee?.emergencyContactPhone || "",
    bloodGroup: employee?.bloodGroup || "",
    gender: employee?.gender || "",
    address: employee?.address || "",
  });

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl">
        <div className="flex items-center justify-center h-64 rounded-2xl border border-border bg-card">
          <div className="text-sm text-muted-foreground">Loading employee profile…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl">
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Button>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Unable to load profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl">
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Button>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Employee not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested employee profile is unavailable.
          </p>
        </div>
      </div>
    );
  }

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (editForm.skills.includes(s)) {
      setSkillInput("");
      return;
    }
    setEditForm({ ...editForm, skills: [...editForm.skills, s] });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((s: string) => s !== skill),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const patch = {
        manager: editForm.manager,
        skills: editForm.skills,
        emergencyContactName: editForm.emergencyContactName,
        emergencyContactPhone: editForm.emergencyContactPhone,
        bloodGroup: editForm.bloodGroup,
        gender: editForm.gender,
        address: editForm.address,
      } as any;
      await updateMyProfile(patch);
      if (onUpdate) {
        onUpdate(patch);
      }
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isOwnProfile || isAdmin;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <Button variant="outline" size="sm" onClick={onBack} className="gap-2 shadow-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Button>

      {/* Hero Card */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-muted shadow-sm">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {employee.name || "Employee"}
                </h1>
                {getStatusBadge(employee.status)}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{employee.designation || "Employee"}</span>
                {employee.department && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 uppercase text-xs font-semibold">
                      {employee.department}
                    </Badge>
                  </>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border mt-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Employee ID</div>
                  <div className="text-sm font-semibold font-mono text-foreground mt-0.5">
                    {employee.employeeId || employee._id || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">System Role</div>
                  <div className="text-sm font-semibold uppercase text-foreground mt-0.5">
                    {employee.role || "EMPLOYEE"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Phone Number</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    {employee.phone || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Email Address</div>
                  <div className="text-sm font-semibold text-foreground truncate mt-0.5">
                    {employee.email || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" /> Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Work Email</span>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{employee.email || "—"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Contact Phone</span>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{employee.phone || "—"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Residential Address</span>
              <div className="text-sm font-medium text-foreground">
                {employee.address || "—"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" /> Company & Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Designation</span>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{employee.designation || "—"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Department</span>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{employee.department || "—"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Joining Date</span>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{formatDate(employee.joiningDate || employee.joinedDate)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Reporting Manager</span>
                <div className="text-sm font-medium text-foreground">
                  {employee.manager || "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="shadow-sm border-border md:col-span-2">
          <CardHeader className="bg-muted/30 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="h-4 w-4 text-blue-600" /> Personal Information
            </CardTitle>
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditForm({
                    manager: employee?.manager || "",
                    skills: employee?.skills || [],
                    emergencyContactName: employee?.emergencyContactName || "",
                    emergencyContactPhone: employee?.emergencyContactPhone || "",
                    bloodGroup: employee?.bloodGroup || "",
                    gender: employee?.gender || "",
                    address: employee?.address || "",
                  });
                  setIsEditing(true);
                }}
              >
                Edit Details
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {!isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Date of Birth</span>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(employee.dob || employee.dateOfBirth)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Gender</span>
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {employee.gender || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Blood Group</span>
                  <p className="text-sm font-semibold text-foreground">
                    {employee.bloodGroup || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Account Status</span>
                  <p className="text-sm font-semibold uppercase text-foreground">
                    {employee.status || "ACTIVE"}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-4 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Full Address</span>
                  <p className="text-sm font-medium text-foreground">{employee.address || "—"}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Input
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    placeholder="e.g. O+"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Street, city, state, postal code"
                    rows={2}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work & Skills */}
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" /> Work & Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!isEditing ? (
              <>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Reporting Manager</span>
                  <p className="text-sm font-medium text-foreground">{employee.manager || "—"}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Skills & Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.skills && employee.skills.length > 0 ? (
                      employee.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No skills added yet</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reporting Manager</Label>
                  <Input
                    value={editForm.manager}
                    onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                    placeholder="Enter reporting manager name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills</Label>
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
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {editForm.skills.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No skills added yet.
                      </span>
                    ) : (
                      editForm.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ✕
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-600" /> Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Contact Person</span>
                  <p className="text-sm font-semibold text-foreground">
                    {employee.emergencyContactName || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Contact Phone</span>
                  <p className="text-sm font-semibold text-foreground">
                    {employee.emergencyContactPhone || "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={editForm.emergencyContactName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emergencyContactName: e.target.value })
                    }
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={editForm.emergencyContactPhone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emergencyContactPhone: e.target.value })
                    }
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="md:col-span-2 flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
