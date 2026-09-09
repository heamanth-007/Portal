import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5008";

const getAuthHeaders = () => {
  const token = localStorage.getItem("gemshine.token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const checkIn = async (locationData?: {
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceInfo?: string;
  browserDetails?: string;
}) => {
  const response = await axios.post(
    `${API_BASE}/api/attendance/checkin`,
    locationData || {},
    getAuthHeaders(),
  );
  return response.data;
};

export const checkOut = async (locationData?: {
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceInfo?: string;
  browserDetails?: string;
}) => {
  const response = await axios.post(
    `${API_BASE}/api/attendance/checkout`,
    locationData || {},
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchCompanySettings = async () => {
  const response = await axios.get(`${API_BASE}/api/company-settings`, getAuthHeaders());
  return response.data;
};

export const fetchAdminCompanySettings = async () => {
  const response = await axios.get(`${API_BASE}/api/admin/company-settings`, getAuthHeaders());
  return response.data;
};

export const updateCompanySettings = async (settings: {
  companyName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
  enforceGeofencing: boolean;
}) => {
  const response = await axios.put(
    `${API_BASE}/api/admin/company-settings`,
    settings,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchTodayAttendance = async () => {
  const response = await axios.get(`${API_BASE}/api/attendance/today`, getAuthHeaders());
  return response.data;
};

export const fetchMonthlyAttendance = async (month: string, year: string) => {
  const response = await axios.get(
    `${API_BASE}/api/attendance/monthly?month=${month}&year=${year}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAllAttendance = async () => {
  const response = await axios.get(`${API_BASE}/api/attendance/history`, getAuthHeaders());
  return response.data;
};

export const fetchMonthlySummaries = async (month: string, year: string) => {
  const response = await axios.get(
    `${API_BASE}/api/attendance/monthly-summary?month=${month}&year=${year}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAdminTodayAttendance = async () => {
  const response = await axios.get(`${API_BASE}/api/admin/attendance/today`, getAuthHeaders());
  return response.data;
};

export const fetchAdminMonthlyAttendance = async (month: string, year: string) => {
  const response = await axios.get(
    `${API_BASE}/api/admin/attendance/monthly?month=${month}&year=${year}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAdminDateAttendance = async (date: string) => {
  const response = await axios.get(
    `${API_BASE}/api/admin/attendance/date?date=${date}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAdminHistoryAttendance = async (employeeId: string) => {
  const response = await axios.get(
    `${API_BASE}/api/admin/attendance/history?employeeId=${employeeId}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAdminAllAttendance = async () => {
  const response = await axios.get(`${API_BASE}/api/admin/attendance/all`, getAuthHeaders());
  return response.data;
};

export const generateAdminMonthlySummary = async (month: string, year: string) => {
  const response = await axios.post(
    `${API_BASE}/api/admin/attendance/monthly-summary/generate`,
    { month, year },
    getAuthHeaders(),
  );
  return response.data;
};

export const fetchAdminMonthlySummaries = async (month: string, year: string) => {
  const response = await axios.get(
    `${API_BASE}/api/admin/attendance/monthly-summary?month=${month}&year=${year}`,
    getAuthHeaders(),
  );
  return response.data;
};
