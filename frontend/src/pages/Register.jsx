import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return position === null ? null : <Marker position={position}></Marker>;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 13); }, [position, map]);
  return null;
}

const SKILL_CATEGORIES = {
  "Health & Rescue (SDG 3)": ["First Aid Response", "Paramedic", "Veterinary First Aid", "Crisis Counseling", "AED Certified", "Search & Rescue", "Emergency Nurse", "Blood Donor"],
  "Food & Logistics (SDG 2, 11)": ["Food Bank Operations", "Heavy Vehicle Driving", "Shelter Coordination", "Construction / Carpentry", "Clean Water Setup", "Debris Removal", "Solar Electronics"],
  "Education & Support (SDG 4, 16)": ["Child Care", "Legal Aid", "Translation", "Sign Language", "IT & Network Repair", "Psychology / Therapy", "Community Leader"]
};

const LANGUAGES = ["Tamil", "English", "Hindi", "Telugu", "Kannada", "Malayalam"];

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", name: "", phone: "",
    address: "", skills: [], languages: [], availability: "weekends"
  });

  // Location States
  const [position, setPosition] = useState({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s]
    }));
  }

  function toggleLang(l) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l]
    }));
  }

  // Debounced Autocomplete for Map Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (form.address.trim().length > 2 && showSuggestions) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&viewbox=76.85,11.10,77.10,10.90&bounded=1&limit=5`);
          const data = await res.json();
          setSuggestions(data || []);
        } catch (e) {
          console.error(e);
        }
      } else if (form.address.trim().length <= 2) {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [form.address, showSuggestions]);

  function handleSelectSuggestion(item) {
    setPosition({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setField("address", item.display_name.split(",")[0]);
    setShowSuggestions(false);
    setSuggestions([]);
    toast.success(`Deployment base locked to: ${item.display_name.split(",")[0]}`);
  }

  async function handleSearch() {
    if (!form.address.trim()) return;
    setSearching(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&viewbox=76.85,11.10,77.10,10.90&bounded=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        setPosition({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
        setField("address", first.display_name.split(",")[0]);
        setSuggestions([]);
        toast.success(`Target locked: ${first.display_name.split(",")[0]}`);
      } else {
        toast.error("Location not found visually.");
      }
    } catch (err) {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    if (!role) { toast.error("Please select your role"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    
    if (role === "volunteer" && form.skills.length === 0) {
      toast.error("Please select at least one skill to join as a Responder.");
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, role, {
        name: form.name,
        phone: form.phone,
        address: form.address || "Coimbatore",
        location: position, // Map Coordinate Accuracy Guarantee
        skills: form.skills,
        languages: form.languages,
        availability: form.availability,
        isAvailable: true,
        tasksCompleted: 0,
        rating: 5.0,
      });
      toast.success("Account activated! Welcome to Aureon AI 🎉");
      if (role === "volunteer") navigate("/volunteer");
      else if (role === "admin") navigate("/admin");
      else navigate("/status");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone) {
      toast.error("Please fill all personal details");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password too short");
      return;
    }
    setStep(3); // Go to volunteer map/skills
  };

  const ROLES = [
    { id: "user", icon: "🏙️", label: "Citizen", sub: "Request Assistance" },
    { id: "volunteer", icon: "🚀", label: "Responder Node", sub: "Deploy to Field" },
    { id: "admin", icon: "🛡️", label: "Coordinator", sub: "Monitor Ops" },
  ];

  return (
    <div className="page" style={{ padding: "40px 0", minHeight: "100vh", background: "var(--grad-hero)" }} onClick={() => setShowSuggestions(false)}>
      <motion.div
        className="container"
        style={{ width: "100%", maxWidth: step === 3 ? "800px" : "680px", transition: "max-width 0.3s" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <motion.div
            style={{
              width: "64px", height: "64px",
              background: "var(--grad-primary)",
              borderRadius: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", margin: "0 auto 16px",
              boxShadow: "var(--shadow-primary)",
            }}
          >
            ▲
          </motion.div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.04em" }}>Create an Account</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
            {step === 1 ? "Choose your role" : step === 2 ? "Personal Details" : "Volunteer Details"}
          </p>
        </div>

        {/* Progress Timeline */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1, height: "4px", borderRadius: "99px",
                background: step >= s ? "var(--grad-primary)" : "var(--border)",
                transition: "background 0.3s ease",
                opacity: role === "admin" && s === 3 ? 0 : 1 // Hide 3rd step if admin
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="card glass-panel" style={{ boxShadow: "var(--shadow-lg)", padding: "32px", borderColor: "rgba(99,102,241,0.1)" }}>
              <p style={{ fontWeight: "700", marginBottom: "16px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Choose Your Role
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
                {ROLES.map(r => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: "20px 12px",
                      borderRadius: "14px",
                      border: `2px solid ${role === r.id ? "var(--primary)" : "var(--border)"}`,
                      background: role === r.id ? "rgba(99, 102, 241, 0.12)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      color: "var(--text)",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{r.icon}</div>
                    <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{r.label}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>{r.sub}</div>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => role ? setStep(2) : toast.error("Select a role to continue")}
              >
                Next Step →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="card glass-panel" style={{ boxShadow: "var(--shadow-lg)", padding: "32px", borderColor: "rgba(99,102,241,0.1)" }}>
              <form onSubmit={role !== "admin" ? handleNextStep : handleRegister}>
                <p style={{ fontWeight: "700", marginBottom: "20px", color: "var(--text)", fontSize: "1.1rem" }}>
                  Personal Details
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setField("name", e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Active Phone</label>
                    <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setField("phone", e.target.value)} required />
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setField("email", e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Create Password</label>
                    <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setField("password", e.target.value)} required />
                  </div>
                </div>

                {role === "admin" && (
                  <div style={{ background: "rgba(99,102,241,0.05)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "24px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Admin Registration</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Admins do not require a map location. Proceed to create your account.</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ padding: "0 24px" }}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading && role === "admin"}>
                    {role !== "admin" ? "Next: Choose Location →" : (loading ? <><span className="spinner"/> Creating...</> : "Create Account 🎉")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && role !== "admin" && (
            <motion.div key="step3" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:1.05}}>
              
              <div style={{ display: "flex", gap: "24px", flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                
                {/* LEFT SIDE: MAP CARD */}
                <div className="card" style={{ flex: 1, padding: 0, overflow: "visible", borderColor: "rgba(99, 102, 241, 0.3)", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "16px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border)", borderRadius: "12px 12px 0 0" }}>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "12px" }}>Location Selection</div>
                    <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 9999 }}>
                      <input 
                        className="form-input" 
                        style={{ padding: "8px 12px", margin: 0, height: "40px" }} 
                        placeholder="Street, City, Landmark..." 
                        value={form.address} 
                        onChange={e => {
                          setField("address", e.target.value);
                          setShowSuggestions(true);
                        }} 
                        onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      />
                      
                      {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                          position: "absolute", top: "44px", left: 0, right: 0,
                          background: "var(--bg-card)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-lg)",
                          zIndex: 9999, overflow: "hidden"
                        }}>
                          {suggestions.map((item, i) => (
                            <div 
                              key={i} onClick={(e) => { e.stopPropagation(); handleSelectSuggestion(item); }}
                              style={{ padding: "10px 14px", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", fontSize: "0.85rem", color: "var(--text)", transition: "background 0.2s" }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "var(--primary-light)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              {item.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button type="button" className="btn btn-primary" disabled={searching} onClick={handleSearch} style={{ height: "40px", padding: "0 16px" }}>
                        {searching ? <span className="spinner" /> : "Search"}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "12px", background: "var(--bg)", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>Current Target:</span> {form.address}
                  </div>

                  <div style={{ height: "300px", width: "100%", background: "var(--bg-hover)", borderRadius: "0 0 12px 12px", zIndex: 0 }}>
                    <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0 0 12px 12px" }}>
                      <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" maxZoom={20} attribution="Google Maps" />
                      <RecenterMap position={position} />
                      <LocationMarker position={position} setPosition={pos => {
                          setPosition(pos);
                          setField("address", "Custom Map Pin Drop");
                      }} />
                    </MapContainer>
                  </div>
                </div>

                {role === "user" && (
                   <div className="card glass-panel" style={{ flex: 1, padding: "24px", borderColor: "rgba(99,102,241,0.1)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "24px" }}>📍</div>
                      <h3 style={{ fontSize: "1.4rem", color: "var(--text)", marginBottom: "8px", fontWeight: "800" }}>Citizen Profile</h3>
                      <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "32px", maxWidth: "280px" }}>Saving your home location helps emergency responders instantly locate you when you trigger an emergency.</p>
                      
                      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                        <button type="button" className="btn btn-primary" onClick={handleRegister} style={{ flex: 1 }} disabled={loading}>
                          {loading ? <><span className="spinner" /> Creating Account…</> : "Complete Registration 🚀"}
                        </button>
                      </div>
                   </div>
                )}
                
                {/* RIGHT SIDE: SKILLS CARD */}
                {role === "volunteer" && (
                <div className="card glass-panel" style={{ flex: 1, padding: "24px", borderColor: "rgba(99,102,241,0.1)" }}>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text)", marginBottom: "8px", fontWeight: "800" }}>Select Your Skills</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Select specific skills you can provide during crises.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    {Object.entries(SKILL_CATEGORIES).map(([catName, skills]) => (
                      <div key={catName} style={{ background: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                          {catName}
                        </p>
                        <div className="chip-list" style={{ gap: "6px" }}>
                          {skills.map(s => (
                            <button 
                              type="button" 
                              key={s} 
                              onClick={() => toggleSkill(s)}
                              style={{
                                background: form.skills.includes(s) ? "var(--primary)" : "var(--bg-card)",
                                color: form.skills.includes(s) ? "white" : "var(--text)",
                                border: `1px solid ${form.skills.includes(s) ? "var(--primary-dark)" : "var(--border)"}`,
                                fontWeight: form.skills.includes(s) ? "600" : "500",
                                padding: "6px 12px",
                                fontSize: "0.80rem",
                                borderRadius: "20px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "32px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Language Fluency</label>
                      <div className="chip-list">
                        {LANGUAGES.map(l => (
                          <button type="button" key={l} className={`chip ${form.languages.includes(l) ? "selected" : ""}`} onClick={() => toggleLang(l)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FINAL SUMMIT */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleRegister} style={{ flex: 1 }} disabled={loading}>
                      {loading ? <><span className="spinner" /> Creating Account…</> : "Complete Registration 🚀"}
                    </button>
                  </div>

                </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>Sign in →</Link>
        </p>

      </motion.div>
    </div>
  );
}
