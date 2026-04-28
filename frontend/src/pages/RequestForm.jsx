import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { classifyRequest } from "../utils/gemini";
import { getTopMatches } from "../utils/aiMatching";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CATEGORIES = ["Medical", "Food", "Shelter", "Education", "Elder Care", "Disability Support", "Mental Health", "Other"];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Map center updater component
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
}

export default function RequestForm() {
  const { user, userData } = useApp();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  
  // Location States
  const [position, setPosition] = useState({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [areaName, setAreaName] = useState("Map Selected Location");
  const [searching, setSearching] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Debounced Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2 && showSuggestions) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=76.85,11.10,77.10,10.90&bounded=1&limit=5`);
          const data = await res.json();
          setSuggestions(data || []);
        } catch (e) {
          console.error(e);
        }
      } else if (searchQuery.trim().length <= 2) {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showSuggestions]);

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice telemetry not supported in this browser"); return; }
    const recog = new SpeechRecognition();
    recog.lang = "ta-IN";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onstart = () => setRecording(true);
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => prev ? prev + " " + transcript : transcript);
      toast.success("Voice transcript captured.");
    };
    recog.onerror = () => {
      setRecording(false);
      recog.lang = "en-IN";
      toast.error("Telemetry failed. Please input manually.");
    };
    recog.onend = () => setRecording(false);
    recognitionRef.current = recog;
    recog.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function handleSelectSuggestion(item) {
    setPosition({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setAreaName(item.display_name.split(",")[0]);
    setShowSuggestions(false);
    setSearchQuery(item.display_name); // Fill input but stop searching
    setSuggestions([]);
    toast.success(`Location centered: ${item.display_name.split(",")[0]}`);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=76.85,11.10,77.10,10.90&bounded=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        setPosition({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
        setAreaName(first.display_name.split(",")[0]); 
        setSearchQuery(first.display_name);
        setSuggestions([]);
        toast.success(`Location centered: ${first.display_name.split(",")[0]}`);
      } else {
        toast.error("Location not found. Try a different query.");
      }
    } catch (err) {
      toast.error("Failed to search location.");
    } finally {
      setSearching(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleClassify() {
    if (!text.trim() && !image) { toast.error("Please input distress text or upload an image first"); return; }
    setClassifying(true);
    setAiResult(null);
    try {
      const result = await classifyRequest(text, image);
      setAiResult(result);
      if (result.category) setCategory(result.category);
      toast.success("Analysis Complete.");
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
      const volunteersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "volunteer")));
      const volunteers = volunteersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const requestData = {
        requiredSkills: aiResult.requiredSkills || [],
        location: position,
        area: areaName,
        urgency: aiResult.urgency,
      };
      
      // Get top 5 matches so that if the #1 volunteer declines, the next best candidates
      // are already recorded in matchedVolunteers and can be shown in their dashboards too
      const topMatches = getTopMatches(volunteers, requestData, 5);
      const topVol = topMatches.length > 0 ? topMatches[0].volunteer : null;

      // Store top matched volunteer IDs so each volunteer's dashboard can filter requests for them
      const matchedVolunteers = topMatches.map(m => ({
        volunteerId: m.volunteerId,
        matchScore: m.matchScore,
        reason: m.reason,
      }));
      
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
        area: areaName, 
        location: position,
        status: topVol ? "pending_acceptance" : "pending",
        assignedVolunteerId: topVol ? (topVol.id || topVol.uid) : null,
        assignedVolunteerName: topVol ? topVol.name : null,
        assignedVolunteerPhone: topVol ? topVol.phone : null,
        matchedVolunteers,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      if (topVol) {
        toast.success(`🎯 AI matched with responder: ${topVol.name}!`);
      } else {
        toast.success(`Signal broadcasted. Waiting for network nodes.`);
      }
      navigate("/status");
    } catch (err) {
      toast.error("Broadcast failed. Ensure authentication is valid.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ paddingBottom: "100px" }} onClick={() => setShowSuggestions(false)}>
      <div className="container" style={{ maxWidth: "720px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "32px", marginTop: "32px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--text)" }}>Emergency Reporting</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "1.05rem" }}>
            Provide your exact address or pinpoint it on the map.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className="card" style={{ marginBottom: "24px", padding: 0, overflow: "visible", borderColor: "rgba(99, 102, 241, 0.3)" }}>
            <div style={{ padding: "16px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", borderRadius: "12px 12px 0 0" }}>
              <div style={{ fontWeight: "600", fontSize: "0.95rem", flex: 1, minWidth: "200px" }}>1. Location Selection</div>
              <div style={{ display: "flex", gap: "8px", flex: 2, minWidth: "250px", position: "relative", zIndex: 9999 }}>
                <input 
                  className="form-input" 
                  style={{ padding: "8px 12px", margin: 0, height: "40px" }} 
                  placeholder="Street, City, Landmark..." 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "44px",
                    left: 0,
                    right: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 9999, // Ensure it sits above the map
                    overflow: "hidden"
                  }}>
                    {suggestions.map((item, i) => (
                      <div 
                        key={i}
                        onClick={(e) => { e.stopPropagation(); handleSelectSuggestion(item); }}
                        style={{
                          padding: "10px 14px",
                          borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          color: "var(--text)",
                          backgroundColor: "transparent",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "var(--primary-light)"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching} style={{ height: "40px", padding: "0 16px" }}>
                  {searching ? <span className="spinner" /> : "Search"}
                </button>
              </div>
            </div>
            
            <div style={{ padding: "12px", background: "var(--bg)", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: "0.9rem" }}>
              <span style={{ fontWeight: 600, color: "var(--primary)" }}>Current Target:</span> {areaName}
            </div>
            <div style={{ height: "300px", width: "100%", background: "var(--bg-hover)", borderRadius: "0 0 12px 12px", zIndex: 0 }}>
              <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0 0 12px 12px" }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  maxZoom={19}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                />
                <RecenterMap position={position} />
                <LocationMarker position={position} setPosition={pos => {
                    setPosition(pos);
                    setAreaName("Custom Map Pin Drop");
                }} />
              </MapContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <label className="form-label">2. Primary Distress Parameters (Text / Audio / Visual)</label>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <button
                id="voice-btn"
                type="button"
                className={`btn ${recording ? "btn-danger" : "btn-primary"}`}
                onClick={recording ? stopVoice : startVoice}
                style={{ flex: 1 }}
              >
                {recording ? "🔴 Capturing... Tap to Stop" : "🎤 Voice Capture"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1 }}
              >
                📷 Upload Evidence
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handleImageUpload} 
              />
            </div>

            {image && (
              <div style={{ marginBottom: "16px", position: "relative", display: "inline-block" }}>
                <img src={image} alt="Evidence preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", border: "1px solid var(--border)" }} />
                <button type="button" onClick={() => setImage(null)} style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer" }}>×</button>
              </div>
            )}

            <textarea
              id="request-text"
              className="form-textarea"
              placeholder="E.g. 'There is a stray dog that is badly injured near Gandhipuram...' OR just upload a photo and leave this blank."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
            />
          </div>

          <button
            id="analyze-btn"
            type="button"
            className="btn btn-primary btn-full btn-lg"
            onClick={handleClassify}
            disabled={classifying || (!text.trim() && !image)}
            style={{ marginBottom: "24px" }}
          >
            {classifying
              ? <><span className="spinner" /> {image && !text.trim() ? "Analyzing Image with AI…" : "Synthesizing Visual/Text Data…"}</>
              : image && !text.trim()
                ? "🔍 Analyze Image Evidence"
                : image
                  ? "🚀 Execute Multimodal Analysis"
                  : "🚀 Analyze with AI"}
          </button>

          {/* SMART AI REPORT VIEW */}
          {aiResult && (
            <div className="ai-result animate-fade-in" style={{ border: "1px solid var(--primary)", boxShadow: "var(--shadow-glow)" }}>
              <div className="ai-header" style={{ background: "var(--grad-primary)" }}>
                <span style={{ fontSize: "1.4rem" }}>📄</span>
                <span className="ai-header-title">Operational Incident Brief</span>
                <span style={{ marginLeft: "auto" }}>
                  <span className={`badge badge-${aiResult.urgency?.toLowerCase()}`} style={{ background: "var(--bg-card)", color: "var(--primary)" }}>
                    {aiResult.urgency} PRIORITY
                  </span>
                </span>
              </div>
              <div className="ai-body" style={{ background: "var(--bg-card)" }}>
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text)" }}>"{aiResult.summary}"</p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>{aiResult.severityExplanation}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
                  <div className="ai-section" style={{ margin: 0 }}>
                    <div className="ai-section-title">📋 Responder Directives</div>
                    <ul className="ai-list">
                      {aiResult.actionPlan?.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ul>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <div>
                      <div className="ai-section-title">🎒 Logistics Requirement</div>
                      <div className="chip-list">
                        {aiResult.requiredSupplies?.map(s => <span key={s} className="chip" style={{ background: "var(--bg-hover)" }}>{s}</span>)}
                        {(!aiResult.requiredSupplies || aiResult.requiredSupplies.length === 0) && <span className="chip">None specific</span>}
                      </div>
                    </div>
                    <div>
                      <div className="ai-section-title">⏱ Predicted Vector</div>
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
            {submitting ? <><span className="spinner" /> Vectors Processing...</> : "✅ Secure Direct Dispatch"}
          </button>
        </form>
      </div>
    </div>
  );
}
