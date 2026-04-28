import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/"); // RoleRedirect in App.jsx handles the actual destination
    } catch (err) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--grad-hero)" }}>
      <motion.div
        style={{ width: "100%", maxWidth: "420px" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <motion.div
            style={{
              width: "64px", height: "64px",
              background: "var(--grad-primary)",
              borderRadius: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", margin: "0 auto 16px",
              boxShadow: "var(--shadow-primary)",
            }}
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            ⚡
          </motion.div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: "800", letterSpacing: "-0.04em" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Sign in to Aureon AI</p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)", borderColor: "rgba(99,102,241,0.1)" }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : "Sign In →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Create one →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
