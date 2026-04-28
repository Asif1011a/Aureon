import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userRole, loading } = useApp();

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}><span className="spinner"/></div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;

  return children;
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/submit" element={
          <ProtectedRoute allowedRoles={["user"]}><RequestForm /></ProtectedRoute>
        } />
        <Route path="/status" element={
          <ProtectedRoute allowedRoles={["user"]}><RequestStatus /></ProtectedRoute>
        } />

        {/* Volunteer Route */}
        <Route path="/volunteer" element={
          <ProtectedRoute allowedRoles={["volunteer"]}><VolunteerDashboard /></ProtectedRoute>
        } />

        {/* Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <Chatbot />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ 
          style: { borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '14px', border: '1px solid var(--border)' } 
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
