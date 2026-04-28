import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

const ROLE_CONFIG = {
  user: {
    label: "Community Member",
    badge: "🏙️",
    badgeClass: "user",
    links: [
      { to: "/dashboard", label: "My Dashboard" },
      { to: "/submit", label: "New Request" },
      { to: "/status", label: "Track Status" },
    ],
  },
  volunteer: {
    label: "Responder",
    badge: "🚀",
    badgeClass: "volunteer",
    links: [
      { to: "/volunteer", label: "Responder Hub" },
    ],
  },
  admin: {
    label: "Admin",
    badge: "⚡",
    badgeClass: "admin",
    links: [
      { to: "/admin", label: "Command Center" },
    ],
  },
};

export default function Navbar() {
  const { user, userRole, logout, lang, toggleLang } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const config = ROLE_CONFIG[userRole] || null;

  return (
    <nav
      className="navbar"
      style={{
        boxShadow: scrolled ? "var(--shadow-md)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">▲</div>
        <span>
          Aureon{" "}
          <span style={{ fontWeight: 500, opacity: 0.45, fontSize: "0.9rem" }}>AI</span>
        </span>
      </Link>

      {/* Links */}
      <div className="navbar-links">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="icon-btn"
          title={lang === "EN" ? "Switch to Tamil" : "Switch to English"}
          style={{ marginRight: "4px", fontSize: "0.85rem", width: "auto", padding: "6px 12px", gap: "4px" }}
        >
          🌐 {lang === "EN" ? "தமிழ்" : "EN"}
        </button>

        {!user ? (
          <>
            <Link
              to="/login"
              style={{ color: location.pathname === "/login" ? "var(--primary)" : undefined }}
            >
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-nav-primary">
              Get Started →
            </Link>
          </>
        ) : (
          <>
            {/* Role badge */}
            {config && (
              <span className={`navbar-role-badge ${config.badgeClass}`}>
                {config.badge} {config.label}
              </span>
            )}

            {/* Role-specific nav links */}
            {config?.links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: location.pathname === link.to ? "var(--primary)" : undefined,
                  fontWeight: location.pathname === link.to ? "600" : undefined,
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Sign out */}
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "8px",
                borderLeft: "1px solid var(--border)",
                paddingLeft: "16px",
                borderRadius: 0,
                color: "var(--text-muted)",
              }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
