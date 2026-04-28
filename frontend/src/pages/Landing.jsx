import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

const TIERS = [
  {
    num: "01",
    title: "Citizen Portal",
    sub: "Signal Ingestion",
    desc: "Multilingual distress reporting with Voice AI, instant triage classification, and a live First-Aid Chatbot to guide you while waiting.",
    icon: "🏙️",
    color: "var(--info)",
    colorBg: "var(--info-bg)",
    features: ["Voice + Text Input", "AI Triage Chatbot", "Real-time Status"],
  },
  {
    num: "02",
    title: "Responder Node",
    sub: "Ground Execution",
    desc: "Dedicated volunteer dashboard powered by the AI Matching Engine. Skills, availability, and proximity factored into every assignment.",
    icon: "🚀",
    color: "var(--primary)",
    colorBg: "var(--primary-light)",
    features: ["AI Skill Matching", "Action Plan Engine", "Live GPS Tracker"],
    featured: true,
  },
  {
    num: "03",
    title: "Command Center",
    sub: "System Oversight",
    desc: "Real-time heatmap, smart volunteer dispatch, and complete platform analytics for administrators managing the Aureon ecosystem.",
    icon: "⚡",
    color: "var(--success)",
    colorBg: "var(--success-bg)",
    features: ["Crisis Heatmap", "Smart Dispatch", "Platform Analytics"],
  },
];

const STATS = [
  { value: "3-Tier", label: "Architecture" },
  { value: "AI", label: "Powered Matching" },
  { value: "Real-Time", label: "Dispatch Engine" },
  { value: "∞", label: "Scalability" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "📝", title: "Submit a Request", desc: "Describe your need via text or voice. Our AI instantly analyzes severity, category, and required skills." },
  { step: "02", icon: "🧠", title: "AI Matches Volunteer", desc: "The matching engine scores all volunteers by skills, availability, experience, and proximity." },
  { step: "03", icon: "🚗", title: "Help Is Dispatched", desc: "The best-matched volunteer is notified with a smart Action Plan and dispatched to your location." },
  { step: "04", icon: "✅", title: "Case Resolved", desc: "Track progress in real-time, rate your experience, and close the case once help arrives." },
];

export default function Landing() {
  const { user, userRole, lang } = useApp();

  const getStartedLink = user
    ? userRole === "admin" ? "/admin"
    : userRole === "volunteer" ? "/volunteer"
    : "/dashboard"
    : "/register";

  const isEn = lang === "EN";

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section style={{
        position: "relative",
        padding: "160px 20px 120px",
        textAlign: "center",
        background: "var(--grad-hero)",
        overflow: "hidden",
      }}>
        <div className="hero-grid-bg" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="container" style={{ maxWidth: "860px", position: "relative", zIndex: 1 }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-badge">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
              {isEn ? "Aureon AI Platform v2.0" : "ஆரியோன் AI v2.0"}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
              fontWeight: "900",
              lineHeight: "1.08",
              letterSpacing: "-0.05em",
              marginBottom: "28px",
            }}
          >
            {isEn ? "The AI Platform That" : "மக்களை இணைக்கும்"}{" "}
            <br />
            <span className="gradient-text">
              {isEn ? "Connects People to Help" : "AI தொழில்நுட்பம்"}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: "1.15rem",
              color: "var(--text-muted)",
              maxWidth: "660px",
              margin: "0 auto 44px",
              lineHeight: "1.65",
            }}
          >
            {isEn
              ? "A three-tier intelligent dispatch system that uses AI to perfectly match distress signals with the ideal volunteer — by skill, availability, location, and experience."
              : "மூன்று அடுக்கு கட்டமைப்பில் AI-யால் இயக்கப்படும் தொண்டர் மேலாண்மை தொழில்நுட்பம்."}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link to={getStartedLink} className="btn btn-primary btn-lg" style={{ gap: "10px", fontSize: "1rem" }}>
              🚀 {isEn ? "Get Started" : "தொடங்குக"}
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: "1rem" }}>
              {isEn ? "Sign In" : "உள்நுழைக"}
            </Link>
          </motion.div>

          {/* Floating icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ marginTop: "64px", display: "flex", justifyContent: "center", gap: "28px" }}
          >
            {["🏥", "🚑", "🙋", "🤝", "📡"].map((emoji, i) => (
              <div
                key={i}
                className="float-icon"
                style={{
                  width: "52px", height: "52px", borderRadius: "14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem",
                  boxShadow: "var(--shadow-md)",
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                {emoji}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ STATS BAR ══════════════════════ */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "32px 20px" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", textAlign: "center" }}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  padding: "16px 8px",
                  borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ fontSize: "1.6rem", fontWeight: "900", letterSpacing: "-0.04em", color: "var(--text)" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ THREE TIERS ══════════════════════ */}
      <section style={{ padding: "100px 20px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>

          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <motion.span
              className="section-badge"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Platform Architecture
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: "800", letterSpacing: "-0.04em", marginBottom: "16px" }}
            >
              Three specialized platforms,
              <br /><span className="gradient-text">one unified mission.</span>
            </motion.h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto" }}>
              Aureon intelligently fragments emergency response into distinct, synchronized layers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.title}
                className={`card-feature ${tier.featured ? "card-glow" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{ position: "relative", overflow: "hidden" }}
              >
                {tier.featured && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: "var(--grad-primary)", color: "white",
                    padding: "3px 10px", borderRadius: "99px",
                    fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.05em"
                  }}>
                    CORE ENGINE
                  </div>
                )}

                <div style={{
                  width: "52px", height: "52px", borderRadius: "14px",
                  background: tier.colorBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", marginBottom: "20px",
                  border: `1px solid ${tier.color}22`,
                }}>
                  {tier.icon}
                </div>

                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: tier.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  {tier.num} / {tier.sub}
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.03em" }}>
                  {tier.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.65", marginBottom: "24px" }}>
                  {tier.desc}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tier.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: tier.color, display: "inline-block", flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section style={{ padding: "100px 20px", background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>

          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-badge">How It Works</span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "800", letterSpacing: "-0.04em" }}
            >
              From distress signal to <span className="gradient-text">resolved case</span>
            </motion.h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{ textAlign: "center", padding: "8px" }}
              >
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "var(--grad-primary)",
                  color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.7rem",
                  margin: "0 auto 20px",
                  boxShadow: "var(--shadow-primary)",
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Step {step.step}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "10px", letterSpacing: "-0.02em" }}>
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ AI MATCHING SPOTLIGHT ══════════════════════ */}
      <section style={{ padding: "100px 20px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>

            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-badge">★ Core Innovation</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: "800", letterSpacing: "-0.04em", marginBottom: "20px" }}>
                The AI Matching Engine that finds the{" "}
                <span className="gradient-text">perfect responder</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "28px" }}>
                Our proprietary multi-factor algorithm scores every available volunteer in real-time using four weighted dimensions to guarantee the optimal match for each unique situation.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { factor: "Skill Match", pct: "40%", color: "var(--primary)" },
                  { factor: "Experience & Rating", pct: "25%", color: "var(--accent)" },
                  { factor: "Availability", pct: "20%", color: "var(--success)" },
                  { factor: "Location Proximity", pct: "15%", color: "var(--warning)" },
                ].map((f, i) => (
                  <div key={f.factor}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text)" }}>{f.factor}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: "700", color: f.color }}>{f.pct}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        style={{ background: f.color, width: "0%" }}
                        whileInView={{ width: f.pct }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: mock score card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="card-glass" style={{ padding: "28px", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text)" }}>🧠 AI Match Result</span>
                  <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(99,102,241,0.2)" }}>Live Demo</span>
                </div>

                {[
                  { name: "Priya Sharma", score: 94, skills: ["Medical", "First Aid"], badge: "🏆" },
                  { name: "Rahul Kumar", score: 87, skills: ["Transport", "Elder Care"], badge: "🥈" },
                  { name: "Arun Patel", score: 79, skills: ["General", "Logistics"], badge: "🥉" },
                ].map((m, i) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.2 + i * 0.1 }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px", borderRadius: "10px",
                      background: i === 0 ? "var(--primary-light)" : "var(--bg-hover)",
                      border: `1px solid ${i === 0 ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="vol-avatar" style={{ width: "36px", height: "36px", fontSize: "0.9rem" }}>
                        {m.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.88rem" }}>{m.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {m.skills.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.1rem" }}>{m.badge}</div>
                      <div style={{ fontWeight: "800", fontSize: "1rem", color: "var(--primary)", letterSpacing: "-0.03em" }}>
                        {m.score}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section style={{
        padding: "120px 20px",
        background: "var(--grad-primary)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div className="container" style={{ maxWidth: "700px", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "900", color: "white", marginBottom: "20px", letterSpacing: "-0.05em", lineHeight: 1.1 }}>
              Ready to make a difference?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", marginBottom: "40px", lineHeight: 1.6 }}>
              Join Aureon as a community member, volunteer, or administrator and be part of India's most advanced volunteer coordination network.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" className="btn btn-lg" style={{ background: "white", color: "var(--primary)", fontWeight: "700", fontSize: "1rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                Join Aureon →
              </Link>
              <Link to="/login" className="btn btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", fontSize: "1rem" }}>
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

