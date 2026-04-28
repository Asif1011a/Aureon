import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function Chatbot() {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef();

  const botTitle = lang === "EN" ? "Medical Triage Assistant" : "மருத்துவ உதவி வழிகாட்டி";
  const placeholder = lang === "EN" ? "Ask a first-aid question..." : "முதலுதவி கேள்வியை கேளுங்கள்...";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        sender: "bot", 
        text: lang === "EN" 
          ? "Hi, I am the Aureon Triage AI. While you wait for a responder, ask me any immediate survival or first-aid questions."
          : "வணக்கம், நான் மருத்துவ உதவி வழிகாட்டி. தொண்டர் வரும் முன் உங்கள் முதலுதவி கேள்விகளை கேட்கலாம்."
      }]);
    }
  }, [open, lang, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input.trim();
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInput("");

    // Simulate AI Triage Engine (Fallback local rules-engine)
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = "";

      if (lang === "EN") {
        if (lower.includes("bleed") || lower.includes("cut")) {
          reply = "Apply firm, direct pressure to the wound with a clean cloth. Elevate the injured area above the heart if possible. Do not remove the cloth if it soaks through; add another layer on top.";
        } else if (lower.includes("burn") || lower.includes("fire")) {
          reply = "Run cool (not cold) water over the burn for 10-15 minutes. Do not apply ice, butter, or ointments. Lightly cover with a sterile, non-fluffy bandage.";
        } else if (lower.includes("heart") || lower.includes("pain in chest")) {
          reply = "Have the person sit down and rest. Loosen tight clothing. If they have prescribed nitroglycerin, help them take it. If unconscious, begin CPR immediately pushing hard and fast in the center of the chest.";
        } else if (lower.includes("choke") || lower.includes("breathe")) {
          reply = "If they cannot cough or speak, perform abdominal thrusts (Heimlich maneuver). Stand behind them, make a fist above their navel, and pull inward and upward repeatedly.";
        } else if (lower.includes("dog") || lower.includes("bite")) {
          reply = "Wash the bite wound thoroughly with soap and warm water for 5 minutes. Apply an antibiotic ointment if available and cover with a clean bandage. Keep the person safe from further attack.";
        } else {
          reply = "I am monitoring your distress signal. Keep the person calm, warm, and do not move them if spinal injury is suspected. A responder has been vectored to your location.";
        }
      } else {
        // Tamil Translations
        if (lower.includes("bleed") || lower.includes("cut") || lower.includes("ரத்தம்")) {
          reply = "சுத்தமான துணியால் காயத்தின் மீது அழுத்தம் கொடுக்கவும். காயம் ஏற்பட்ட பகுதியை இதயத்திற்கு மேல் உயர்த்தி வைக்கவும்.";
        } else if (lower.includes("burn") || lower.includes("காந்தல்") || lower.includes("நெருப்பு")) {
          reply = "தீக்காயத்தின் மீது குளிர்ந்த நீரை 10-15 நிமிடங்கள் ஊற்றவும். பனிக்கட்டி அல்லது வெண்ணெய் தடவாதீர்கள்.";
        } else if (lower.includes("heart") || lower.includes("நெஞ்சு") || lower.includes("வலி")) {
          reply = "அவரை உட்கார வைத்து ஆசுவாசப்படுத்தவும். இறுக்கமான உடைகளை தளர்த்தவும். மயக்கம் அடைந்தால், உடனடியாக இதய மசாஜ் (CPR) செய்யவும்.";
        } else {
          reply = "நான் நிலைமையை கண்காணிக்கிறேன். பயப்பட வேண்டாம். எங்கள் உதவியாளர் வந்து கொண்டிருக்கிறார்.";
        }
      }

      setMessages(prev => [...prev, { sender: "bot", text: reply }]);
    }, 800);
  };

  return (
    <>
      <button 
        style={{
          position: "fixed", bottom: "30px", right: "30px", zIndex: 1000,
          width: "60px", height: "60px", borderRadius: "50%",
          background: "var(--primary)", color: "white",
          border: "none", boxShadow: "var(--shadow-lg)",
          fontSize: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: "100px", right: "30px", zIndex: 1000,
          width: "350px", height: "450px", background: "var(--bg-card)",
          borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)", display: "flex", flexDirection: "column",
          overflow: "hidden", animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{ background: "var(--primary)", padding: "16px", color: "white" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>{botTitle}</h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>Secure Automated Triage</p>
          </div>

          <div style={{ flex: 1, padding: "16px", overflowY: "auto", background: "var(--bg)", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                background: m.sender === "user" ? "var(--text)" : "white",
                color: m.sender === "user" ? "white" : "var(--text)",
                padding: "10px 14px", borderRadius: "8px", maxWidth: "85%",
                fontSize: "0.9rem", boxShadow: "var(--shadow-xs)", border: m.sender === "bot" ? "1px solid var(--border)" : "none"
              }}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", borderTop: "1px solid var(--border)", padding: "10px", background: "white" }}>
            <input 
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              style={{ flex: 1, border: "none", outline: "none", fontSize: "0.9rem", padding: "8px" }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              background: "var(--primary)", color: "white", border: "none",
              borderRadius: "4px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", opacity: input.trim() ? 1 : 0.5
            }}>
              ➞
            </button>
          </form>
        </div>
      )}
    </>
  );
}
