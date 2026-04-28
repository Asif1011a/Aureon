import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequestForm from "./pages/RequestForm";
import RequestStatus from "./pages/RequestStatus";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function RoleRedirect() {
  const { user, userRole } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && userRole) {
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "volunteer") navigate("/volunteer");
      // users go to / (landing with logged-in state)
    }
  }, [user, userRole]);
  return null;
}

function ProtectedRoute({ children, roles }) {
  const { user, userRole } = useApp();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(userRole)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <>
      <Navbar />
      <RoleRedirect />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit" element={
          <ProtectedRoute roles={["user", "admin"]}>
            <RequestForm />
          </ProtectedRoute>
        } />
        <Route path="/status" element={
          <ProtectedRoute roles={["user", "admin"]}>
            <RequestStatus />
          </ProtectedRoute>
        } />
        <Route path="/volunteer" element={
          <ProtectedRoute roles={["volunteer", "admin"]}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <Chatbot />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "0.9rem",
            },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  );
}
