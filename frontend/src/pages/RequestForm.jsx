import React, { useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { classifyRequest } from "../utils/gemini";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Medical", "Food", "Shelter", "Education", "Elder Care", "Disability Support", "Mental Health", "Other"];

// Coimbatore area coordinates
const COIMBATORE_AREAS = {
  "RS Puram": [11.0120, 76.9516],
  "Gandhipuram": [11.0168, 76.9558],
  "Peelamedu": [11.0287, 77.0007],
  "Saibaba Colony": [11.0254, 76.9458],
  "Singanallur": [11.0021, 77.0211],
  "Ukkadam": [10.9892, 76.9718],
  "Vadavalli": [11.0103, 76.9004],
  "Kuniyamuthur": [10.9660, 76.9558],
  "Thudiyalur": [11.0762, 76.9789],
  "Other": [11.0168, 76.9558],
};

export default function RequestForm() {
  const { user, userData } = useApp();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("Gandhipuram");
  const [aiResult, setAiResult] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice telemetry not supported in this browser"); return; }
    const recog = new SpeechRecognition();
    recog.lang = "ta-IN"; // Tamil first
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onstart = () => setRecording(true);
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => prev ? prev + " " + transcript : transcript);
      toast.success("Voice transcript captured. Proceed with analysis.");
    };
    recog.onerror = () => {
      setRecording(false);
      recog.lang = "en-IN"; // Fallback to English
      toast.error("Telemetry failed. Please input text manually.");
    };
    recog.onend = () => setRecording(false);
    recognitionRef.current = recog;
    recog.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function handleClassify() {
    if (!text.trim()) { toast.error("Please input distress signals first"); return; }
    setClassifying(true);
    setAiResult(null);
    try {
      const result = await classifyRequest(text);
      setAiResult(result);
      if (result.category) setCategory(result.category);
      toast.success("Incident Analysis Complete.");
    } catch (err) {
      toast.error("Analysis sequence failed. Try again.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) { toast.error("Please input distress signals"); return; }
    if (!aiResult) { toast.error("Execute analysis sequence before submission"); return; }

    setSubmitting(true);
    try {
      const coords = COIMBATORE_AREAS[area] || COIMBATORE_AREAS["Other"];
      await addDoc(collection(db, "requests"), {
        userId: user.uid,
        userName: userData?.name || "Anonymous",
        userPhone: userData?.phone || "",
        text,
        category: aiResult.category || category,
        urgency: aiResult.urgency,
        summary: aiResult.summary,
        actionPlan: aiResult.actionPlan || [],
        requiredSupplies: aiResult.requiredSupplies || [],
        requiredSkills: aiResult.requiredSkills || [],
        estimatedTime: aiResult.estimatedTime || "Unknown",
        severityExplanation: aiResult.severityExplanation || "",
        area,
        location: { lat: coords[0], lng: coords[1] },
        status: "pending",
        assignedVolunteerId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Signal broadcasted. Connecting with responder networks...");
      navigate("/status");
    } catch (err) {
      toast.error("Broadcast failed. Ensure authentication is valid.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "720px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary-dark)" }}>Incident Reporting Interface</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "1.05rem" }}>
            Input details below. System intelligence will construct an operational brief.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className="card" style={{ marginBottom: "24px", borderColor: "var(--primary-light)" }}>
            <label className="form-label">1. Primary Distress Parameters (Tamil/English)</label>
            <button
              id="voice-btn"
              type="button"
              className={`voice-btn ${recording ? "recording" : ""}`}
              onClick={recording ? stopVoice : startVoice}
              style={{ marginBottom: "16px" }}
            >
              {recording ? "🔴 Capturing Telemetry... Tap to Stop" : "🎤 Engage Voice Capture"}
            </button>

            <textarea
              id="request-text"
              className="form-textarea"
              placeholder="E.g. 'There is a stray dog that is badly injured near Gandhipuram bus stand...'"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div className="card" style={{ padding: "16px" }}>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>Zone Identifier</label>
              <select id="area-select" className="form-select" value={area} onChange={e => setArea(e.target.value)} style={{ padding: "10px" }}>
                {Object.keys(COIMBATORE_AREAS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="card" style={{ padding: "16px" }}>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>Classification Protocol</label>
              <select id="category-select" className="form-select" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: "10px" }}>
                <option value="">— Automated Inference —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button
            id="analyze-btn"
            type="button"
            className="btn btn-secondary btn-full btn-lg"
            onClick={handleClassify}
            disabled={classifying || !text.trim()}
            style={{ marginBottom: "24px" }}
          >
            {classifying ? <><span className="spinner" /> Synthesizing Operational Report...</> : "⛑ Execute Incident Analysis"}
          </button>

          {/* SMART AI REPORT VIEW */}
          {aiResult && (
            <div className="ai-result animate-fade-in">
              <div className="ai-header">
                <span style={{ fontSize: "1.4rem" }}>📄</span>
                <span className="ai-header-title">Operational Incident Brief</span>
                <span style={{ marginLeft: "auto" }}>
                  <span className={`badge badge-${aiResult.urgency?.toLowerCase()}`}>
                    {aiResult.urgency} PRIORITY
                  </span>
                </span>
              </div>
              
              <div className="ai-body">
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text)" }}>
                    "{aiResult.summary}"
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {aiResult.severityExplanation}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
                  
                  <div className="ai-section" style={{ margin: 0 }}>
                    <div className="ai-section-title">📋 Responder Directives</div>
                    <ul className="ai-list">
                      {aiResult.actionPlan?.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg)", padding: "16px", borderRadius: "var(--radius-sm)" }}>
                    <div>
                      <div className="ai-section-title">🎒 Logistics Requirement</div>
                      <div className="chip-list">
                        {aiResult.requiredSupplies?.map(s => <span key={s} className="chip">{s}</span>)}
                        {(!aiResult.requiredSupplies || aiResult.requiredSupplies.length === 0) && <span className="chip">None specific</span>}
                      </div>
                    </div>
                    <div>
                      <div className="ai-section-title">⏱ Predicted Execution Vector</div>
                      <div style={{ fontWeight: "600", color: "var(--text)" }}>{aiResult.estimatedTime}</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          <button
            id="submit-request"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting || !aiResult}
            style={{ marginTop: "16px", fontSize: "1.1rem", padding: "18px" }}
          >
            {submitting ? <><span className="spinner" /> Transmitting Signal...</> : "✅ Broadcast Coordinates"}
          </button>
          
          {!aiResult && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "12px" }}>
              (Analysis sequence required before broadcast capability is unlocked)
            </p>
          )}

        </form>
      </div>
    </div>
  );
}
