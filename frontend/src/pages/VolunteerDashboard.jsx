import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { calculateMatchScore } from "../utils/aiMatching";
import toast from "react-hot-toast";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

function MissionRouteMap({ volunteerLocation, incidentLocation }) {
  const [route, setRoute] = useState(null);
  const [stats, setStats] = useState(null);
  const [routeError, setRouteError] = useState(false);

  useEffect(() => {
    if (!volunteerLocation || !incidentLocation) return;
    setRoute(null);
    setStats(null);
    setRouteError(false);

    async function fetchRoute() {
      const p1 = `${volunteerLocation.lng},${volunteerLocation.lat}`;
      const p2 = `${incidentLocation.lng},${incidentLocation.lat}`;
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${p1};${p2}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await res.json();
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const latLngs = r.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoute(latLngs);
          setStats({
            distance: (r.distance / 1000).toFixed(1) + " km",
            duration: Math.ceil(r.duration / 60) + " min",
          });
        } else {
          setRouteError(true);
        }
      } catch (err) {
        // Fallback: straight-line route between the two points
        setRoute([
          [volunteerLocation.lat, volunteerLocation.lng],
          [incidentLocation.lat, incidentLocation.lng],
        ]);
        // Use Haversine formula for accurate distance even in fallback
        const R = 6371;
        const dLat = (incidentLocation.lat - volunteerLocation.lat) * Math.PI / 180;
        const dLon = (incidentLocation.lng - volunteerLocation.lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(volunteerLocation.lat * Math.PI / 180) *
          Math.cos(incidentLocation.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setStats({ distance: dist.toFixed(1) + " km", duration: Math.ceil(dist * 3) + " min (est.)" });
        setRouteError(true);
      }
    }
    fetchRoute();
  }, [volunteerLocation, incidentLocation]);

  if (!route) return <div style={{height: "140px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-hover)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px", flexDirection: "column", gap: "8px"}}><span className="spinner"></span><span style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>Fetching OSRM route…</span></div>;

  const bounds = [
    [volunteerLocation.lat, volunteerLocation.lng],
    [incidentLocation.lat, incidentLocation.lng]
  ];

  return (
    <div style={{ position: "relative", height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "16px" }}>
      {routeError && (
        <div style={{ position: "absolute", top: "8px", left: "12px", zIndex: 999, background: "rgba(245,158,11,0.9)", color: "white", fontSize: "0.7rem", fontWeight: "700", padding: "3px 8px", borderRadius: "6px" }}>
          ⚠ Straight-line estimate (OSRM unavailable)
        </div>
      )}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 999, background: "var(--bg-card)", padding: "8px 12px", borderRadius: "8px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--primary)", display: "flex", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Distance</span>
          <span style={{ fontWeight: "800", color: "var(--primary)" }}>{stats?.distance ?? "…"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>ETA</span>
          <span style={{ fontWeight: "800", color: "var(--success)" }}>{stats?.duration ?? "…"}</span>
        </div>
      </div>
      <MapContainer bounds={bounds} style={{ height: "100%", width: "100%", zIndex: 0 }}>
         <TileLayer
           url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
           maxZoom={19}
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
         />
         <Marker position={[volunteerLocation.lat, volunteerLocation.lng]} />
         <Marker position={[incidentLocation.lat, incidentLocation.lng]} />
         <Polyline positions={route} color={routeError ? "#f59e0b" : "var(--primary)"} weight={5} opacity={0.85} dashArray={routeError ? "8 6" : null} />
         <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}

const urgencyStyle = {
  EMERGENCY: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
  HIGH:      { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  MEDIUM:    { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  LOW:       { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
};

function MatchScoreBadge({ score }) {
  const color =
    score >= 80 ? "var(--success)" :
    score >= 60 ? "var(--warning)" :
    "var(--danger)";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "var(--bg-hover)", borderRadius: "10px",
      padding: "10px 14px", minWidth: "64px",
      border: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: "1.3rem", fontWeight: "800", color, letterSpacing: "-0.04em" }}>{score}</span>
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Match</span>
    </div>
  );
}

export default function VolunteerDashboard() {
  const { user, userData } = useApp();
  const [tab, setTab] = useState("available");
  const [requests, setRequests] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(userData?.isAvailable ?? true);

  useEffect(() => {
    if (!user) return;
    // Query 1: general pending requests (unassigned, show to all matching volunteers)
    const q1 = query(
      collection(db, "requests"),
      where("status", "==", "pending")
    );
    // Query 2: AI-auto-matched requests specifically directed at this volunteer
    const q2 = query(
      collection(db, "requests"),
      where("status", "==", "pending_acceptance"),
      where("assignedVolunteerId", "==", user.uid)
    );

    let pendingDocs = [];
    let acceptanceDocs = [];

    function merge() {
      const combined = [...acceptanceDocs, ...pendingDocs];
      combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      // For plain pending requests, only show those matched to this volunteer (if matchedVolunteers field exists).
      // Legacy requests that predate the matchedVolunteers field are shown to all volunteers as a fallback.
      const pendingFiltered = pendingDocs.filter(r =>
        !r.matchedVolunteers || r.matchedVolunteers.some(m => m.volunteerId === user.uid)
      );
      const result = [...acceptanceDocs, ...pendingFiltered];
      result.sort((a, b) => {
        // AI-matched (pending_acceptance) always first
        if (a.status === "pending_acceptance" && b.status !== "pending_acceptance") return -1;
        if (b.status === "pending_acceptance" && a.status !== "pending_acceptance") return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setRequests(result);
      setLoading(false);
    }

    const unsub1 = onSnapshot(q1, snap => {
      pendingDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      merge();
    });
    const unsub2 = onSnapshot(q2, snap => {
      acceptanceDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      merge();
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "requests"),
      where("assignedVolunteerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort manually to avoid index requirement
      items.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyTasks(items);
    });
    return unsub;
  }, [user]);

  async function acceptTask(req) {
    try {
      if (req.status === "pending_acceptance") {
        // AI already matched & "assigned" this volunteer; accepting moves directly to inprogress
        // (the 'assigned' step is implicit — the assignment happened at request creation)
        await updateDoc(doc(db, "requests", req.id), {
          status: "inprogress",
          assignedVolunteerId: user.uid,
          assignedVolunteerName: userData?.name || "Volunteer",
          assignedVolunteerPhone: userData?.phone || "",
          updatedAt: serverTimestamp(),
        });
      } else {
        // General pending request
        await updateDoc(doc(db, "requests", req.id), {
          status: "assigned",
          assignedVolunteerId: user.uid,
          assignedVolunteerName: userData?.name || "Volunteer",
          assignedVolunteerPhone: userData?.phone || "",
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Task accepted! Review the AI Action Plan.");
      setTab("my-tasks");
    } catch (err) {
      toast.error("Failed to accept task");
    }
  }

  async function declineTask(req) {
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "pending",
        assignedVolunteerId: null,
        assignedVolunteerName: null,
        assignedVolunteerPhone: null,
        updatedAt: serverTimestamp(),
      });
      toast.success("Request declined – it will be re-assigned to another volunteer.");
    } catch (err) {
      toast.error("Failed to decline task");
    }
  }

  async function updateStatus(req, newStatus) {
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Status updated: ${newStatus}`);
    } catch (err) {
      toast.error("Update failed");
    }
  }

  async function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await updateDoc(doc(db, "users", user.uid), { isAvailable: next });
      toast.success(next ? "You are now available" : "You are now marked as busy");
    } catch {}
  }

  const urgencyOrder = { EMERGENCY: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedRequests = [...requests].sort(
    (a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9)
  );

  const pendingAcceptanceCount = requests.filter(r => r.status === "pending_acceptance").length;

  // Compute enriched requests
  const enrichedRequests = sortedRequests.map(req => {
    const { total: matchScore } = calculateMatchScore(
      { ...userData, id: user?.uid, isAvailable },
      req
    );
    return { ...req, matchScore };
  });

  const stats = {
    available: sortedRequests.length,
    active: myTasks.filter(t => t.status !== "completed").length,
    completed: myTasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            marginBottom: "28px", flexWrap: "wrap", gap: "16px",
          }}
        >
          <div>
            <span className="section-badge" style={{ marginBottom: "8px" }}>🚀 Responder Node</span>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.04em", color: "var(--text)" }}>
              Volunteer Dashboard
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.95rem" }}>
              Welcome back, <strong style={{ color: "var(--text)" }}>{userData?.name || "Volunteer"}</strong>
            </p>
          </div>

          <motion.button
            id="availability-toggle"
            className={`btn ${isAvailable ? "btn-success" : "btn-secondary"}`}
            style={{ borderRadius: "99px", gap: "8px" }}
            onClick={toggleAvailability}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: isAvailable ? "rgba(255,255,255,0.9)" : "var(--text-faint)",
              display: "inline-block",
              animation: isAvailable ? "pulse-dot 2s infinite" : "none",
            }} />
            {isAvailable ? "Available for Missions" : "Status: Busy"}
          </motion.button>
        </motion.div>

        {/* ── Quick Stats ── */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "24px" }}>
          {[
            { value: stats.available, label: "Open Requests", icon: "📋", delay: 0 },
            { value: stats.active,    label: "Active Cases",  icon: "🚗", delay: 0.1 },
            { value: stats.completed, label: "Completed",     icon: "✅", delay: 0.2 },
          ].map(s => (
            <motion.div
              key={s.label}
              className="stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: s.delay }}
            >
              <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Profile chips ── */}
        {userData?.skills?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: "24px" }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Your Skills
            </div>
            <div className="chip-list">
              {userData.skills.map(s => (
                <span key={s} className="chip selected">{s}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Tabs ── */}
        <div className="tabs">
          <button className={`tab ${tab === "available" ? "active" : ""}`} onClick={() => setTab("available")}>
            🔔 Open Requests ({sortedRequests.length})
            {pendingAcceptanceCount > 0 && (
              <span style={{
                marginLeft: "6px", background: "var(--danger)", color: "white",
                borderRadius: "99px", fontSize: "0.65rem", fontWeight: "800",
                padding: "2px 7px", display: "inline-block", animation: "pulse-dot 2s infinite",
              }}>
                {pendingAcceptanceCount} NEW
              </span>
            )}
          </button>
          <button className={`tab ${tab === "my-tasks" ? "active" : ""}`} onClick={() => setTab("my-tasks")}>
            📂 My Cases ({myTasks.length})
          </button>
        </div>

        {/* ── Available Requests ── */}
        <AnimatePresence mode="wait">
          {tab === "available" && (
            <motion.div
              key="available"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <span className="spinner spinner-dark" style={{ width: "28px", height: "28px" }} />
                </div>
              ) : enrichedRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">🙌</span>
                  <h3>All caught up!</h3>
                  <p>No pending requests matching your skills right now.</p>
                </div>
              ) : (
                enrichedRequests.map((req, i) => {
                  const ust = urgencyStyle[req.urgency] || urgencyStyle.MEDIUM;
                  const isAiMatched = req.status === "pending_acceptance";
                  return (
                    <motion.div
                      key={req.id}
                      className="request-card"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      style={isAiMatched ? { borderColor: "var(--primary)", borderWidth: "2px" } : {}}
                    >
                      {/* AI Matched Banner */}
                      {isAiMatched && (
                        <div style={{
                          background: "var(--grad-primary)", color: "white",
                          fontSize: "0.72rem", fontWeight: "700", padding: "6px 14px",
                          margin: "-16px -16px 14px -16px",
                          display: "flex", alignItems: "center", gap: "8px",
                          borderRadius: "12px 12px 0 0",
                        }}>
                          <span style={{ animation: "pulse-dot 2s infinite", width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "inline-block" }} />
                          🎯 AI Auto-Matched — You are the best fit for this mission
                        </div>
                      )}

                      <div className="request-card-header">
                        <div className="request-card-title">{req.summary}</div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                          <MatchScoreBadge score={req.matchScore} />
                          <span style={{
                            background: ust.bg, color: ust.color,
                            border: `1px solid ${ust.border}`,
                            padding: "3px 10px", borderRadius: "99px",
                            fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em"
                          }}>{req.urgency}</span>
                        </div>
                      </div>

                      {/* AI Brief */}
                      <div style={{
                        background: "var(--primary-light)", padding: "14px 16px", borderRadius: "10px",
                        marginBottom: "14px", border: "1px solid rgba(99,102,241,0.12)",
                      }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                          AI Incident Brief
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.6 }}>
                          {req.severityExplanation}
                        </p>
                        {req.requiredSupplies?.length > 0 && (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>Bring:</span>
                            {req.requiredSupplies.map(s => (
                              <span key={s} className="chip" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="request-card-meta">
                        <span>📍 {req.area}</span>
                        <span>📂 {req.category}</span>
                        <span>⏱ {req.estimatedTime}</span>
                      </div>

                      <div className="request-card-actions">
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => acceptTask(req)}
                          disabled={!isAvailable}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isAiMatched ? "✅ Accept Matched Mission" : "Accept Mission"}
                        </motion.button>
                        {isAiMatched && (
                          <motion.button
                            className="btn btn-secondary"
                            onClick={() => declineTask(req)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                          >
                            Decline
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ── My Tasks ── */}
          {tab === "my-tasks" && (
            <motion.div
              key="my-tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {myTasks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📋</span>
                  <h3>No active cases</h3>
                  <p>Accept a request to see your active missions here.</p>
                </div>
              ) : (
                myTasks.map((req, i) => (
                  <motion.div
                    key={req.id}
                    className="request-card"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    style={{
                      borderColor: req.status === "completed" ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.2)",
                    }}
                  >
                    <div className="request-card-header">
                      <div className="request-card-title">{req.summary}</div>
                      <span style={{
                        padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem",
                        fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em",
                        background: req.status === "completed" ? "var(--success-bg)" : req.status === "inprogress" ? "var(--warning-bg)" : "var(--info-bg)",
                        color: req.status === "completed" ? "var(--success-dark)" : req.status === "inprogress" ? "var(--warning-dark)" : "var(--info-dark)",
                        border: `1px solid ${req.status === "completed" ? "var(--success-border)" : req.status === "inprogress" ? "var(--warning-border)" : "var(--info-border)"}`,
                      }}>
                        {req.status}
                      </span>
                    </div>

                    {/* Beneficiary info */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: "12px", marginBottom: "16px", paddingBottom: "16px",
                      borderBottom: "1px dashed var(--border)",
                    }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Beneficiary</div>
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{req.userName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Location</div>
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{req.area}</div>
                      </div>
                      {req.userPhone && (
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Contact</div>
                          <a href={`tel:${req.userPhone}`} style={{ fontWeight: "600", color: "var(--primary)", textDecoration: "none", fontSize: "0.9rem" }}>
                            {req.userPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* AI Action Plan */}
                    <div style={{
                      background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(139,92,246,0.05) 100%)",
                      padding: "18px 20px", borderRadius: "12px", marginBottom: "18px",
                      border: "1px solid rgba(99,102,241,0.15)",
                    }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--primary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        🧠 AI Action Plan
                      </div>
                      <ul className="ai-list">
                        {req.actionPlan?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        )) || <li>Contact the user to ascertain needs.</li>}
                      </ul>
                    </div>

                    {/* DYNAMIC ROUTINE ENGINE OVERLAY */}
                    {req.status !== "completed" && req.location && userData?.location && (
                      <MissionRouteMap volunteerLocation={userData.location} incidentLocation={req.location} />
                    )}

                    <div className="request-card-actions">
                      {req.status === "pending_acceptance" && (
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => updateStatus(req, "inprogress")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          📍 Accept Auto-Matched Mission
                        </motion.button>
                      )}
                      {req.status === "assigned" && (
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => updateStatus(req, "inprogress")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🚗 Start Mission
                        </motion.button>
                      )}
                      {req.status === "inprogress" && (
                        <motion.button
                          className="btn btn-success"
                          onClick={() => updateStatus(req, "completed")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          ✅ Mark Completed
                        </motion.button>
                      )}
                      {req.status === "completed" && (
                        <span style={{ fontWeight: "700", color: "var(--success)", fontSize: "0.95rem" }}>
                          ✅ Case Closed Successfully
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

