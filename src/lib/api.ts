import type {
  User,
  AttendanceRecord,
  LeaveRequest,
  Holiday,
  HolidayType,
  Role,
  ChatMessage,
} from "./mock-data";

type ApiResource = Record<string, unknown>;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "gemshine.token";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.headers) {
    const extraHeaders = new Headers(options.headers as HeadersInit);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : {};

  if (!response.ok) {
    let errMsg =
      ((data as Record<string, unknown>)?.message as string | undefined) ||
      `Request failed: ${response.status}`;
    const dataRecord = data as Record<string, unknown>;
    const errorsArray = dataRecord.errors || (dataRecord.data as any)?.errors;
    if (Array.isArray(errorsArray)) {
      const msg = errorsArray.map((e: any) => e.msg).join(", ");
      errMsg = `${errMsg}: ${msg}`;
    }
    throw new Error(errMsg);
  }

  const responseData = data as Record<string, unknown>;
  if (
    responseData &&
    typeof responseData === "object" &&
    responseData.success === true &&
    "data" in responseData
  ) {
    return responseData.data as T;
  }

  return data as T;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown, fallback?: number): number {
  return typeof value === "number" ? value : (fallback ?? 0);
}

function getEnumString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mapEmployee(employee: ApiResource): User {
  const role = getString(employee.role, "employee").toLowerCase() as Role;
  const status =
    getString(employee.status, "active").toLowerCase() === "inactive" ? "inactive" : "active";
  const joiningDate = getString(employee.joiningDate);
  const dob = getString(employee.dob);

  return {
    id: getString(employee._id),
    name: getString(employee.name),
    email: getString(employee.email),
    password: "",
    role,
    department: getString(employee.department),
    phone: getString(employee.phone),
    avatarUrl: getStringOrUndefined(employee.avatarUrl),
    leaveBalance: typeof employee.leaveBalance === "number" ? employee.leaveBalance : 14,
    status,
    shiftTiming: getString(employee.shiftTiming, "09:00 - 18:00"),
    employeeId: getString(employee.employeeId) || getString(employee._id),
    designation: getString(employee.designation),
    manager: getString(employee.manager),
    joinedDate: joiningDate ? new Date(joiningDate).toISOString().slice(0, 10) : undefined,
    dateOfBirth: dob ? new Date(dob).toISOString().slice(0, 10) : undefined,
    gender: getStringOrUndefined(employee.gender) as "male" | "female" | "other" | undefined,
    bloodGroup: getStringOrUndefined(employee.bloodGroup),
    address: getStringOrUndefined(employee.address),
    emergencyContactName: getStringOrUndefined(employee.emergencyContactName),
    emergencyContactPhone: getStringOrUndefined(employee.emergencyContactPhone),
    skills: Array.isArray(employee.skills) ? (employee.skills as string[]) : [],
  };
}

function mapAttendance(record: ApiResource): AttendanceRecord {
  const status = getString(record.status).toUpperCase();
  const employeeId = record.employeeId;
  const userId =
    typeof employeeId === "object" && employeeId !== null
      ? getString((employeeId as ApiResource)._id)
      : getString(employeeId);

  return {
    id: getString(record._id),
    userId,
    date: getString(record.date) ? new Date(getString(record.date)).toISOString().slice(0, 10) : "",
    checkIn: getStringOrUndefined(record.checkInTime) || getStringOrUndefined(record.checkIn),
    checkOut: getStringOrUndefined(record.checkOutTime) || getStringOrUndefined(record.checkOut),
    status: status === "PRESENT" ? "present" : status === "ABSENT" ? "absent" : "present",
  };
}

function mapLeave(leave: ApiResource): LeaveRequest {
  const status = getString(leave.status).toLowerCase();
  const employeeId = leave.employeeId;
  const userId =
    typeof employeeId === "object" && employeeId !== null
      ? getString((employeeId as ApiResource)._id)
      : getString(employeeId);

  return {
    id: getString(leave._id),
    userId,
    fromDate: getString(leave.fromDate)
      ? new Date(getString(leave.fromDate)).toISOString().slice(0, 10)
      : "",
    toDate: getString(leave.toDate)
      ? new Date(getString(leave.toDate)).toISOString().slice(0, 10)
      : "",
    reason: getString(leave.reason),
    status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
    createdAt: getString(leave.createdAt)
      ? new Date(getString(leave.createdAt)).toISOString()
      : new Date().toISOString(),
  };
}

function mapHoliday(holiday: ApiResource): Holiday {
  const rawType = getString(holiday.type, "GOVERNMENT").toUpperCase();
  const mappedType: HolidayType = rawType === "COMPANY" ? "Company" : "Government";

  return {
    id: getString(holiday._id),
    name: getString(holiday.name),
    date: getString(holiday.date)
      ? new Date(getString(holiday.date)).toISOString().slice(0, 10)
      : "",
    type: mappedType,
    description: getString(holiday.description),
  };
}

export function mapMessage(msg: ApiResource): ChatMessage {
  const employeeId = msg.employeeId;
  const userId =
    typeof employeeId === "object" && employeeId !== null
      ? getString((employeeId as ApiResource)._id)
      : getString(employeeId);

  return {
    id: getString(msg._id),
    userId,
    text: getString(msg.text),
    createdAt: getString(msg.createdAt) || new Date().toISOString(),
    readBy: Array.isArray(msg.readBy)
      ? msg.readBy.map((r: any) =>
          typeof r === "object" && r !== null ? getString(r._id) : getString(r),
        )
      : [],
  };
}

export async function login(email: string, password: string) {
  const response = await request<{ token: string; user: ApiResource }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(response.token);
  return mapEmployee(response.user);
}

export async function fetchProfile() {
  const response = await request<{ user: ApiResource }>("/api/auth/me");
  return mapEmployee(response.user);
}

export async function fetchEmployees() {
  const response = await request<{ employees: ApiResource[] }>("/api/employees/directory");
  return response.employees.map(mapEmployee);
}

export async function createEmployee(data: ApiResource) {
  const response = await request<{ id: string }>("/api/admin/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

export async function deleteEmployee(id: string) {
  return request(`/api/admin/employees/${id}`, { method: "DELETE" });
}

export async function updateEmployee(id: string, data: ApiResource) {
  return request(`/api/admin/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function markAttendance(data: ApiResource) {
  return request("/api/attendance/mark", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchMyAttendance(month: string, year: string) {
  const response = await request<{ records: ApiResource[] }>(
    `/api/attendance/monthly?month=${month}&year=${year}`,
  );
  return { records: response.records.map(mapAttendance) };
}

export async function fetchTodayAttendance() {
  const response = await request<{ records: ApiResource[] }>("/api/admin/attendance/today");
  return { records: response.records.map(mapAttendance) };
}

export async function fetchMonthlyAttendance(month: string, year: string) {
  const response = await request<{ records: ApiResource[] }>(
    `/api/admin/attendance/monthly?month=${month}&year=${year}`,
  );
  return { records: response.records.map(mapAttendance) };
}

export async function fetchHolidays() {
  const response = await request<{ holidays: ApiResource[] }>("/api/holidays");
  return { holidays: response.holidays.map(mapHoliday) };
}

export async function createHoliday(data: ApiResource) {
  return request<{ id: string }>("/api/admin/holidays", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHoliday(id: string, data: ApiResource) {
  return request(`/api/admin/holidays/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHoliday(id: string) {
  return request(`/api/admin/holidays/${id}`, { method: "DELETE" });
}

export async function applyLeave(data: ApiResource) {
  return request<{ id: string }>("/api/leave/apply", {
    method: "POST",
    body: JSON.stringify({ ...data, leaveType: data.leaveType || "CASUAL" }),
  });
}

export async function fetchMyLeaves() {
  const response = await request<{ leaves: ApiResource[] }>("/api/leave/my-leaves");
  return { leaves: response.leaves.map(mapLeave) };
}

export async function fetchPendingLeaves() {
  const response = await request<{ leaves: ApiResource[] }>("/api/admin/leave/pending");
  return { leaves: response.leaves.map(mapLeave) };
}

export async function approveLeave(id: string) {
  return request(`/api/admin/leave/approve/${id}`, { method: "PUT" });
}

export async function rejectLeave(id: string) {
  return request(`/api/admin/leave/reject/${id}`, { method: "PUT" });
}

export async function fetchUpcomingBirthdays(days = 30) {
  const response = await request<{ employees: ApiResource[] }>(
    `/api/employees/upcoming-birthdays?days=${days}`,
  );
  return { employees: response.employees.map(mapEmployee) };
}

export async function logout() {
  setToken(null);
}

export async function getTokenValue() {
  return getToken();
}

export async function fetchMessages() {
  const response = await request<{ messages: ApiResource[] }>("/api/chat");
  return response.messages.map(mapMessage);
}

export async function createMessage(text: string) {
  const response = await request<{ message: ApiResource }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return mapMessage(response.message);
}

export async function markChatMessagesAsRead() {
  return request("/api/chat/read", { method: "PUT" });
}
