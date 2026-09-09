const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5008";
const TOKEN_KEY = "gemshine.token";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  if (data && typeof data === "object" && data.success === true && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

export interface EmployeeDetails {
  _id: string;
  name: string;
  designation?: string;
}

export interface ApprovalRequest {
  _id: string;
  employeeId: EmployeeDetails;
  requestType: "LEAVE";
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedDate: string;
  approvedDate?: string;
  approvedBy?: EmployeeDetails;
}

export const fetchPendingApprovals = async () => {
  const response = await request<{ records: ApprovalRequest[] }>("/api/admin/approvals/pending");
  return response.records;
};

export const fetchApprovedRequests = async () => {
  const response = await request<{ records: ApprovalRequest[] }>("/api/admin/approvals/approved");
  return response.records;
};

export const approveRequest = async (id: string) => {
  return request(`/api/admin/approvals/approve/${id}`, { method: "PUT" });
};

export const rejectRequest = async (id: string) => {
  return request(`/api/admin/approvals/reject/${id}`, { method: "PUT" });
};
