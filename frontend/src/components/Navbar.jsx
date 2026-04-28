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
    EN: { citizen: "Citizen Portal", responder: "Responder Node", command: "Command Center", signOut: "Sign Out", cta: "Deploy Now" },
    TA: { citizen: "குடிமக்கள் தளம்", responder: "தொண்டர் மையம்", command: "கட்டுப்பாட்டு அறை", signOut: "வெளியேறு", cta: "தொடங்குக" }
  };

  const t = navText[lang] || navText.EN;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">▲</div>
        <span>Aureon <span style={{ opacity: 0.5, fontWeight: 500 }}>OS</span></span>
      </Link>
      
      <div className="navbar-links">
        <button onClick={toggleLang} style={{ fontWeight: 700, marginRight: '16px', color: 'var(--primary)' }}>
          {lang === "EN" ? "🌐 தமிழ்" : "🌐 English"}
        </button>

        {!user ? (
          <>
            <Link to="/login">Authentication</Link>
            <Link to="/register" className="btn btn-nav-primary">{t.cta}</Link>
          </>
        ) : (
          <>
            {userRole === "user" && <Link to="/status">{t.citizen}</Link>}
            {userRole === "volunteer" && <Link to="/volunteer">{t.responder}</Link>}
            {userRole === "admin" && <Link to="/admin">{t.command}</Link>}
            <button onClick={handleLogout} style={{ marginLeft: "12px", borderLeft: "1px solid var(--border)", paddingLeft: "20px", borderRadius: 0 }}>
              {t.signOut}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
