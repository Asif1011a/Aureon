import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useApp } from "../context/AppContext";

const statusColors = {
  pending:    { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  assigned:   { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  inprogress: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  completed:  { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
};

const urgencyColors = {
  EMERGENCY: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
  HIGH:      { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  MEDIUM:    { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  LOW:       { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
};

function StatBox({ value, label, icon, delay = 0 }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function UserDashboard() {
  const { user, userData } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "requests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const stats = {
    total: requests.length,
    active: requests.filter(r => ["assigned", "inprogress"].includes(r.status)).length,
    pending: requests.filter(r => r.status === "pending").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1000px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "36px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "500" }}>
                {greeting()}, 👋
              </p>
              <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.04em", color: "var(--text)", marginTop: "4px" }}>
                {userData?.name || "Community Member"}
              </h1>
              <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.95rem" }}>
                Manage your service requests and track help in real-time.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link to="/submit" className="btn btn-primary btn-lg" style={{ gap: "8px" }}>
                <span>＋</span> New Request
              </Link>
              <Link to="/status" className="btn btn-secondary" style={{ gap: "8px" }}>
                📡 Track Status
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <StatBox value={stats.total}     label="Total Requests"   icon="📋" delay={0.0} />
          <StatBox value={stats.pending}   label="Awaiting Match"   icon="⏳" delay={0.1} />
          <StatBox value={stats.active}    label="In Progress"      icon="🚀" delay={0.2} />
          <StatBox value={stats.completed} label="Resolved"         icon="✅" delay={0.3} />
        </div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ marginBottom: "32px" }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text)", letterSpacing: "-0.02em" }}>
            Quick Actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            {[
              { icon: "🏥", title: "Medical Help",    sub: "Request urgent care",    cat: "Medical",    link: "/submit" },
              { icon: "🍽️", title: "Food & Water",    sub: "Nutrition support",      cat: "Food",       link: "/submit" },
              { icon: "🏠", title: "Shelter",         sub: "Emergency housing",      cat: "Shelter",    link: "/submit" },
              { icon: "📚", title: "Education Aid",   sub: "Learning resources",     cat: "Education",  link: "/submit" },
            ].map((item, i) => (
              <motion.div
                key={item.cat}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 + i * 0.07 }}
              >
                <Link
                  to={item.link}
                  style={{ textDecoration: "none" }}
                >
                  <div className="card-feature" style={{ padding: "20px" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>{item.icon}</div>
                    <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "0.95rem" }}>{item.title}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>{item.sub}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Recent Requests ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", letterSpacing: "-0.02em" }}>
              Recent Requests
            </h2>
            {requests.length > 0 && (
              <Link to="/status" style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600", textDecoration: "none" }}>
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <span className="spinner spinner-dark" style={{ width: "28px", height: "28px" }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <h3>No requests yet</h3>
              <p>Create your first service request to get matched with a volunteer.</p>
              <Link to="/submit" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Create Request
              </Link>
            </div>
          ) : (
            <div>
              {requests.slice(0, 5).map((req, i) => {
                const sColor = statusColors[req.status] || statusColors.pending;
                const uColor = urgencyColors[req.urgency] || urgencyColors.MEDIUM;
                return (
                  <motion.div
                    key={req.id}
                    className="request-card"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.07 }}
                  >
                    <div className="request-card-header">
                      <div className="request-card-title">{req.summary}</div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <span style={{
                          background: uColor.bg, color: uColor.color,
                          border: `1px solid ${uColor.border}`,
                          padding: "3px 9px", borderRadius: "99px",
                          fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase"
                        }}>{req.urgency}</span>
                        <span style={{
                          background: sColor.bg, color: sColor.color,
                          border: `1px solid ${sColor.border}`,
                          padding: "3px 9px", borderRadius: "99px",
                          fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase"
                        }}>{req.status}</span>
                      </div>
                    </div>

                    <div style={{ height: "4px", borderRadius: "99px", background: "var(--bg-hover)", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        height: "100%",
                        width: req.status === "completed" ? "100%" : req.status === "inprogress" ? "66%" : req.status === "assigned" ? "33%" : "10%",
                        background: "var(--grad-primary)",
                        transition: "width 0.8s ease",
                        borderRadius: "99px"
                      }} />
                    </div>

                    <div className="request-card-meta">
                      <span>📍 {req.area}</span>
                      <span>📂 {req.category}</span>
                      {req.assignedVolunteerName && <span style={{ color: "var(--success-dark)" }}>✅ {req.assignedVolunteerName}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
