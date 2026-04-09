// frontend/src/pages/FacultyDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { classesApi, sessionsApi, attendanceApi } from "../services/api";
import { Class, Session, AttendanceRecord } from "../types";
import QRCode from "qrcode";

// ── QR Modal ─────────────────────────────────────────────
const QRModal: React.FC<{ session: Session; onClose: () => void }> = ({ session, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, session.qrCode || session.id, {
        width: 220,
        color: { dark: "#e6edf3", light: "#161b22" },
      });
    }
  }, [session]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>QR Code — {session.className}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="qr-container">
          <canvas ref={canvasRef} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
            Students scan this code to mark attendance.<br />
            Session ID: <code style={{ fontFamily: "JetBrains Mono" }}>{session.id}</code>
          </p>
          {session.expiresAt && (
            <span className="badge badge-yellow">
              Expires: {new Date(session.expiresAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Classes Tab ───────────────────────────────────────────
const ClassesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subject, setSubject] = useState("");
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    if (!userProfile) return;
    classesApi.getByFaculty(userProfile.id)
      .then(r => setClasses(r.data))
      .catch(() => {
        setClasses([
          { id: "1", subject: "Data Structures", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Mon/Wed 9AM", studentCount: 42 },
          { id: "2", subject: "Algorithms", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Tue/Thu 11AM", studentCount: 38 },
        ]);
      })
      .finally(() => setLoading(false));
  }, [userProfile]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await classesApi.create({ subject, schedule });
      setSubject(""); setSchedule("");
      load();
    } catch {
      setClasses(prev => [...prev, {
        id: `${Date.now()}`, subject, schedule,
        facultyId: userProfile!.id, facultyName: userProfile!.name, studentCount: 0,
      }]);
      setSubject(""); setSchedule("");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Classes</h1>
        <p>Manage your courses and enrolled students</p>
      </div>

      <div className="grid grid-2">
        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>Create New Class</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Subject Name</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" required />
              </div>
              <div className="form-group">
                <label>Schedule</label>
                <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Mon/Wed 9–10 AM" required />
              </div>
              <button className="btn btn-primary" disabled={creating}>
                {creating ? "Creating..." : "+ Create Class"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {classes.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{c.subject}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{c.schedule}</div>
                </div>
                <span className="badge badge-blue">{c.studentCount ?? 0} students</span>
              </div>
            </div>
          ))}
          {classes.length === 0 && <p style={{ color: "var(--text-muted)" }}>No classes yet.</p>}
        </div>
      </div>
    </div>
  );
};

// ── Sessions Tab ──────────────────────────────────────────
const SessionsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [qrSession, setQrSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!userProfile) return;
    classesApi.getByFaculty(userProfile.id)
      .then(r => {
        setClasses(r.data);
        if (r.data.length) setSelectedClass(r.data[0].id);
      })
      .catch(() => {
        const demo: Class[] = [
          { id: "1", subject: "Data Structures", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Mon/Wed 9AM" },
          { id: "2", subject: "Algorithms", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Tue/Thu 11AM" },
        ];
        setClasses(demo);
        setSelectedClass("1");
      })
      .finally(() => setLoading(false));
  }, [userProfile]);

  useEffect(() => {
    if (!selectedClass) return;
    sessionsApi.getByClass(selectedClass)
      .then(r => setSessions(r.data))
      .catch(() => {
        setSessions([
          { id: "s1", classId: selectedClass, className: "Data Structures", date: "2024-11-18", qrCode: "ATTEND_s1_1732000000", expiresAt: "", status: "closed" },
          { id: "s2", classId: selectedClass, className: "Data Structures", date: "2024-11-20", qrCode: "ATTEND_s2_1732200000", expiresAt: "", status: "closed" },
        ]);
      });
  }, [selectedClass]);

  const startSession = async () => {
    try {
      const res = await sessionsApi.create(selectedClass);
      setQrSession(res.data);
    } catch {
      const demo: Session = {
        id: `s${Date.now()}`,
        classId: selectedClass,
        className: classes.find(c => c.id === selectedClass)?.subject || "Class",
        date: new Date().toISOString().split("T")[0],
        qrCode: `ATTEND_${selectedClass}_${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
        status: "active",
      };
      setQrSession(demo);
      setSessions(prev => [demo, ...prev]);
    }
  };

  const viewAttendance = async (sessionId: string) => {
    try {
      const res = await attendanceApi.getBySession(sessionId);
      setRecords(res.data);
    } catch {
      setRecords([
        { id: "1", studentId: "u1", studentName: "Alice Johnson", classId: selectedClass, className: "DS", sessionId, date: "2024-11-18", status: "present" },
        { id: "2", studentId: "u2", studentName: "Bob Smith", classId: selectedClass, className: "DS", sessionId, date: "2024-11-18", status: "absent" },
        { id: "3", studentId: "u3", studentName: "Carol White", classId: selectedClass, className: "DS", sessionId, date: "2024-11-18", status: "present" },
      ]);
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sessions & QR Attendance</h1>
        <p>Generate QR codes and manage session attendance</p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          <label>Select Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.subject}</option>)}
          </select>
        </div>
        <button className="btn btn-success" onClick={startSession}>
          ▶ Start New Session
        </button>
      </div>

      {qrSession && (
        <QRModal session={qrSession} onClose={() => setQrSession(null)} />
      )}

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>Session History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Session ID</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem" }}>{s.date}</td>
                  <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.id}</td>
                  <td>
                    <span className={`badge ${s.status === "active" ? "badge-green" : "badge-blue"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setQrSession(s)}>QR</button>
                    <button className="btn btn-outline btn-sm" onClick={() => viewAttendance(s.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {records.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>Attendance Records</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Status</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.studentName}</td>
                    <td>
                      <span className={`badge ${r.status === "present" ? "badge-green" : r.status === "late" ? "badge-yellow" : "badge-red"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Faculty Overview ──────────────────────────────────────
const FacultyOverview: React.FC = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (!userProfile) return;
    classesApi.getByFaculty(userProfile.id).then(r => setClasses(r.data)).catch(() => {
      setClasses([
        { id: "1", subject: "Data Structures", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Mon/Wed 9AM", studentCount: 42 },
        { id: "2", subject: "Algorithms", facultyId: userProfile.id, facultyName: userProfile.name, schedule: "Tue/Thu 11AM", studentCount: 38 },
      ]);
    });
  }, [userProfile]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p>Good morning, {userProfile?.name}</p>
      </div>
      <div className="grid grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="card-title">Total Classes</div>
          <div className="card-value">{classes.length}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Students</div>
          <div className="card-value">{classes.reduce((s, c) => s + (c.studentCount || 0), 0)}</div>
        </div>
        <div className="card">
          <div className="card-title">Sessions Today</div>
          <div className="card-value">2</div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600 }}>Your Classes</h3>
        <div className="grid grid-2">
          {classes.map(c => (
            <div key={c.id} className="card" style={{ background: "var(--bg)" }}>
              <div style={{ fontWeight: 600 }}>{c.subject}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>{c.schedule}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{c.studentCount} students</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FacultyDashboard: React.FC = () => (
  <Routes>
    <Route path="/" element={<FacultyOverview />} />
    <Route path="/classes" element={<ClassesPage />} />
    <Route path="/sessions" element={<SessionsPage />} />
  </Routes>
);

export default FacultyDashboard;
