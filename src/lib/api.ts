import type {
  User,
  AttendanceRecord,
  LeaveRequest,
  WfhRequest,
  Holiday,
  HolidayType,
  Role,
  ChatMessage,
  Task,
  NotificationItem,
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

function mapWfh(wfh: ApiResource): WfhRequest {
  const status = getString(wfh.status).toLowerCase();
  const employeeId = wfh.employeeId;
  const userId =
    typeof employeeId === "object" && employeeId !== null
      ? getString((employeeId as ApiResource)._id)
      : getString(employeeId);

  return {
    id: getString(wfh._id),
    userId,
    date: getString(wfh.date) ? new Date(getString(wfh.date)).toISOString().slice(0, 10) : "",
    reason: getString(wfh.reason),
    status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
    createdAt: getString(wfh.createdAt)
      ? new Date(getString(wfh.createdAt)).toISOString()
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

export async function applyWfh(data: ApiResource) {
  return request<{ id: string }>("/api/wfh/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchMyWfh() {
  const response = await request<{ wfh: ApiResource[] }>("/api/wfh/my-wfh");
  return { wfh: response.wfh.map(mapWfh) };
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

export async function fetchPendingWfh() {
  const response = await request<{ wfh: ApiResource[] }>("/api/admin/wfh/pending");
  return { wfh: response.wfh.map(mapWfh) };
}

export async function approveWfh(id: string) {
  return request(`/api/admin/wfh/approve/${id}`, { method: "PUT" });
}

export async function rejectWfh(id: string) {
  return request(`/api/admin/wfh/reject/${id}`, { method: "PUT" });
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

export async function fetchWfhToday() {
  const response = await request<{ records: ApiResource[] }>("/api/admin/dashboard/wfh-today");
  return {
    records: response.records.map((r: ApiResource) => {
      const employee = r.employeeId as ApiResource | undefined;
      return {
        employeeId:
          getString(employee?._id) || getString(employee?.employeeId) || getString(r.employeeId),
        name: getString(employee?.name),
        designation: getString(employee?.designation),
        status: getString(r.status),
        checkInTime: getString(r.checkInTime),
      };
    }),
  };
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

function mapTask(task: ApiResource): Task {
  const assignedTo = task.assignedTo;
  const assignedToId =
    typeof assignedTo === "object" && assignedTo !== null
      ? getString((assignedTo as ApiResource)._id)
      : getString(assignedTo);
  const assignedToName =
    typeof assignedTo === "object" && assignedTo !== null
      ? getString((assignedTo as ApiResource).name)
      : "";

  const assignedBy = task.assignedBy;
  const assignedById =
    typeof assignedBy === "object" && assignedBy !== null
      ? getString((assignedBy as ApiResource)._id)
      : getString(assignedBy);
  const assignedByName =
    typeof assignedBy === "object" && assignedBy !== null
      ? getString((assignedBy as ApiResource).name)
      : "";

  return {
    id: getString(task._id),
    title: getString(task.title),
    description: getString(task.description),
    priority: getString(task.priority, "Medium") as "Low" | "Medium" | "High",
    assignedTo: assignedToId,
    assignedToName,
    assignedBy: assignedById,
    assignedByName,
    assignedDate: getString(task.assignedDate)
      ? new Date(getString(task.assignedDate)).toISOString()
      : new Date().toISOString(),
    dueDate: getString(task.dueDate)
      ? new Date(getString(task.dueDate)).toISOString().slice(0, 10)
      : "",
    status: getString(task.status, "Pending") as "Pending" | "Completed",
    completedDate: getString(task.completedDate)
      ? new Date(getString(task.completedDate)).toISOString()
      : undefined,
  };
}

export async function fetchAdminTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/admin");
  return response.tasks.map(mapTask);
}

export async function fetchAdminPendingTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/admin/pending");
  return response.tasks.map(mapTask);
}

export async function fetchAdminCompletedTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/admin/completed");
  return response.tasks.map(mapTask);
}

export async function createTask(data: ApiResource) {
  const response = await request<{ task: ApiResource }>("/api/tasks/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return mapTask(response.task);
}

export async function updateTask(id: string, data: ApiResource) {
  const response = await request<{ task: ApiResource }>(`/api/tasks/${id}/update`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return mapTask(response.task);
}

export async function deleteTask(id: string) {
  return request(`/api/tasks/${id}`, { method: "DELETE" });
}

export async function fetchMyTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/my-tasks");
  return response.tasks.map(mapTask);
}

export async function fetchMyPendingTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/my-pending");
  return response.tasks.map(mapTask);
}

export async function fetchMyCompletedTasks() {
  const response = await request<{ tasks: ApiResource[] }>("/api/tasks/my-completed");
  return response.tasks.map(mapTask);
}

export async function completeTask(id: string) {
  const response = await request<{ task: ApiResource }>(`/api/tasks/${id}/complete`, {
    method: "PUT",
  });
  return mapTask(response.task);
}

function mapNotification(notif: ApiResource): NotificationItem {
  return {
    id: getString(notif._id),
    recipient: getString(notif.recipient),
    message: getString(notif.message),
    type: getString(notif.type) as "TASK_ASSIGNED" | "TASK_OVERDUE" | "TASK_COMPLETED",
    isRead: typeof notif.isRead === "boolean" ? notif.isRead : false,
    relatedId: getStringOrUndefined(notif.relatedId),
    createdAt: getString(notif.createdAt) || new Date().toISOString(),
  };
}

export async function fetchNotifications() {
  const response = await request<{ notifications: ApiResource[] }>("/api/notifications");
  return response.notifications.map(mapNotification);
}

export async function markNotificationsAsRead() {
  return request("/api/notifications/read-all", { method: "PUT" });
}

export async function deleteNotification(id: string) {
  return request(`/api/notifications/${id}`, { method: "DELETE" });
}
