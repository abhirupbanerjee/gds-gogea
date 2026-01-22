import React, { useState, useEffect } from "react";
import Footer from "./Footer";
import { API_BASE_URL, IMAGE_BASE_URL2 } from '@env';
const STORAGE_KEY = "AboutContentSections";

export default function AboutContent() {
  const [aboutSections, setAboutSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  /* ───── mount ───────────────────────────────────────────── */
  useEffect(() => {
    /* CSS for spinner + chatbot bubble */
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes spin {0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      #gea-chatbot-bubble{
        position:fixed;bottom:32px;right:32px;z-index:9999;background:#2563eb;color:#fff;
        border-radius:50%;width:64px;height:64px;box-shadow:0 4px 16px rgba(0,0,0,.2);
        display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;
        transition:background .2s;
      }
      #gea-chatbot-bubble:hover{background:#1d4ed8}
      #gea-chatbot-iframe-container{
        display:none;position:fixed;bottom:110px;right:32px;z-index:10000;width:400px;height:600px;
        max-height:calc(100vh - 200px);box-shadow:0 8px 32px rgba(0,0,0,.25);
        border-radius:16px;overflow:hidden;background:#fff;
      }
      #gea-chatbot-iframe-container.open{display:block}
      #gea-chatbot-close{
        position:absolute;top:8px;right:12px;background:transparent;border:none;font-size:1.5rem;
        color:#333;cursor:pointer;z-index:1;
      }`;
    document.head.appendChild(styleEl);

    /* Chat bubble markup */
    const bubble = document.createElement("div");
    const container = document.createElement("div");
    const closeBtn = document.createElement("button");
    const iframe = document.createElement("iframe");

    bubble.id = "gea-chatbot-bubble";
    bubble.title = "GEA AI Assistant!";
    bubble.textContent = "💬";

    container.id = "gea-chatbot-iframe-container";

    closeBtn.id = "gea-chatbot-close";
    closeBtn.title = "Close";
    closeBtn.innerHTML = "&times;";

    iframe.src = "https://gea-ai-assistant.vercel.app/";
    iframe.style.border = "0";
    iframe.allow = "clipboard-write";
    iframe.width = "100%";
    iframe.height = "100%";

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    document.body.appendChild(bubble);
    document.body.appendChild(container);

    bubble.onclick = () => container.classList.add("open");
    closeBtn.onclick = () => container.classList.remove("open");

    /* load cache then fetch */
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) setAboutSections(JSON.parse(cached));
    setLoading(false);

    fetch(`${API_BASE_URL}/drupal/pages`)
      .then((r) => r.json())
      .then((d) => {
        const about = d.pages.find((p) => p.title === "About");
        if (about?.sections) {
          setAboutSections(about.sections);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(about.sections));
        }
      })
      .catch(console.error);

    /* cleanup */
    return () => {
      document.head.removeChild(styleEl);
      bubble.remove();
      container.remove();
    };
  }, []);

  /* ───── helpers ─────────────────────────────────────────── */
  const handleInput = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.email) return alert("Please enter an e-mail address.");
    setLoading(true);
    try {
      const res = await fetch(`${IMAGE_BASE_URL2}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅  Thanks! Your message has been sent.");
      /* reset form */
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      alert("❌  Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── loading spinner ────────────────────────────────── */
  if (loading)
    return (
      <div style={s.loadingContainer}>
        <div style={s.spinner}></div>
      </div>
    );

  /* ───── render ─────────────────────────────────────────── */
  return (
    <div style={s.scrollView}>
      <div style={s.container}>
        <h2 style={s.heading}>About</h2>

        {aboutSections.map((sec, i) =>
          sec.type === "text" ? (
            <p key={i} style={s.paragraph}>
              {sec.content}
            </p>
          ) : null
        )}

        <p style={s.paragraph}>
          The team can be reached at{" "}
          <a href="mailto:easervices@gov.gd" style={s.email}>
            easervices@gov.gd
          </a>
          .
        </p>

        {/* Contact form */}
        <div style={s.formContainer}>
          <h3 style={s.formHeading}>Contact Us</h3>

          <div style={s.row}>
            <div style={s.half}>
              <label style={s.formLabel}>First name</label>
              <input
                style={s.input}
                placeholder="Your First Name"
                value={formData.firstName}
                onChange={(e) => handleInput("firstName", e.target.value)}
              />
            </div>
            <div style={s.half}>
              <label style={s.formLabel}>Last name</label>
              <input
                style={s.input}
                placeholder="Your Last Name"
                value={formData.lastName}
                onChange={(e) => handleInput("lastName", e.target.value)}
              />
            </div>
          </div>

          <label style={s.formLabel}>Email address</label>
          <input
            type="email"
            style={s.input}
            placeholder="Your Email Address"
            value={formData.email}
            onChange={(e) => handleInput("email", e.target.value)}
          />

          <label style={s.formLabel}>Your message</label>
          <textarea
            style={{ ...s.input, ...s.messageInput }}
            placeholder="Enter your question or message"
            value={formData.message}
            onChange={(e) => handleInput("message", e.target.value)}
          />

          <button onClick={handleSubmit} style={s.submitButton}>
            Submit
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ───── inline styles ─────────────────────────────────────── */
const s = {
  loadingContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "5px solid rgba(0,0,0,.1)",
    borderTop: "5px solid #000",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  scrollView: { height: "100vh", overflowY: "auto", overflowX: "hidden" },
  container: {
    padding: 16,
    background: "#fff",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  paragraph: { fontSize: 16, lineHeight: "24px", marginBottom: 16 },
  email: { color: "blue", textDecoration: "underline" },

  /* contact form */
  formContainer: {
    maxWidth: 600,
    margin: "0 auto 40px",
    padding: 20,
    background: "#f9f9f9",
    borderRadius: 10,
    boxShadow: "0 2px 4px rgba(0,0,0,.25)",
  },
  formHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "left",
  },
  row: { display: "flex", gap: "8%", marginBottom: 16 },
  half: { width: "46%" },
  formLabel: { display: "block", fontSize: 14, marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: 16,
    boxSizing: "border-box",
  },
  messageInput: { height: 100, resize: "vertical" },
  submitButton: {
    background: "#000",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    width: "100%",
  },
};
