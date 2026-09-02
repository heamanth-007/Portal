// In-memory mock data store. Replace with API calls when wiring a real backend.
export type Role = "admin" | "employee";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus =
  | "present"
  | "absent"
  | "not_marked"
  | "LEAVE"
  | "PRESENT"
  | "ABSENT";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  phone: string;
  avatarUrl?: string;
  leaveBalance: number;
  status?: "active" | "inactive";
  shiftTiming?: string;
  // Extended employee details
  employeeId?: string;
  designation?: string;
  manager?: string;
  joinedDate?: string; // YYYY-MM-DD
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  skills?: string[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO
  checkOut?: string; // ISO
  status: AttendanceStatus;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  readBy?: string[];
}

export type HolidayType = "Government" | "Company";

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
  description?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

export const seedUsers: User[] = [
  {
    id: "u-admin",
    name: "Aarav Sharma",
    email: "admin@mahesbankers.com",
    password: "admin123",
    role: "admin",
    department: "Operations",
    phone: "+91 98000 11111",
    leaveBalance: 18,
    status: "active",
    shiftTiming: "09:00 - 18:00",
    employeeId: "MB-0001",
    designation: "Head of Operations",
    manager: "—",
    joinedDate: "2019-06-01",
    dateOfBirth: "1988-03-12",
    gender: "male",
    bloodGroup: "O+",
    address: "12 Banyan Street, Bengaluru, KA 560001",
    emergencyContactName: "Meera Sharma",
    emergencyContactPhone: "+91 98000 99999",
    skills: ["Leadership", "Operations", "Strategy"],
  },
  {
    id: "u-emp-1",
    name: "Priya Nair",
    email: "employee@mahesbankers.com",
    password: "employee123",
    role: "employee",
    department: "Engineering",
    phone: "+91 98000 22222",
    leaveBalance: 14,
    status: "active",
    shiftTiming: "09:00 - 18:00",
    employeeId: "MB-0102",
    designation: "Senior Software Engineer",
    manager: "Aarav Sharma",
    joinedDate: "2021-09-15",
    dateOfBirth: "1994-07-22",
    gender: "female",
    bloodGroup: "A+",
    address: "44 Lotus Avenue, Kochi, KL 682001",
    emergencyContactName: "Anil Nair",
    emergencyContactPhone: "+91 98000 55555",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    id: "u-emp-2",
    name: "Rahul Verma",
    email: "rahul@mahesbankers.com",
    password: "rahul123",
    role: "employee",
    department: "Design",
    phone: "+91 98000 33333",
    leaveBalance: 12,
    status: "active",
    shiftTiming: "10:00 - 19:00",
    employeeId: "MB-0118",
    designation: "Product Designer",
    manager: "Aarav Sharma",
    joinedDate: "2022-02-07",
    dateOfBirth: "1996-11-30",
    gender: "male",
    bloodGroup: "B+",
    address: "9 Marine Drive, Mumbai, MH 400020",
    emergencyContactName: "Kavita Verma",
    emergencyContactPhone: "+91 98000 66666",
    skills: ["Figma", "Design Systems", "Prototyping"],
  },
  {
    id: "u-emp-3",
    name: "Sneha Iyer",
    email: "sneha@mahesbankers.com",
    password: "sneha123",
    role: "employee",
    department: "QA",
    phone: "+91 98000 44444",
    leaveBalance: 16,
    status: "active",
    shiftTiming: "09:00 - 18:00",
    employeeId: "MB-0125",
    designation: "QA Engineer",
    manager: "Aarav Sharma",
    joinedDate: "2022-08-19",
    dateOfBirth: "1995-04-05",
    gender: "female",
    bloodGroup: "AB+",
    address: "21 Park Road, Chennai, TN 600006",
    emergencyContactName: "Ramesh Iyer",
    emergencyContactPhone: "+91 98000 77777",
    skills: ["Cypress", "Playwright", "Test Strategy"],
  },
];

export const seedAttendance: AttendanceRecord[] = (() => {
  const records: AttendanceRecord[] = [];
  const userIds = ["u-emp-1", "u-emp-2", "u-emp-3"];

  // Generate 30 days of attendance records
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    userIds.forEach((userId) => {
      const rand = Math.random();
      let status: AttendanceStatus = "present";
      let checkIn: string | undefined;
      let checkOut: string | undefined;

      if (rand < 0.8) {
        status = "present";
        const checkInTime = new Date(date);
        checkInTime.setHours(
          9 + Math.floor(Math.random() * 1),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        checkIn = checkInTime.toISOString();

        const checkOutTime = new Date(date);
        checkOutTime.setHours(
          18 + Math.floor(Math.random() * 1),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        checkOut = checkOutTime.toISOString();
      } else if (rand < 0.95) {
        status = "absent";
      } else {
        status = "not_marked";
      }

      records.push({
        id: uid(),
        userId,
        date: dateStr,
        checkIn,
        checkOut,
        status,
      });
    });
  }

  return records;
})();

export const seedLeaves: LeaveRequest[] = [
  {
    id: uid(),
    userId: "u-emp-2",
    fromDate: today(),
    toDate: today(),
    reason: "Family function",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: uid(),
    userId: "u-emp-3",
    fromDate: today(),
    toDate: today(),
    reason: "Medical appointment",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const seedMessages: ChatMessage[] = [
  {
    id: uid(),
    userId: "u-admin",
    text: "Good morning team! Sprint planning at 11am.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uid(),
    userId: "u-emp-1",
    text: "On it. Joining from the war room.",
    createdAt: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: uid(),
    userId: "u-emp-2",
    text: "I'll share the design review deck shortly.",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const seedHolidays: Holiday[] = [
  {
    id: uid(),
    name: "Republic Day",
    date: "2026-01-26",
    type: "Government",
    description: "National Holiday",
  },
  {
    id: uid(),
    name: "Independence Day",
    date: "2026-08-15",
    type: "Government",
    description: "National Holiday",
  },
  {
    id: uid(),
    name: "Diwali",
    date: "2026-11-08",
    type: "Company",
    description: "Festival of Lights",
  },
];

export const newId = uid;
