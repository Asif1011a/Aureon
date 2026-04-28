import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, userRole, logout, lang, toggleLang } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navText = {
    EN: { citizen: "Citizen Portal", responder: "Volunteer Portal", signOut: "Sign Out", cta: "Join Now" },
    TA: { citizen: "குடிமக்கள் தளம்", responder: "தொண்டர் மையம்", signOut: "வெளியேறு", cta: "தொடங்குக" }
  };

  const t = navText[lang] || navText.EN;

  return (
    <nav className="navbar glass-panel">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon neon-glow">▲</div>
        <span className="gradient-text" style={{fontWeight: 800}}>Aureon <span style={{ opacity: 0.5, fontWeight: 500 }}>AI</span></span>
      </Link>
      
      <div className="navbar-links">
        <button onClick={toggleLang} style={{ fontWeight: 700, marginRight: '16px', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          {lang === "EN" ? "🌐 தமிழ்" : "🌐 English"}
        </button>

        {!user ? (
          <>
            <Link to="/login" style={{color: 'var(--text-muted)', fontWeight: 600}}>Sign In</Link>
            <Link to="/register" className="btn btn-primary">{t.cta}</Link>
          </>
        ) : (
          <>
            {userRole === "user" && <Link to="/status" style={{fontWeight: 600}}>{t.citizen}</Link>}
            {userRole === "volunteer" && <Link to="/volunteer" style={{fontWeight: 600}}>{t.responder}</Link>}
            {userRole === "admin" && <Link to="/admin" style={{fontWeight: 600}}>Admin Dashboard</Link>}
            <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: "12px", borderLeft: "1px solid var(--border)", paddingLeft: "20px", borderRadius: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {t.signOut}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
