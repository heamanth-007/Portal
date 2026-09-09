/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  seedUsers,
  seedAttendance,
  seedLeaves,
  seedMessages,
  seedHolidays,
  newId,
  type User,
  type AttendanceRecord,
  type LeaveRequest,
  type ChatMessage,
  type LeaveStatus,
  type Holiday,
  type Role,
} from "./mock-data";
import * as api from "./api";
import { io } from "socket.io-client";

const STORAGE_KEY = "gemshine.state.v1";
const SESSION_KEY = "gemshine.session.v1";
const TOKEN_KEY = "gemshine.token";

interface AppState {
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  messages: ChatMessage[];
  holidays: Holiday[];
}

interface StoreContextValue {
  state: AppState;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  addUser: (u: Omit<User, "id">) => Promise<User | null>;
  removeUser: (id: string) => Promise<void>;
  checkIn: (userId: string) => Promise<void>;
  checkOut: (userId: string) => Promise<void>;
  applyLeave: (data: Omit<LeaveRequest, "id" | "status" | "createdAt">) => Promise<void>;
  setLeaveStatus: (id: string, status: LeaveStatus) => Promise<void>;
  sendMessage: (userId: string, text: string) => Promise<void>;
  addHoliday: (holiday: Omit<Holiday, "id">) => Promise<void>;
  updateHoliday: (id: string, holiday: Partial<Holiday>) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  markMessagesAsRead: (userId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const initialState = (): AppState => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppState;
    } catch {
      // ignore
    }
  }
  return {
    users: seedUsers,
    attendance: seedAttendance,
    leaves: seedLeaves,
    messages: seedMessages,
    holidays: seedHolidays,
  };
};

const initialSessionUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const initialToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(initialSessionUser);
  const [token, setToken] = useState<string | null>(initialToken);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }, [token]);

  const loadRemoteState = useCallback(async () => {
    try {
      const [holidays, messages, latestProfile] = await Promise.all([
        api.fetchHolidays(),
        api.fetchMessages(),
        api.fetchProfile(),
      ]);

      setCurrentUser((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(latestProfile)) {
          return latestProfile;
        }
        return prev;
      });

      if (latestProfile.role === "admin") {
        const [employeeList, pendingLeaves, todayAttendance] = await Promise.all([
          api.fetchEmployees(),
          api.fetchPendingLeaves(),
          api.fetchTodayAttendance(),
        ]);

        setState((s) => ({
          ...s,
          users: employeeList,
          holidays: holidays.holidays,
          messages,
          leaves: pendingLeaves.leaves,
          attendance: todayAttendance.records,
        }));
      } else {
        const [employeeList, myLeaves, myAttendance] = await Promise.all([
          api.fetchEmployees(),
          api.fetchMyLeaves(),
          api.fetchMyAttendance(
            String(new Date().getMonth() + 1).padStart(2, "0"),
            String(new Date().getFullYear()),
          ),
        ]);

        setState((s) => ({
          ...s,
          users: employeeList,
          holidays: holidays.holidays,
          messages,
          leaves: myLeaves.leaves,
          attendance: myAttendance.records,
        }));
      }
    } catch (error) {
      console.error("Failed to load remote state", error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!token || !currentUser) return;
    void loadRemoteState();
  }, [token, currentUser, loadRemoteState]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5008";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
    });

    socket.on("new_message", (rawMsg: any) => {
      const msg = api.mapMessage(rawMsg);
      setState((s) => {
        if (s.messages.some((m) => m.id === msg.id)) {
          return s;
        }
        return {
          ...s,
          messages: [...s.messages, msg],
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentUser]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      currentUser,
      login: async (email, password) => {
        try {
          await api.login(email, password);
          const profile = await api.fetchProfile();
          setToken(localStorage.getItem(TOKEN_KEY));
          setCurrentUser(profile);
          await loadRemoteState();
          return profile;
        } catch (err) {
          console.error(err);
          return null;
        }
      },
      logout: () => {
        api.logout();
        setToken(null);
        setCurrentUser(null);
        setState(initialState());
      },
      updateUser: async (id, patch) => {
        try {
          const apiPatch = {
            ...patch,
            dob: patch.dateOfBirth || (patch as any).dob || undefined,
            joiningDate: patch.joinedDate || (patch as any).joiningDate || undefined,
            status: patch.status?.toUpperCase(),
            role: patch.role?.toUpperCase(),
          };
          // Remove client-specific fields
          delete apiPatch.dateOfBirth;
          delete apiPatch.joinedDate;

          if (currentUser?.role === "admin") {
            await api.updateEmployee(id, apiPatch);
          }

          setState((s) => ({
            ...s,
            users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          }));
          setCurrentUser((current) => (current?.id === id ? { ...current, ...patch } : current));
        } catch (err) {
          console.error(err);
          throw err;
        }
      },
      addUser: async (u) => {
        try {
          await api.createEmployee({
            ...u,
            role: u.role?.toUpperCase() || "EMPLOYEE",
            department: u.department,
            designation: u.designation,
            dob: u.dateOfBirth || undefined,
            joiningDate: u.joinedDate || undefined,
            status: u.status?.toUpperCase() || "ACTIVE",
          });
          const users = await api.fetchEmployees();
          setState((s) => ({ ...s, users }));
          return users.find((item) => item.email === u.email) ?? null;
        } catch (err) {
          console.error(err);
          throw err;
        }
      },
      removeUser: async (id) => {
        try {
          await api.deleteEmployee(id);
          setState((s) => ({
            ...s,
            users: s.users.filter((u) => u.id !== id),
            attendance: s.attendance.filter((a) => a.userId !== id),
            leaves: s.leaves.filter((l) => l.userId !== id),
          }));
        } catch (err) {
          console.error(err);
        }
      },
      checkIn: async (userId) => {
        try {
          const now = new Date().toISOString();
          await api.markAttendance({ status: "PRESENT", checkInTime: now });
          setState((s) => {
            const date = new Date().toISOString().slice(0, 10);
            const existing = s.attendance.find((a) => a.userId === userId && a.date === date);
            if (existing) return s;
            return {
              ...s,
              attendance: [
                ...s.attendance,
                { id: newId(), userId, date, checkIn: now, status: "present" },
              ],
            };
          });
        } catch (err) {
          console.error(err);
        }
      },
      checkOut: async (userId) => {
        try {
          const now = new Date().toISOString();
          await api.markAttendance({ status: "PRESENT", checkOutTime: now });
          setState((s) => {
            const date = new Date().toISOString().slice(0, 10);
            return {
              ...s,
              attendance: s.attendance.map((a) =>
                a.userId === userId && a.date === date ? { ...a, checkOut: now } : a,
              ),
            };
          });
        } catch (err) {
          console.error(err);
        }
      },
      applyLeave: async (data) => {
        try {
          await api.applyLeave(data);
          const leaves = await api.fetchMyLeaves();
          setState((s) => ({ ...s, leaves: leaves.leaves }));
        } catch (err) {
          console.error(err);
        }
      },
      setLeaveStatus: async (id, status) => {
        try {
          if (status === "approved") await api.approveLeave(id);
          else await api.rejectLeave(id);
          setState((s) => ({
            ...s,
            leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)),
          }));
        } catch (err) {
          console.error(err);
        }
      },
      sendMessage: async (userId, text) => {
        try {
          const msg = await api.createMessage(text);
          setState((s) => {
            if (s.messages.some((m) => m.id === msg.id)) {
              return s;
            }
            return {
              ...s,
              messages: [...s.messages, msg],
            };
          });
        } catch (err) {
          console.error(err);
        }
      },
      markMessagesAsRead: async (userId) => {
        try {
          setState((s) => {
            const hasUnread = s.messages.some((m) => !m.readBy?.includes(userId));
            if (!hasUnread) return s;
            return {
              ...s,
              messages: s.messages.map((m) => ({
                ...m,
                readBy: m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId],
              })),
            };
          });
          await api.markChatMessagesAsRead();
        } catch (err) {
          console.error(err);
        }
      },
      addHoliday: async (holiday) => {
        try {
          await api.createHoliday(holiday);
          const holidays = await api.fetchHolidays();
          setState((s) => ({ ...s, holidays: holidays.holidays }));
        } catch (err) {
          console.error(err);
        }
      },
      updateHoliday: async (id, holiday) => {
        try {
          await api.updateHoliday(id, holiday);
          setState((s) => ({
            ...s,
            holidays: s.holidays.map((h) => (h.id === id ? { ...h, ...holiday } : h)),
          }));
        } catch (err) {
          console.error(err);
        }
      },
      deleteHoliday: async (id) => {
        try {
          await api.deleteHoliday(id);
          setState((s) => ({ ...s, holidays: s.holidays.filter((h) => h.id !== id) }));
        } catch (err) {
          console.error(err);
        }
      },
    }),
    [state, currentUser, loadRemoteState],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
