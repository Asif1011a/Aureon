import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function VolunteerDashboard() {
  const { user, userData } = useApp();
  const [tab, setTab] = useState("available");
  const [requests, setRequests] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(userData?.isAvailable ?? true);

  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const skills = userData?.skills || [];
      const filtered = skills.length === 0
        ? all
        : all.filter(r => !r.requiredSkills?.length || r.requiredSkills.some(s => skills.includes(s)));
      setRequests(filtered);
      setLoading(false);
    });
    return unsub;
  }, [userData]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "requests"),
      where("assignedVolunteerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setMyTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function acceptTask(req) {
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "assigned",
        assignedVolunteerId: user.uid,
        assignedVolunteerName: userData?.name || "Volunteer",
        assignedVolunteerPhone: userData?.phone || "",
        updatedAt: serverTimestamp(),
      });
      toast.success("Task accepted! Review the AI Action Plan.");
      setTab("my-tasks");
    } catch (err) {
      toast.error("Failed to accept task");
    }
  }

  async function updateStatus(req, newStatus) {
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Task status: ${newStatus}`);
    } catch (err) {
      toast.error("Update failed");
    }
  }

  async function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await updateDoc(doc(db, "users", user.uid), { isAvailable: next });
      toast.success(next ? "You are now available" : "You are marked busy");
    } catch {}
  }

  const urgencyOrder = { EMERGENCY: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedRequests = [...requests].sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>Volunteer Portal</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "1.05rem" }}>
              Welcome, {userData?.name || "Ready to help!"}
            </p>
          </div>
          <button
            id="availability-toggle"
            className={`btn ${isAvailable ? "btn-success" : "btn-secondary"}`}
            style={{ borderRadius: "999px" }}
            onClick={toggleAvailability}
          >
            {isAvailable ? "🟢 Available" : "⭕ Busy"}
          </button>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "available" ? "active" : ""}`} onClick={() => setTab("available")}>
            New Requests ({sortedRequests.length})
          </button>
          <button className={`tab ${tab === "my-tasks" ? "active" : ""}`} onClick={() => setTab("my-tasks")}>
            My Active Tasks ({myTasks.length})
          </button>
        </div>

        {tab === "available" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}><span className="spinner" /></div>
            ) : sortedRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🙌</div>
                <h3>No pending requests</h3>
                <p>You have caught up with all matches in your area.</p>
              </div>
            ) : sortedRequests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-card-header">
                  <div className="request-card-title">{req.summary}</div>
                  <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                </div>
                
                <div style={{ background: "var(--bg-card2)", padding: "16px", borderRadius: "8px", marginTop: "12px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>AI Incident Brief</div>
                  <p style={{ fontSize: "0.95rem", marginBottom: "8px" }}>{req.severityExplanation}</p>
                  
                  {req.requiredSupplies?.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Bring:</span>
                      <div className="chip-list">
                        {req.requiredSupplies.map(s => <span key={s} className="chip">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-card-meta">
                  <span>📍 {req.area}</span>
                  <span>📂 {req.category}</span>
                  <span>⏱ {req.estimatedTime}</span>
                </div>
                
                <div className="request-card-actions">
                  <button className="btn btn-primary" onClick={() => acceptTask(req)} disabled={!isAvailable}>
                    Accept Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "my-tasks" && (
          <div>
            {myTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No active cases</h3>
                <p>Accept a request to see your case files here.</p>
              </div>
            ) : myTasks.map(req => (
              <div key={req.id} className="request-card" style={{ borderColor: req.status === "completed" ? "var(--success)" : "var(--primary)" }}>
                <div className="request-card-header">
                  <div className="request-card-title">{req.summary}</div>
                  <span className={`badge badge-${req.status}`}>{req.status.toUpperCase()}</span>
                </div>

                <div style={{ display: "flex", gap: "16px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px dashed var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Beneficiary Name</div>
                    <div style={{ fontWeight: "600" }}>{req.userName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Location</div>
                    <div style={{ fontWeight: "600" }}>{req.area}</div>
                  </div>
                  {req.userPhone && (
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Contact</div>
                      <a href={`tel:${req.userPhone}`} style={{ fontWeight: "600", color: "var(--primary)" }}>{req.userPhone}</a>
                    </div>
                  )}
                </div>

                <div style={{ background: "var(--primary-light)", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--primary-dark)", marginBottom: "12px", textTransform: "uppercase" }}>📋 AI Action Plan</div>
                  <ul style={{ listStylePosition: "inside", padding: 0, margin: 0, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
                    {req.actionPlan?.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>{step}</li>
                    )) || <li>Contact the user to ascertain needs.</li>}
                  </ul>
                </div>

                <div className="request-card-actions">
                  {req.status === "assigned" && (
                    <button className="btn btn-primary" onClick={() => updateStatus(req, "inprogress")}>
                      Start Journey
                    </button>
                  )}
                  {req.status === "inprogress" && (
                    <button className="btn btn-success" onClick={() => updateStatus(req, "completed")}>
                      Mark as Completed
                    </button>
                  )}
                  {req.status === "completed" && (
                    <span style={{ fontWeight: "700", color: "var(--success)" }}>✅ Case Closed Successfully</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
