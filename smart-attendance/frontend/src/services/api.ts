// frontend/src/services/api.ts
import axios from "axios";
import { auth } from "../firebase";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080/api";

const api = axios.create({ baseURL: BASE_URL });

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Classes ──────────────────────────────────────────────────────────────────
export const classesApi = {
  getAll: () => api.get("/classes"),
  getByFaculty: (facultyId: string) => api.get(`/classes/faculty/${facultyId}`),
  getByStudent: (studentId: string) => api.get(`/classes/student/${studentId}`),
  create: (data: { subject: string; schedule: string }) => api.post("/classes", data),
  delete: (id: string) => api.delete(`/classes/${id}`),
  enroll: (classId: string, studentId: string) =>
    api.post(`/classes/${classId}/enroll`, { studentId }),
};

// ── Sessions ─────────────────────────────────────────────────────────────────
export const sessionsApi = {
  create: (classId: string) => api.post(`/sessions`, { classId }),
  getByClass: (classId: string) => api.get(`/sessions/class/${classId}`),
  close: (sessionId: string) => api.put(`/sessions/${sessionId}/close`),
  getActive: (classId: string) => api.get(`/sessions/class/${classId}/active`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  markViaQR: (sessionId: string, studentId: string) =>
    api.post(`/attendance/qr`, { sessionId, studentId }),
  markManual: (sessionId: string, studentId: string, status: string) =>
    api.post(`/attendance/manual`, { sessionId, studentId, status }),
  getByStudent: (studentId: string) => api.get(`/attendance/student/${studentId}`),
  getBySession: (sessionId: string) => api.get(`/attendance/session/${sessionId}`),
  getStats: (studentId: string) => api.get(`/attendance/stats/${studentId}`),
};

// ── AI Report ─────────────────────────────────────────────────────────────────
export const aiApi = {
  generateReport: (studentId: string) => api.post(`/ai/report/${studentId}`),
};

// ── Admin Analytics ───────────────────────────────────────────────────────────
export const adminApi = {
  getAnalytics: () => api.get(`/admin/analytics`),
  getAllUsers: () => api.get(`/admin/users`),
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
};

export default api;
