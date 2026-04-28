import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Landing() {
  const { user, userRole, lang } = useApp();

  const getStartedLink = user
    ? userRole === "admin" ? "/admin"
    : userRole === "volunteer" ? "/volunteer"
    : "/submit"
    : "/register";

  // Light translation layer for Landing
  const isEn = lang === "EN";

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Hero */}
      <section style={{
        padding: "160px 20px 100px",
        textAlign: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)"
      }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{
            display: "inline-block",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "var(--text)",
            marginBottom: "32px",
            letterSpacing: "0.02em"
          }}>
            {isEn ? "Aureon Distributed System v2.0" : "ஆரியோன் தொழில்நுட்ப அமைப்பு v2.0"}
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: "800",
            lineHeight: "1.1",
            marginBottom: "24px",
            letterSpacing: "-0.04em",
          }}>
            {isEn ? "Three-tier architecture for" : "மூன்று அடுக்கு கட்டமைப்பில்"} <br/>
            <span style={{ color: "var(--text-muted)" }}>
              {isEn ? "ultimate crisis response." : "சிறந்த பேரிடர் மேலாண்மை."}
            </span>
          </h1>

          <p style={{
            fontSize: "1.15rem",
            color: "var(--text-muted)",
            maxWidth: "700px",
            margin: "0 auto 40px",
            lineHeight: "1.6",
          }}>
            {isEn ? 
            "A seamless pipeline connecting distressed citizens to specialized responders under the supervision of centralized command logic. Synchronized, localized, and ultra-fast." :
            "பாதிக்கப்பட்ட மக்களையும் தொண்டர்களையும் மையக் கட்டுப்பாட்டு அறையின் உதவியுடன் இணைக்கும் அதிவேக தொழில்நுட்பம்."}
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={getStartedLink} className="btn btn-primary btn-lg" style={{ fontSize: "1rem", padding: "16px 32px" }}>
              {isEn ? "Initialize System" : "தொடங்குக"}
            </Link>
          </div>
        </div>
      </section>

      {/* THREE TIER PLATFORM */}
      <section style={{ padding: "100px 20px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", letterSpacing: "-0.04em", marginBottom: "16px" }}>
              The Three-Tier Operational Model
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
              Aureon logically fragments emergency response into three specialized, synchronized platforms.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {/* TIER 1 */}
            <div className="card" style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "12px", background: "var(--info)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", marginBottom: "20px" }}>
                1
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>Citizen Portal</h3>
              <p style={{ color: "var(--text)", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", opacity: 0.5 }}>Signal Ingestion</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Multilingual interface allowing immediate signal transmission. Integrates Voice telemetry and features an active <strong style={{color:"black"}}>Triage AI Chatbot</strong> guiding victims while they wait.
              </p>
            </div>

            {/* TIER 2 */}
            <div className="card" style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderColor: "var(--text)", boxShadow: "var(--shadow-md)" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "12px", background: "var(--text)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", marginBottom: "20px" }}>
                2
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>Responder Node</h3>
              <p style={{ color: "var(--text)", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", opacity: 0.5 }}>Ground Execution</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Dedicated dashboard for registered volunteers. Features inferred Action Plans and Logistics lists so responders deploy rapidly with absolute precision.
              </p>
            </div>

            {/* TIER 3 */}
            <div className="card" style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "12px", background: "var(--success)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", marginBottom: "20px" }}>
                3
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>Command Center</h3>
              <p style={{ color: "var(--text)", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", opacity: 0.5 }}>System Oversight</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                High-level admin visualization engine featuring a global <strong style={{color:"black"}}>Real-time Heatmap</strong> and instantaneous smart-vectoring algorithms for bulk assignments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px 20px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <h2 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "20px", letterSpacing: "-0.04em" }}>Standardize the grid.</h2>
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: "40px", maxWidth: "500px", margin: "0 auto 40px" }}>
          Deploy as a citizen or register as a certified response node today.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: "1rem", padding: "16px 40px", borderRadius: "6px", fontWeight: "600" }}>
          Engage Framework
        </Link>
      </section>
    </div>
  );
}
