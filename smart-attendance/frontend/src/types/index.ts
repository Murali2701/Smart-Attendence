// frontend/src/types/index.ts

export type UserRole = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Class {
  id: string;
  subject: string;
  facultyId: string;
  facultyName: string;
  schedule: string;
  studentCount?: number;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  date: string;
  qrCode: string;
  expiresAt: string;
  status: "active" | "closed";
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  sessionId: string;
  date: string;
  status: "present" | "absent" | "late";
}

export interface AttendanceStats {
  classId: string;
  className: string;
  totalSessions: number;
  attended: number;
  percentage: number;
}

export interface AIReport {
  studentName: string;
  summary: string;
  suggestions: string[];
  riskLevel: "low" | "medium" | "high";
  generatedAt: string;
}

export interface AnalyticsSummary {
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  avgAttendance: number;
  classBreakdown: { className: string; avg: number }[];
  trend: { date: string; percentage: number }[];
}
