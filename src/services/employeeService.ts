import axios from "axios";
import * as api from "../lib/api";

export interface EmployeeData {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  designation?: string;
  department?: string;
  role: string;
  dob?: string;
  joiningDate?: string;
  status: string;
  manager?: string;
  skills?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5008";

const getAxiosInstance = () => {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("gemshine.token")}`,
    },
  });
};

export const createEmployee = async (data: EmployeeData) => {
  try {
    const response = await getAxiosInstance().post("/api/admin/employees", data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const msg = error.response.data.errors.map((e: any) => e.msg).join(", ");
      throw new Error(`${error.response.data.message || "Validation failed"}: ${msg}`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to create employee");
  }
};

export const updateEmployee = async (id: string, data: Partial<EmployeeData>) => {
  try {
    const response = await getAxiosInstance().put(`/api/admin/employees/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const msg = error.response.data.errors.map((e: any) => e.msg).join(", ");
      throw new Error(`${error.response.data.message || "Validation failed"}: ${msg}`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to update employee");
  }
};

export const fetchEmployeeById = async (id: string) => {
  try {
    const response = await getAxiosInstance().get(`/api/admin/employees/${id}`);
    const payload = response.data;
    return payload.data?.employee || payload.employee || payload.data || payload;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch employee profile",
    );
  }
};
export const updateMyProfile = async (data: Partial<EmployeeData>) => {
  try {
    const response = await getAxiosInstance().put("/api/employees/profile/update", data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Failed to update profile");
  }
};
export const fetchProfile = fetchEmployeeById;

export const changePassword = async (data: any) => {
  try {
    const response = await getAxiosInstance().put("/api/employees/change-password", data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const msg = error.response.data.errors.map((e: any) => e.msg).join(", ");
      throw new Error(`${error.response.data.message || "Validation failed"}: ${msg}`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to change password");
  }
};

export const adminResetPassword = async (id: string, data: any) => {
  try {
    const response = await getAxiosInstance().put(`/api/admin/employees/${id}/reset-password`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const msg = error.response.data.errors.map((e: any) => e.msg).join(", ");
      throw new Error(`${error.response.data.message || "Validation failed"}: ${msg}`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to reset password");
  }
};
