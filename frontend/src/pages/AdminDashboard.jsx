import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { getTopMatches } from "../utils/aiMatching";
import toast from "react-hot-toast";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const urgencyColors = {
  EMERGENCY: "#dc2626", // Danger red
  HIGH: "#ca8a04",    // Warning orange
  MEDIUM: "#0ea5e9",  // Blue
  LOW: "#16a34a",     // Green
};

const urgencyIntensity = {
  EMERGENCY: 1.0,
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.2,
};

function urgencyIcon(urgency) {
  const color = urgencyColors[urgency] || "#1d4ed8";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Custom Heatmap Component for React-Leaflet
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 12,
      max: 1.0,
      gradient: {
        0.3: '#0ea5e9', // Blue
        0.5: '#16a34a', // Green
        0.7: '#ca8a04', // Orange
        1.0: '#dc2626'  // Red
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [selectedReq, setSelectedReq] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [matching, setMatching] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "volunteer"));
    const unsub = onSnapshot(q, snap => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    emergency: requests.filter(r => r.urgency === "EMERGENCY").length,
    completed: requests.filter(r => r.status === "completed").length,
    availableVols: volunteers.filter(v => v.isAvailable).length,
    totalVols: volunteers.length,
  };

  const filtered = requests.filter(r => filterUrgency === "all" || r.urgency === filterUrgency);

  async function handleAIMatch(req) {
    setSelectedReq(req);
    setMatchResults([]);
    setMatching(true);
    try {
      // Use the local AI matching engine
      const topMatches = getTopMatches(volunteers, req, 5);
      setMatchResults(topMatches);
    } catch (err) {
      toast.error("Matching failed");
    } finally {
      setMatching(false);
    }
  }

  async function assignVolunteer(req, volunteerId) {
    const vol = volunteers.find(v => v.id === volunteerId || v.uid === volunteerId);
    if (!vol) return;
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "assigned",
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: vol.name,
        assignedVolunteerPhone: vol.phone || "",
        updatedAt: serverTimestamp(),
      });
      toast.success(`Assigned to ${vol.name}!`);
      setSelectedReq(null);
      setMatchResults([]);
    } catch (err) {
      toast.error("Assignment failed");
    }
  }

  const mapRequests = requests.filter(r => r.location?.lat && r.location?.lng);
  const heatPoints = mapRequests.map(r => [r.location.lat, r.location.lng, urgencyIntensity[r.urgency] || 0.5]);

  const scoreColor = (s) => s >= 80 ? "var(--success)" : s >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1200px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "28px" }}
        >
          <span className="section-badge" style={{ marginBottom: "8px" }}>⚡ Command Center</span>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.04em" }}>Operations Dashboard</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.95rem" }}>
            Real-Time Telemetry &amp; AI Dispatch System
          </p>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { value: stats.total,        label: "Total Incidents",  icon: "📋", delay: 0,    danger: false },
            { value: stats.emergency,    label: "🚨 Critical",      icon: "🔴", delay: 0.05, danger: stats.emergency > 0 },
            { value: stats.pending,      label: "Pending Action",   icon: "⏳", delay: 0.1,  danger: false },
            { value: stats.availableVols,label: "Available Vols",   icon: "🙋", delay: 0.15, danger: false },
            { value: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0, label: "Resolution %", icon: "📈", delay: 0.2, danger: false },
          ].map(s => (
            <motion.div
              key={s.label}
              className="stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: s.delay }}
              style={s.danger ? { borderColor: "rgba(239,68,68,0.3)" } : {}}
            >
              <div className="stat-icon" style={{ background: s.danger ? "var(--danger-bg)" : "var(--primary-light)", color: s.danger ? "var(--danger)" : "var(--primary)" }}>
                {s.icon}
              </div>
              <div className="stat-value" style={s.danger ? { color: "var(--danger)" } : {}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
            📋 Incident Logs
          </button>
          <button className={`tab ${tab === "map" ? "active" : ""}`} onClick={() => setTab("map")}>
            🔥 Crisis Heatmap
          </button>
          <button className={`tab ${tab === "volunteers" ? "active" : ""}`} onClick={() => setTab("volunteers")}>
            🙋 Active Roster ({stats.availableVols}/{stats.totalVols})
          </button>
        </div>

        {/* ── Incident Logs ── */}
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  className="form-select"
                  style={{ maxWidth: "220px" }}
                  value={filterUrgency}
                  onChange={e => setFilterUrgency(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="EMERGENCY">🚨 Critical / Emergency</option>
                  <option value="HIGH">🔴 High Priority</option>
                  <option value="MEDIUM">🟡 Standard</option>
                  <option value="LOW">🟢 Low Priority</option>
                </select>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Showing {filtered.length} of {requests.length} incidents
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📭</span>
                  <h3>No incidents found</h3>
                </div>
              ) : (
                filtered.map((req, i) => (
                  <motion.div
                    key={req.id}
                    className="request-card"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                  >
                    <div className="request-card-header">
                      <div className="request-card-title">{req.summary}</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                        <span className={`badge badge-${req.status}`}>{req.status.toUpperCase()}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                      <div style={{ background: "var(--bg-hover)", padding: "14px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                          Telemetry Details
                        </div>
                        <p style={{ fontSize: "0.88rem" }}>👤 {req.userName}</p>
                        <p style={{ fontSize: "0.88rem" }}>📍 {req.area}</p>
                        {req.userPhone && <p style={{ fontSize: "0.88rem" }}>📞 {req.userPhone}</p>}
                      </div>
                      <div style={{ background: "var(--bg-hover)", padding: "14px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                          System Inference
                        </div>
                        <p style={{ fontSize: "0.88rem", color: "var(--text)" }}>{req.severityExplanation}</p>
                        {req.requiredSkills?.length > 0 && (
                          <p style={{ fontSize: "0.82rem", marginTop: "6px", fontWeight: "600", color: "var(--primary)" }}>
                            Skills: {req.requiredSkills.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="request-card-actions">
                      {req.status === "pending" && (
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => handleAIMatch(req)}
                          disabled={matching}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {matching && selectedReq?.id === req.id
                            ? <><span className="spinner" /> Analyzing...</>
                            : "⚡ AI Smart Match"}
                        </motion.button>
                      )}
                      {req.assignedVolunteerName && (
                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--success-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
                          ✓ Dispatched to {req.assignedVolunteerName}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ── Heatmap ── */}
          {tab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="card" style={{ padding: "0", overflow: "hidden", border: "1.5px solid var(--border)" }}>
                <div style={{
                  padding: "14px 20px", background: "var(--bg-hover)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--danger)", borderRadius: "50%" }} />
                    Real-Time Crisis Heatmap
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Coimbatore Sector — {mapRequests.length} incidents</span>
                </div>
                <div style={{ height: "600px", width: "100%" }}>
                  <MapContainer center={[11.0168, 76.9558]} zoom={12} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution="&copy; OpenStreetMap"
                    />
                    <HeatmapLayer points={heatPoints} />
                    {mapRequests.map(req => (
                      <Marker key={req.id} position={[req.location.lat, req.location.lng]} icon={urgencyIcon(req.urgency)}>
                        <Popup>
                          <div style={{ fontFamily: "Inter, sans-serif" }}>
                            <strong style={{ fontSize: "0.9rem" }}>{req.summary}</strong>
                            <p style={{ margin: "4px 0", color: "#64748b", fontSize: "0.8rem" }}>Status: {req.status}</p>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "0.8rem", color: urgencyColors[req.urgency] }}>{req.urgency}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Volunteer Roster ── */}
          {tab === "volunteers" && (
            <motion.div
              key="volunteers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {volunteers.map((vol, i) => (
                  <motion.div
                    key={vol.id}
                    className="vol-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div className="vol-avatar">{(vol.name || "V")[0].toUpperCase()}</div>
                        <div>
                          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>{vol.name}</h3>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                            {vol.tasksCompleted ?? 0} missions · ⭐ {vol.rating ?? 5.0}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: "700",
                        background: vol.isAvailable ? "var(--success-bg)" : "var(--bg-hover)",
                        color: vol.isAvailable ? "var(--success-dark)" : "var(--text-muted)",
                        border: `1px solid ${vol.isAvailable ? "var(--success-border)" : "var(--border)"}`,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {vol.isAvailable ? "✓ Ready" : "Busy"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {vol.skills?.slice(0, 4).map(s => (
                        <span key={s} className="chip" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>{s}</span>
                      ))}
                    </div>

                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>📍 {vol.address || "Coimbatore"}</p>
                    {vol.phone && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>📞 {vol.phone}</p>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Match Modal ── */}
        <AnimatePresence>
          {(selectedReq || matching) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(15,23,42,0.6)",
                zIndex: 1000, backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px",
              }}
              onClick={(e) => { if (e.target === e.currentTarget) { setSelectedReq(null); setMatchResults([]); } }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                  width: "100%", maxWidth: "560px",
                  boxShadow: "var(--shadow-xl)",
                  overflow: "hidden",
                }}
              >
                {/* Modal Header */}
                <div style={{
                  background: "var(--grad-primary)", padding: "20px 24px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "white" }}>🧠 AI Matching Engine</h3>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", marginTop: "2px" }}>
                      {selectedReq?.summary?.slice(0, 60)}...
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedReq(null); setMatchResults([]); }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: "24px" }}>
                  {matching ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid var(--primary-light)", borderTopColor: "var(--primary)", animation: "spin 0.7s linear infinite", margin: "0 auto 20px" }} />
                      <p style={{ color: "var(--text-muted)", fontWeight: "500" }}>
                        Analyzing volunteer profiles…
                      </p>
                    </div>
                  ) : matchResults.length === 0 ? (
                    <div className="empty-state" style={{ border: "none" }}>
                      <span className="empty-state-icon">🙋</span>
                      <h3>No volunteers available</h3>
                      <p>All volunteers are currently busy.</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", fontWeight: "500" }}>
                        Top {matchResults.length} matches ranked by AI composite score
                      </p>
                      {matchResults.map((m, i) => (
                        <motion.div
                          key={m.volunteerId}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.07 }}
                          style={{
                            border: `1.5px solid ${i === 0 ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                            borderRadius: "12px", padding: "16px",
                            marginBottom: "10px",
                            background: i === 0 ? "var(--primary-light)" : "var(--bg-hover)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: "40px", height: "40px", borderRadius: "50%",
                              background: i === 0 ? "var(--grad-primary)" : "var(--bg-card2)",
                              color: i === 0 ? "white" : "var(--text)",
                              fontWeight: "700", fontSize: "1rem",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: i === 0 ? "var(--shadow-primary)" : "none",
                            }}>
                              {i === 0 ? "🏆" : (m.volunteer.name || "V")[0]}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: "700", fontSize: "0.95rem" }}>{m.volunteer.name}</p>
                              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {m.reason}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: "900", color: scoreColor(m.matchScore), letterSpacing: "-0.05em" }}>
                              {m.matchScore}
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: "6px" }}
                              onClick={() => assignVolunteer(selectedReq, m.volunteerId)}
                            >
                              Deploy
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
