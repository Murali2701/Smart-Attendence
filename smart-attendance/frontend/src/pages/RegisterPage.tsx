// frontend/src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Smart<span>Attend</span></div>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
