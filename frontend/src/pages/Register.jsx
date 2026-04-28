import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      else navigate("/submit");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            borderRadius: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", margin: "0 auto 16px"
          }}>⚡</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Create Account</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Join Aureon AI — {step === 1 ? "Who are you?" : "Fill your details"}</p>
        </div>

        <div className="card">
          {step === 1 ? (
            <div>
              <p style={{ fontWeight: "600", marginBottom: "16px", color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>I am a...</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                {[
                  { id: "user", icon: "👤", label: "Community Member", sub: "Need help" },
                  { id: "volunteer", icon: "🙋", label: "Volunteer", sub: "Want to help" },
                  { id: "admin", icon: "🛡️", label: "Admin", sub: "Manage system" }
                ].map(r => (
                  <button
                    key={r.id}
                    id={`role-${r.id}`}
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: "20px 12px",
                      borderRadius: "14px",
                      border: `2px solid ${role === r.id ? "var(--primary)" : "var(--border)"}`,
                      background: role === r.id ? "rgba(79,70,229,0.12)" : "rgba(255,255,255,0.03)",
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
                <label className="form-label">Address / Area (Coimbatore)</label>
                <input id="reg-address" className="form-input" placeholder="e.g. RS Puram, Gandhipuram..." value={form.address} onChange={e => setField("address", e.target.value)} />
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
                  {loading ? <><span className="spinner" /> Creating...</> : "Create Account 🎉"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: "600" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
