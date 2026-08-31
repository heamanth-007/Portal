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

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Button>

      <Card className="mb-6">
        <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr] items-center">
          <div className="flex items-center justify-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary-soft text-accent-foreground text-2xl font-semibold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{employee.name || "Employee"}</h1>
              {getStatusBadge(employee.status)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{employee.designation || "Employee"}</p>
              {employee.department && (
                <Badge className="bg-slate-100 text-slate-800 uppercase">
                  {employee.department}
                </Badge>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-muted-foreground">Employee ID</div>
              <div className="text-sm font-medium">
                {employee.employeeId || employee._id || "—"}
              </div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="text-sm font-medium">{employee.role || "EMPLOYEE"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{employee.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{employee.phone || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{employee.designation || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{employee.department || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDate(employee.joiningDate || employee.joinedDate)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {isOwnProfile && !isEditing && (
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
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">
                    {formatDate(employee.dob || employee.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium uppercase">{employee.status || "ACTIVE"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{employee.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{employee.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium capitalize">{employee.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-sm font-medium">{employee.bloodGroup || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{employee.address || "—"}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">
                    {formatDate(employee.dob || employee.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium uppercase">{employee.status || "ACTIVE"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{employee.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{employee.email || "—"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
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
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isOwnProfile && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" /> Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Reporting Manager</p>
                      <p className="text-sm font-medium">{employee.manager || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
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
                          <span className="text-sm text-muted-foreground">No skills added</span>
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-blue-600" /> Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Name</p>
                      <p className="text-sm font-medium">{employee.emergencyContactName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Phone</p>
                      <p className="text-sm font-medium">{employee.emergencyContactPhone || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
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
              <Card className="lg:col-span-2">
                <CardContent className="pt-6 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
