// frontend/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  const auth = useAuthProvider();

  if (auth.loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading Smart Attendance...</p>
      </div>
    );
  }

  const RoleRoute = () => {
    if (!auth.userProfile) return <Navigate to="/login" />;
    switch (auth.userProfile.role) {
      case "student": return <Navigate to="/student" />;
      case "faculty": return <Navigate to="/faculty" />;
      case "admin": return <Navigate to="/admin" />;
      default: return <Navigate to="/login" />;
    }
  };

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        {auth.currentUser && <Navbar />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRoute />} />
          <Route path="/student/*" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty/*" element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
