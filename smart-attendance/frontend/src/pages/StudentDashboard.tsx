// frontend/src/pages/StudentDashboard.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { attendanceApi, aiApi } from "../services/api";
import { AttendanceStats, AttendanceRecord, AIReport } from "../types";
import ScannerModal from "../components/ScannerModal";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const AttendanceRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 80 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? "var(--accent-green)" : pct >= 60 ? "var(--accent-yellow)" : "var(--accent-red)";
  return (
    <div className="stat-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="stat-ring-label">
        <span className="pct" style={{ color, fontSize: size < 70 ? "0.9rem" : "1.2rem" }}>{pct}%</span>
      </div>
    </div>
  );
};

const Overview: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    attendanceApi.getStats(userProfile.id)
      .then(r => setStats(r.data))
      .catch(() => {
        // Demo data fallback
        setStats([
          { classId: "1", className: "Data Structures", totalSessions: 30, attended: 27, percentage: 90 },
          { classId: "2", className: "Operating Systems", totalSessions: 28, attended: 19, percentage: 68 },
          { classId: "3", className: "DBMS", totalSessions: 25, attended: 22, percentage: 88 },
          { classId: "4", className: "Computer Networks", totalSessions: 20, attended: 12, percentage: 60 },
        ]);
      })
      .finally(() => setLoading(false));
  }, [userProfile]);

  const overall = stats.length
    ? Math.round(stats.reduce((s, c) => s + c.percentage, 0) / stats.length)
    : 0;

  const trendData = [
    { month: "Aug", pct: 82 }, { month: "Sep", pct: 78 }, { month: "Oct", pct: 85 },
    { month: "Nov", pct: overall }, { month: "Dec", pct: overall },
  ];

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome back, {userProfile?.name} 👋</h1>
        <p>Here's your attendance overview</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.5rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <AttendanceRing pct={overall} size={70} />
          <div>
            <div className="card-title">Overall Attendance</div>
            <div style={{ fontSize: "0.85rem", color: overall >= 75 ? "var(--accent-green)" : "var(--accent-red)" }}>
              {overall >= 75 ? "✓ Good Standing" : "⚠ At Risk"}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Total Classes</div>
          <div className="card-value">{stats.reduce((s, c) => s + c.totalSessions, 0)}</div>
        </div>
        <div className="card">
          <div className="card-title">Attended</div>
          <div className="card-value" style={{ color: "var(--accent-green)" }}>
            {stats.reduce((s, c) => s + c.attended, 0)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Missed</div>
          <div className="card-value" style={{ color: "var(--accent-red)" }}>
            {stats.reduce((s, c) => s + (c.totalSessions - c.attended), 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Attendance by Subject</h3>
          {stats.map(s => (
            <div key={s.classId} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span>{s.className}</span>
                <span style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>{s.percentage}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${s.percentage >= 75 ? "progress-high" : s.percentage >= 60 ? "progress-mid" : "progress-low"}`}
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", fontWeight: 600 }}>Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis domain={[50, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const AttendancePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    attendanceApi.getByStudent(userProfile.id)
      .then(r => setRecords(r.data))
      .catch(() => {
        const demo: AttendanceRecord[] = [];
        const subjects = ["Data Structures", "OS", "DBMS", "Networks"];
        const statuses: ("present" | "absent" | "late")[] = ["present", "present", "present", "absent", "late"];
        for (let i = 0; i < 20; i++) {
          demo.push({
            id: `${i}`,
            studentId: userProfile.id,
            studentName: userProfile.name,
            classId: `${i % 4 + 1}`,
            className: subjects[i % 4],
            sessionId: `s${i}`,
            date: new Date(2024, 10, i + 1).toISOString().split("T")[0],
            status: statuses[i % 5],
          });
        }
        setRecords(demo);
      })
      .finally(() => setLoading(false));
  }, [userProfile]);

  const statusBadge = (s: string) => {
    if (s === "present") return <span className="badge badge-green">Present</span>;
    if (s === "late") return <span className="badge badge-yellow">Late</span>;
    return <span className="badge badge-red">Absent</span>;
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Attendance History</h1>
        <p>Your complete session-by-session attendance record</p>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem" }}>{r.date}</td>
                  <td>{r.className}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AIReportPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!userProfile) return;
    setLoading(true);
    setError("");
    try {
      const res = await aiApi.generateReport(userProfile.id);
      setReport(res.data);
    } catch {
      // Demo fallback
      setReport({
        studentName: userProfile.name,
        summary: `${userProfile.name} has maintained a moderate attendance record this semester. With an overall attendance of 76.5%, the student is just above the minimum threshold of 75%. Performance is strongest in Data Structures (90%) and DBMS (88%), but Computer Networks (60%) and Operating Systems (68%) are concerning and may affect eligibility for final examinations if not improved promptly.`,
        suggestions: [
          "Prioritize attending Computer Networks and Operating Systems classes immediately to avoid falling below the 75% threshold.",
          "Set phone reminders 30 minutes before each class to avoid last-minute absences.",
          "Coordinate with classmates to get notes for unavoidable absences rather than skipping lectures entirely.",
          "Speak with faculty for Computer Networks to discuss current standing and seek academic guidance.",
          "Aim for 100% attendance for the remaining 4 weeks to bring overall percentage to a comfortable 82%.",
        ],
        riskLevel: "medium",
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const riskColors: Record<string, string> = {
    low: "var(--accent-green)",
    medium: "var(--accent-yellow)",
    high: "var(--accent-red)",
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>AI Attendance Report</h1>
        <p>Personalized insights powered by Gemini AI</p>
      </div>

      {!report ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤖</div>
          <h3 style={{ marginBottom: "0.5rem" }}>Generate Your AI Report</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
            Get a personalized analysis of your attendance patterns with actionable suggestions to improve.
          </p>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "✨ Generate AI Report"}
          </button>
          {error && <div className="error-msg" style={{ marginTop: "1rem" }}>{error}</div>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Report for</div>
              <div style={{ fontWeight: 600 }}>{report.studentName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="card-title">Risk Level</div>
              <span className="badge" style={{ background: `${riskColors[report.riskLevel]}20`, color: riskColors[report.riskLevel] }}>
                {report.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="ai-report">
            <h4>📊 AI Summary</h4>
            <p>{report.summary}</p>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>💡 Improvement Suggestions</h4>
            <ul className="ai-suggestions">
              {report.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <button className="btn btn-outline btn-sm" onClick={() => setReport(null)}>
            Regenerate Report
          </button>
        </div>
      )}
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/report" element={<AIReportPage />} />
      </Routes>

      <button 
        className="scan-btn-fab" 
        onClick={() => setShowScanner(true)}
        title="Scan Attendance"
      >
        📷
      </button>

      {showScanner && (
        <ScannerModal 
          onClose={() => setShowScanner(false)} 
          onSuccess={(record) => {
            console.log("Attendance marked:", record);
            // Optionally refresh stats or history here
            window.location.reload(); // Simple refresh to show new attendance
          }} 
        />
      )}
    </>
  );
};

export default StudentDashboard;
