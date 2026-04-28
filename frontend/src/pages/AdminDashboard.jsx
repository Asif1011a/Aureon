import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { generateMatchingSuggestion } from "../utils/gemini";
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
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
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
  };

  const filtered = requests.filter(r => {
    if (filterUrgency !== "all" && r.urgency !== filterUrgency) return false;
    return true;
  });

  async function handleAIMatch(req) {
    setSelectedReq(req);
    setMatchResult(null);
    setMatching(true);
    try {
      const availableVols = volunteers.filter(v => v.isAvailable);
      const result = await generateMatchingSuggestion(req, availableVols);
      setMatchResult(result);
    } catch (err) {
      toast.error("Matching failed");
    } finally {
      setMatching(false);
    }
  }

  async function assignVolunteer(req, volunteerId) {
    const vol = volunteers.find(v => v.id === volunteerId);
    if (!vol) return;
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "assigned",
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: vol.name,
        assignedVolunteerPhone: vol.phone || "",
        updatedAt: serverTimestamp(),
      });
      toast.success(`Assigned to ${vol.name}! Case updated.`);
      setSelectedReq(null);
      setMatchResult(null);
    } catch (err) {
      toast.error("Assignment failed");
    }
  }

  const mapRequests = requests.filter(r => r.location?.lat && r.location?.lng);
  const heatPoints = mapRequests.map(r => [
    r.location.lat,
    r.location.lng,
    urgencyIntensity[r.urgency] || 0.5
  ]);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1200px" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>Operations Command Center</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Aureon Real-Time Telemetry & Dispatch
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Incidents</div>
          </div>
          <div className="stat-card" style={{ borderColor: stats.emergency > 0 ? "var(--danger)" : "var(--border)" }}>
            <div className="stat-value" style={{ color: stats.emergency > 0 ? "var(--danger)" : "var(--primary)" }}>
              {stats.emergency}
            </div>
            <div className="stat-label">🚨 Critical Priority</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Action</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
            <div className="stat-label">Resolution Rate</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "map" ? "active" : ""}`} onClick={() => setTab("map")}>🔥 Heatmap Visualization</button>
          <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>📋 Incident Logs</button>
          <button className={`tab ${tab === "volunteers" ? "active" : ""}`} onClick={() => setTab("volunteers")}>🙋 Active Roster ({stats.availableVols})</button>
        </div>

        {tab === "overview" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <select className="form-select" style={{ maxWidth: "200px" }} value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="EMERGENCY">🚨 Critical Phase</option>
                <option value="HIGH">🔴 High Priority</option>
                <option value="MEDIUM">🟡 Standard</option>
                <option value="LOW">🟢 Low Priority</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No operational incidents</h3>
              </div>
            ) : filtered.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-card-header">
                  <div className="request-card-title">{req.summary}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                    <span className={`badge badge-${req.status}`}>{req.status.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ background: "var(--bg)", padding: "16px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>Telemetry Details</div>
                    <p>👤 {req.userName}</p>
                    <p>📍 {req.area}</p>
                    {req.userPhone && <p>📞 {req.userPhone}</p>}
                  </div>
                  <div style={{ background: "var(--bg)", padding: "16px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>System Inference</div>
                    <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>{req.severityExplanation}</p>
                    <p style={{ fontSize: "0.9rem", marginTop: "8px", fontWeight: "600", color: "var(--primary-dark)" }}>Resource Parameters: {req.requiredSkills?.join(", ") || "General Personnel"}</p>
                  </div>
                </div>

                <div className="request-card-actions">
                  {req.status === "pending" && (
                    <button className="btn btn-primary" onClick={() => handleAIMatch(req)} disabled={matching}>
                      {matching ? "Analyzing Resources..." : "⚡ Execute Smart Routing"}
                    </button>
                  )}
                  {req.assignedVolunteerName && (
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text)", padding: "10px 0" }}>
                      ✓ Vector confirmed to Node: {req.assignedVolunteerName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(selectedReq || matching) && (
          <div style={{
            position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
            background: "rgba(0,0,0,0.6)", zIndex: 1000, backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }} className="animate-fade-in">
            <div style={{
              background: "var(--bg-card)", padding: "30px", borderRadius: "var(--radius)",
              width: "90%", maxWidth: "550px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--primary-dark)" }}>System Dispatch Vectoring</h3>
                <button onClick={() => { setSelectedReq(null); setMatchResult(null); }} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
              </div>

              {matching ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <span className="spinner" style={{ width: "40px", height: "40px", borderColor: "var(--primary) transparent transparent transparent" }} />
                  <p style={{ color: "var(--text-muted)", marginTop: "16px", fontWeight: "500" }}>Calculating optimal telemetry and node availability...</p>
                </div>
              ) : matchResult ? (
                <div>
                  <div style={{ background: "var(--primary-light)", padding: "16px", borderRadius: "8px", marginBottom: "20px", borderLeft: "4px solid var(--primary)" }}>
                    <p style={{ color: "var(--primary-dark)", fontSize: "0.95rem", fontWeight: "600" }}>{matchResult.assignmentNote}</p>
                  </div>
                  
                  {matchResult.topMatches?.map((m, i) => {
                    const vol = volunteers.find(v => v.id === m.volunteerId || v.uid === m.volunteerId);
                    if (!vol) return null;
                    return (
                      <div key={m.volunteerId} style={{
                        border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "12px",
                        display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card2)"
                      }}>
                        <div>
                          <p style={{ fontWeight: "700", fontSize: "1.1rem" }}>{vol.name}</p>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{m.reason}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--success)" }}>Score: {m.matchScore}</div>
                          <button className="btn btn-primary btn-sm" style={{ marginTop: "8px" }} onClick={() => assignVolunteer(selectedReq, vol.id)}>
                            Deploy Node
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {tab === "map" && (
          <div>
            <div className="card" style={{ padding: "0", overflow: "hidden", border: "2px solid var(--border)" }}>
              <div style={{ padding: "16px", background: "var(--bg-card2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", background: "red", borderRadius: "50%" }}></span> 
                  Real-Time Crisis Heatmap
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Coimbatore Sector</span>
              </div>
              <div style={{ height: "600px", width: "100%" }}>
                <MapContainer center={[11.0168, 76.9558]} zoom={12} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  
                  {/* Heatmap Layer */}
                  <HeatmapLayer points={heatPoints} />

                  {/* Individual Markers beneath the heat blur */}
                  {mapRequests.map(req => (
                    <Marker key={req.id} position={[req.location.lat, req.location.lng]} icon={urgencyIcon(req.urgency)}>
                      <Popup>
                        <div style={{ fontFamily: "Inter, sans-serif" }}>
                          <strong style={{ fontSize: "1rem" }}>{req.summary}</strong>
                          <p style={{ margin: "4px 0", color: "#64748b" }}>Status: {req.status}</p>
                          <p style={{ margin: 0, fontWeight: "600", color: urgencyColors[req.urgency] }}>{req.urgency}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "volunteers" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {volunteers.map(vol => (
              <div key={vol.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>{vol.name}</h3>
                  <span className={`badge ${vol.isAvailable ? "badge-success" : "badge-pending"}`}>
                    {vol.isAvailable ? "Operational" : "Offline"}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📞 {vol.phone}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📍 {vol.address || "Coimbatore"}</p>
                <div className="chip-list" style={{ marginTop: "16px" }}>
                  {vol.skills?.map(s => <span key={s} className="chip">{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
