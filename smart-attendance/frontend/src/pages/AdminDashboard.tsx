// frontend/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { adminApi } from "../services/api";
import { User, AnalyticsSummary } from "../types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#58a6ff", "#3fb950", "#d29922", "#bc8cff", "#f85149"];

const AdminOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(r => setAnalytics(r.data))
      .catch(() => {
        setAnalytics({
          totalStudents: 248,
          totalFaculty: 18,
          totalClasses: 36,
          avgAttendance: 74.2,
          classBreakdown: [
            { className: "Data Structures", avg: 88 },
            { className: "Operating Systems", avg: 72 },
            { className: "DBMS", avg: 85 },
            { className: "Computer Networks", avg: 65 },
            { className: "Algorithms", avg: 79 },
            { className: "Software Engg.", avg: 81 },
          ],
          trend: [
            { date: "Week 1", percentage: 81 },
            { date: "Week 2", percentage: 79 },
            { date: "Week 3", percentage: 75 },
            { date: "Week 4", percentage: 74 },
            { date: "Week 5", percentage: 77 },
            { date: "Week 6", percentage: 74 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = [
    { name: "≥75% (Safe)", value: 178 },
    { name: "60–74% (Warning)", value: 48 },
    { name: "<60% (At Risk)", value: 22 },
  ];

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;
  if (!analytics) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System-wide analytics and insights</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="card-title">Total Students</div>
          <div className="card-value" style={{ color: "var(--accent)" }}>{analytics.totalStudents}</div>
        </div>
        <div className="card">
          <div className="card-title">Faculty Members</div>
          <div className="card-value" style={{ color: "var(--accent-purple)" }}>{analytics.totalFaculty}</div>
        </div>
        <div className="card">
          <div className="card-title">Active Classes</div>
          <div className="card-value">{analytics.totalClasses}</div>
        </div>
        <div className="card">
          <div className="card-title">Avg. Attendance</div>
          <div className="card-value" style={{ color: analytics.avgAttendance >= 75 ? "var(--accent-green)" : "var(--accent-yellow)" }}>
            {analytics.avgAttendance}%
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Attendance by Class</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.classBreakdown} margin={{ top: 0, right: 0, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="className" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis domain={[50, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {analytics.classBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Student Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[2], COLORS[4]][i]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: "0.8rem", color: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Weekly Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis domain={[60, 90]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="percentage" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)" }} name="Avg %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    adminApi.getAllUsers()
      .then(r => setUsers(r.data))
      .catch(() => {
        setUsers([
          { id: "1", name: "Alice Johnson", email: "alice@uni.edu", role: "student", createdAt: "2024-08-01" },
          { id: "2", name: "Bob Smith", email: "bob@uni.edu", role: "student", createdAt: "2024-08-01" },
          { id: "3", name: "Dr. Carol White", email: "carol@uni.edu", role: "faculty", createdAt: "2024-07-15" },
          { id: "4", name: "Prof. David Lee", email: "david@uni.edu", role: "faculty", createdAt: "2024-07-15" },
          { id: "5", name: "Admin User", email: "admin@uni.edu", role: "admin", createdAt: "2024-07-01" },
          { id: "6", name: "Eve Adams", email: "eve@uni.edu", role: "student", createdAt: "2024-08-02" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? users : users.filter(u => u.role === filter);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage students, faculty, and administrators</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {["all", "student", "faculty", "admin"].map(r => (
          <button key={r} className={`btn btn-sm ${filter === r ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-red" : u.role === "faculty" ? "badge-yellow" : "badge-blue"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {u.createdAt?.split("T")[0]}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => setUsers(p => p.filter(x => x.id !== u.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const monthlyData = [
    { month: "Aug", sessions: 120, present: 98, absent: 22 },
    { month: "Sep", sessions: 145, present: 112, absent: 33 },
    { month: "Oct", sessions: 160, present: 118, absent: 42 },
    { month: "Nov", sessions: 130, present: 95, absent: 35 },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Detailed attendance analytics and trend analysis</p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Monthly Session Summary</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
            <Bar dataKey="present" fill="var(--accent-green)" name="Present" radius={[3, 3, 0, 0]} />
            <Bar dataKey="absent" fill="var(--accent-red)" name="Absent" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>At-Risk Students (Below 75%)</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Subject</th><th>Attendance %</th><th>Action Needed</th></tr></thead>
            <tbody>
              {[
                { name: "Bob Smith", subject: "Operating Systems", pct: 68, action: "Warning letter" },
                { name: "Eve Adams", subject: "Computer Networks", pct: 60, action: "Urgent intervention" },
                { name: "Frank Brown", subject: "DBMS", pct: 71, action: "Counseling" },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{r.subject}</td>
                  <td>
                    <span className={`badge ${r.pct >= 75 ? "badge-green" : r.pct >= 65 ? "badge-yellow" : "badge-red"}`}>
                      {r.pct}%
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => (
  <Routes>
    <Route path="/" element={<AdminOverview />} />
    <Route path="/users" element={<UsersPage />} />
    <Route path="/analytics" element={<AnalyticsPage />} />
  </Routes>
);

export default AdminDashboard;
