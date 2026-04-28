import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Landing() {
  const { user, userRole, lang } = useApp();

  const getStartedLink = user
    ? userRole === "volunteer" ? "/volunteer"
    : "/submit"
    : "/register";

  const isEn = lang === "EN";

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Hero */}
      <section style={{
        padding: "180px 20px 120px",
        textAlign: "center",
        background: "var(--grad-hero)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Grid BG */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div className="container" style={{ maxWidth: "900px", position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            padding: "8px 20px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: "700",
            color: "var(--primary-dark)",
            marginBottom: "32px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)"
          }}>
            <span style={{ width: "8px", height: "8px", background: "var(--primary)", borderRadius: "50%", animation: "pulse-dot 2s infinite" }}></span>
            {isEn ? "Aureon Community Support" : "ஆரியோன் தொழில்நுட்ப அமைப்பு"}
          </div>

          <h1 style={{
            fontSize: "clamp(3rem, 7vw, 5rem)",
            fontWeight: "900",
            lineHeight: "1.05",
            marginBottom: "24px",
          }}>
            {isEn ? "Fast & Direct" : "அதிவேக தானியங்கி"} <br/>
            <span className="gradient-text">
              {isEn ? "Emergency Help." : "பேரிடர் மேலாண்மை."}
            </span>
          </h1>

          <p style={{
            fontSize: "1.2rem",
            color: "var(--text-muted)",
            maxWidth: "700px",
            margin: "0 auto 40px",
            lineHeight: "1.7",
          }}>
            {isEn ? 
            "The middleman is gone. Aureon AI ingests your distress signal, pinpoints your coordinates, and algorithmically routes you to the exact optimal responder on the grid. Absolute efficiency." :
            "பாதிக்கப்பட்ட மக்களையும் தொண்டர்களையும் எந்தவொரு தடையுமின்றி செயற்கை நுண்ணறிவு மூலம் நேரடியாக இணைக்கும் அதிவேக கட்டமைப்பு."}
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={getStartedLink} className="btn btn-primary btn-lg" style={{ fontSize: "1.1rem", padding: "18px 40px", borderRadius: "var(--radius-lg)" }}>
              {isEn ? "Get Started" : "தொடங்குக"}
            </Link>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section style={{ padding: "120px 20px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{ fontSize: "2.8rem", fontWeight: "800", marginBottom: "16px" }}>
              The New Autonomous Grid
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
              Zero human delay. AI-powered matching processes requests instantly.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "32px" }}>
            {/* FEATURE 1 */}
            <div className="card card-glow" style={{ padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "flex-start", position: "relative" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "24px" }}>
                📍
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "12px", color: "var(--text)" }}>Precision Geometry</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: "1.6" }}>
                Drop an interactive leaflet PIN on your exact location. The Haversine distance algorithm calculates optimal geographical routing milliseconds later.
              </p>
            </div>

            {/* FEATURE 2 */}
            <div className="card card-glow" style={{ padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "flex-start", position: "relative" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "24px" }}>
                🧠
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "12px", color: "var(--text)" }}>Fully Automated</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: "1.6" }}>
                No manual waiting required. Once a request triggers, our AI finds the best volunteer nearby and connects them to you instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "140px 20px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        
        {/* Glow bg */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "var(--primary)", opacity: 0.05, filter: "blur(120px)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: "3.5rem", fontWeight: "900", marginBottom: "24px" }}>Join the network.</h2>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
            Submit a request as a citizen or register as a volunteer today.
          </p>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: "1.1rem", padding: "18px 48px", borderRadius: "var(--radius-lg)" }}>
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
}
