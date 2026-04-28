import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";

const STATUS_STEPS = [
  { key: "pending", label: "Request Submitted", icon: "📋", desc: "Your case is logged and AI is matching a volunteer." },
  { key: "pending_acceptance", label: "Volunteer Notified", icon: "🎯", desc: "AI matched a volunteer — awaiting their confirmation." },
  { key: "assigned", label: "Volunteer Assigned", icon: "🙋", desc: "A responder has confirmed and is reviewing the AI Action Plan." },
  { key: "inprogress", label: "Help On The Way", icon: "🚗", desc: "Responder is executing the plan." },
  { key: "completed", label: "Completed", icon: "✅", desc: "Case resolved." },
];

function getStepIndex(status) {
  const map = { pending: 0, pending_acceptance: 1, assigned: 2, inprogress: 3, completed: 4 };
  return map[status] ?? 0;
}

// SIMULATED GPS TRACKER
function LiveGPSTracker() {
  const [distance, setDistance] = useState(2.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setDistance(prev => {
        if (prev <= 0.1) return 0;
        return Number((prev - 0.1).toFixed(1));
      });
    }, 4000); // Decrement every 4 seconds for demo
    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.max(0, 100 - (distance / 2.8) * 100);

  return (
    <div style={{ background: "var(--bg-card2)", borderRadius: "var(--radius-sm)", padding: "20px", marginTop: "24px", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--success)", borderRadius: "50%", animation: "pulse-dot 2s infinite" }}></span>
            Live GPS Tracking
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>Responder is en route.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text)" }}>{distance} km</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Est. {Math.max(1, Math.round(distance * 3))} mins</div>
        </div>
      </div>
      
      {/* Route Line */}
      <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0,
          width: `${progressPercent}%`, background: "var(--info)", transition: "width 1s linear"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "8px" }}>
        <span>Responder Start</span>
        <span>Destination</span>
      </div>
    </div>
  );
}

export default function RequestStatus() {
  const { user } = useApp();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "requests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1000px" }}>
        
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Citizen Portal</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "1rem" }}>Track active rescue deployments in real-time.</p>
          </div>
          <Link to="/submit" className="btn btn-primary" style={{ borderRadius: "var(--radius-sm)" }}>+ New Deployment</Link>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Deployments Active</h3>
            <p style={{ color: "var(--text-muted", fontSize: "0.9rem" }}>You have not reported any incidents to the network.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
            
            {/* List */}
            <div>
              {requests.map(req => {
                const stepIdx = getStepIndex(req.status);
                return (
                  <div
                    key={req.id}
                    className="request-card"
                    onClick={() => setSelected(selected?.id === req.id ? null : req)}
                    style={{ 
                      borderColor: selected?.id === req.id ? "var(--border-focus)" : "var(--border)",
                      cursor: "pointer",
                      padding: "20px"
                    }}
                  >
                    <div className="request-card-header" style={{ marginBottom: "12px" }}>
                      <div className="request-card-title" style={{ fontSize: "1rem" }}>{req.summary}</div>
                      <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                    </div>

                    <div className="request-card-meta" style={{ marginTop: "12px", paddingTop: "12px" }}>
                      <span style={{ fontWeight: "500", color: "var(--text)" }}>STATUS: {req.status.toUpperCase()}</span>
                      <span>📍 {req.area}</span>
                    </div>

                    <div style={{ marginTop: "16px", background: "var(--bg-hover)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${((stepIdx + 1) / STATUS_STEPS.length) * 100}%`,
                        background: "var(--text)",
                        transition: "width 0.5s ease"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Details */}
            {selected && (
              <div className="card animate-fade-in" style={{ position: "sticky", top: "100px", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                  Incident File: #{selected.id.slice(0,8).toUpperCase()}
                </h3>

                <div style={{ background: "var(--bg)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "24px" }}>
                  <p style={{ fontStyle: "italic", color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem" }}>"{selected.text}"</p>
                  <p style={{ fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>AI Severity Inference</p>
                  <p style={{ fontSize: "0.95rem", color: "var(--text)" }}>{selected.severityExplanation}</p>
                </div>

                <div className="status-timeline" style={{ marginBottom: "24px" }}>
                  {STATUS_STEPS.map((step, i) => {
                    const currentStep = getStepIndex(selected.status);
                    let dotClass = "pending";
                    if (i < currentStep) dotClass = "done";
                    else if (i === currentStep) dotClass = "active";
                    return (
                      <div key={step.key} className="status-step">
                        <div className={`status-dot ${dotClass}`} />
                        <div className="status-content">
                          <h4 style={{ color: i <= currentStep ? "var(--text)" : "var(--text-faint)" }}>{step.label}</h4>
                          <p style={{ fontSize: "0.85rem", color: i <= currentStep ? "var(--text-muted)" : "var(--text-faint)" }}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated GPS Tracker automatically appears when Volunteer is traveling */}
                {selected.status === 'inprogress' && <LiveGPSTracker />}

                {selected.assignedVolunteerName && (
                  <div style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)", borderRadius: "var(--radius-sm)", padding: "16px", marginTop: "24px" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--info)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Dispatched Node</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text)" }}>{selected.assignedVolunteerName}</div>
                    {selected.assignedVolunteerPhone && (
                      <a href={`tel:${selected.assignedVolunteerPhone}`} style={{ color: "var(--info)", fontWeight: "500", display: "inline-block", marginTop: "8px", textDecoration: "none" }}>
                        Call Node: {selected.assignedVolunteerPhone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
