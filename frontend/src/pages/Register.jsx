import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

const SKILLS = ["Medical", "Food Delivery", "Transport", "Elder Care", "Education", "Counseling", "Construction", "Technology", "Legal Aid", "Disability Support"];
const LANGUAGES = ["Tamil", "English", "Hindi", "Telugu", "Kannada"];

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

  async function handleRegister(e) {
    e.preventDefault();
    if (!role) { toast.error("Please select your role"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, role, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        skills: form.skills,
        languages: form.languages,
        availability: form.availability,
        isAvailable: true,
        tasksCompleted: 0,
        rating: 5.0,
      });
      toast.success("Account created! Welcome to Aureon AI 🎉");
      if (role === "admin") navigate("/admin");
      else if (role === "volunteer") navigate("/volunteer");
      else navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const ROLES = [
    { id: "user", icon: "🏙️", label: "Community Member", sub: "I need help" },
    { id: "volunteer", icon: "🚀", label: "Volunteer", sub: "I want to help" },
    { id: "admin", icon: "⚡", label: "Admin", sub: "Manage the system" },
  ];

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--grad-hero)" }}>
      <motion.div
        style={{ width: "100%", maxWidth: "520px" }}
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
          <h1 style={{ fontSize: "1.9rem", fontWeight: "800", letterSpacing: "-0.04em" }}>Create Account</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
            {step === 1 ? "Join Aureon AI — Who are you?" : "Fill your details"}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {[1, 2].map(s => (
            <div
              key={s}
              style={{
                flex: 1, height: "4px", borderRadius: "99px",
                background: step >= s ? "var(--grad-primary)" : "var(--border)",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)", borderColor: "rgba(99,102,241,0.1)" }}>
          {step === 1 ? (
            <div>
              <p style={{ fontWeight: "600", marginBottom: "16px", color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                I am a…
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                {ROLES.map(r => (
                  <motion.button
                    key={r.id}
                    id={`role-${r.id}`}
                    className={`role-card ${role === r.id ? "selected" : ""}`}
                    onClick={() => setRole(r.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{r.icon}</div>
                    <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text)" }}>{r.label}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>{r.sub}</div>
                  </motion.button>
                ))}
              </div>
              <button
                id="next-step"
                className="btn btn-primary btn-full btn-lg"
                onClick={() => role ? setStep(2) : toast.error("Select a role")}
              >
                Continue →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ marginBottom: "0" }}>
                  <label className="form-label">Full Name</label>
                  <input id="reg-name" className="form-input" placeholder="John Doe" value={form.name} onChange={e => setField("name", e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: "0" }}>
                  <label className="form-label">Phone</label>
                  <input id="reg-phone" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setField("phone", e.target.value)} required />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label className="form-label">Email</label>
                <input id="reg-email" className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setField("email", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="reg-password" className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setField("password", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Area (Coimbatore)</label>
                <input id="reg-address" className="form-input" placeholder="e.g. RS Puram, Gandhipuram…" value={form.address} onChange={e => setField("address", e.target.value)} />
              </div>

              {role === "volunteer" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Your Skills</label>
                    <div className="chip-list">
                      {SKILLS.map(s => (
                        <button type="button" key={s} className={`chip ${form.skills.includes(s) ? "selected" : ""}`} onClick={() => toggleSkill(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Languages Known</label>
                    <div className="chip-list">
                      {LANGUAGES.map(l => (
                        <button type="button" key={l} className={`chip ${form.languages.includes(l) ? "selected" : ""}`} onClick={() => toggleLang(l)}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Availability</label>
                    <select id="reg-availability" className="form-select" value={form.availability} onChange={e => setField("availability", e.target.value)}>
                      <option value="always">Always Available</option>
                      <option value="weekdays">Weekdays Only</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="evenings">Evenings Only</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button id="register-submit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Creating…</> : "Create Account 🎉"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>Sign in →</Link>
        </p>
      </motion.div>
    </div>
  );
}

