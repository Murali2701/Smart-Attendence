// frontend/src/components/Navbar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar: React.FC = () => {
  const { userProfile, logout } = useAuth();

  const links: Record<string, { to: string; label: string }[]> = {
    student: [
      { to: "/student", label: "Dashboard" },
      { to: "/student/attendance", label: "Attendance" },
      { to: "/student/report", label: "AI Report" },
    ],
    faculty: [
      { to: "/faculty", label: "Dashboard" },
      { to: "/faculty/classes", label: "Classes" },
      { to: "/faculty/sessions", label: "Sessions" },
    ],
    admin: [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/users", label: "Users" },
      { to: "/admin/analytics", label: "Analytics" },
    ],
  };

  const navLinks = userProfile ? links[userProfile.role] || [] : [];

  return (
    <nav className="navbar">
      <div className="nav-brand">Smart<span>Attend</span></div>
      <div className="nav-links">
        {navLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/student" || l.to === "/faculty" || l.to === "/admin"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="nav-user">
        {userProfile && (
          <>
            <span className="nav-role">{userProfile.role}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {userProfile.name}
            </span>
          </>
        )}
        <button className="btn btn-outline btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
