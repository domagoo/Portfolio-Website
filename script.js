/* ============================
   SMOOTH SCROLL
============================ */
document.querySelectorAll("[data-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ============================
   FOOTER YEAR
============================ */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================
   CONTACT FORM (EmailJS)
============================ */

// 1) Put your EmailJS keys here:
const EMAILJS_PUBLIC_KEY = "K1IHA_H0fwbiB1tOe";
const EMAILJS_SERVICE_ID = "service_hnjtj0b";
const EMAILJS_TEMPLATE_ID = "template_kpryubk";

// 2) Initialize EmailJS once the page is ready
document.addEventListener("DOMContentLoaded", () => {
  // Make sure EmailJS script loaded
  if (!window.emailjs) {
    console.error("EmailJS not loaded. Check the CDN script tag in index.html.");
    return;
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);

  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");

  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const btnText = submitBtn?.querySelector(".btn-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot spam trap
    const hp = form.querySelector('input[name="company"]');
    if (hp && hp.value.trim() !== "") return;

    if (statusEl) statusEl.textContent = "";
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = "Sending...";

    try {
      // This will automatically send fields by their name="" values:
      // from_name, reply_to, subject, message
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);

      if (statusEl) statusEl.textContent = "✅ Sent! Thanks — I’ll reply soon.";
      form.reset();
    } catch (err) {
      console.error("EmailJS error:", err);
      if (statusEl) statusEl.textContent = "❌ Failed to send. Try again in a moment.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = "Send Message";
    }
  });
});


/* ============================
   MODAL HELPERS
============================ */
function openModal(modal, focusEl) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  if (focusEl) setTimeout(() => focusEl.focus(), 0);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

/* ============================
   CHAT MODAL
============================ */
const openChatApp = document.getElementById("openChatApp");
const chatModal = document.getElementById("chatModal");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const chatCloseBackdrop = document.getElementById("chatCloseBackdrop");

const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatMessage = document.getElementById("chatMessage");

const systemPrompt = document.getElementById("systemPrompt");
const memory = document.getElementById("memory");
const retrievedContext = document.getElementById("retrievedContext");
const temp = document.getElementById("temp");
const maxTokens = document.getElementById("maxTokens");

const clearChat = document.getElementById("clearChat");
const saveState = document.getElementById("saveState");

/* Mode toggle */
let APP_MODE = "demo";
const modeDemoBtn = document.getElementById("modeDemo");
const modeLiveBtn = document.getElementById("modeLive");
const modeStatus = document.getElementById("modeStatus");

function setMode(mode) {
  APP_MODE = mode;
  modeDemoBtn?.classList.toggle("is-active", mode === "demo");
  modeLiveBtn?.classList.toggle("is-active", mode === "live");
  if (modeStatus) {
    modeStatus.textContent =
      mode === "demo"
        ? "Demo mode: works offline"
        : "Live mode: calls /api/chat";
  }
}

modeDemoBtn?.addEventListener("click", () => setMode("demo"));
modeLiveBtn?.addEventListener("click", () => setMode("live"));

/* Chat state */
let messages = [
  {
    role: "assistant",
    content:
      "Welcome! This chat uses a Context Engineering layout.\n\nDemo mode works offline.\nLive mode uses a secure backend."
  }
];

function renderMessages() {
  if (!chatLog) return;
  chatLog.innerHTML = "";
  messages.forEach((m) => {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.content;
    chatLog.appendChild(div);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

openChatApp?.addEventListener("click", (e) => {
  e.preventDefault();
  renderMessages();
  openModal(chatModal, chatMessage);
});

chatCloseBtn?.addEventListener("click", () => closeModal(chatModal));
chatCloseBackdrop?.addEventListener("click", () => closeModal(chatModal));

/* Demo response */
function demoReply({ memory, context, userText }) {
  if (/hello|hi/i.test(userText)) {
    return `Hello! 👋\n\nYou're in Demo mode. Switch to Live for real API responses.`;
  }
  if (context && /summarize|rewrite/i.test(userText)) {
    return `Using your provided context:\n\n${context.slice(
      0,
      500
    )}\n\nTell me how you'd like this rewritten.`;
  }
  return "Demo reply: Context-aware behavior simulated locally.";
}

/* Live API */
async function callLiveAPI(payload) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.reply;
}

/* Submit chat */
chatForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatMessage.value.trim();
  if (!text) return;

  messages.push({ role: "user", content: text });
  chatMessage.value = "";
  renderMessages();

  messages.push({ role: "assistant", content: "Thinking…" });
  renderMessages();

  const payload = {
    system: systemPrompt?.value || "",
    memory: memory?.value || "",
    context: retrievedContext?.value || "",
    messages: messages.filter((m) => m.content !== "Thinking…"),
    temperature: Number(temp?.value || 0.7),
    maxTokens: Number(maxTokens?.value || 300),
    userText: text
  };

  try {
    const reply =
      APP_MODE === "demo"
        ? demoReply(payload)
        : await callLiveAPI(payload);

    messages.pop();
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    messages.pop();
    messages.push({
      role: "assistant",
      content: "Live mode failed. Switched to Demo."
    });
    setMode("demo");
  }
  renderMessages();
});

clearChat?.addEventListener("click", () => {
  messages = [{ role: "assistant", content: "Chat cleared." }];
  renderMessages();
});

saveState?.addEventListener("click", () => {
  localStorage.setItem(
    "chatAppState",
    JSON.stringify({
      system: systemPrompt?.value,
      memory: memory?.value,
      context: retrievedContext?.value,
      messages
    })
  );
});

/* ============================
   WHY HIRE ME MODAL + TABS
============================ */
const openWhyHire = document.getElementById("openWhyHire");
const whyHireModal = document.getElementById("whyHireModal");
const whyCloseBtn = document.getElementById("whyCloseBtn");
const whyCloseBackdrop = document.getElementById("whyCloseBackdrop");

openWhyHire?.addEventListener("click", (e) => {
  e.preventDefault();
  openModal(whyHireModal);
  setActiveTab("overview");
});

whyCloseBtn?.addEventListener("click", () => closeModal(whyHireModal));
whyCloseBackdrop?.addEventListener("click", () => closeModal(whyHireModal));

const tabButtons = Array.from(document.querySelectorAll(".tab"));
const panels = {
  overview: document.getElementById("panel-overview"),
  skills: document.getElementById("panel-skills"),
  eduwork: document.getElementById("panel-eduwork")
};

function setActiveTab(key) {
  tabButtons.forEach((b) =>
    b.classList.toggle("is-active", b.dataset.tab === key)
  );

  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("is-active", k === key);
  });

  if (key === "overview") {
    panels.overview.classList.remove("is-animated");
    requestAnimationFrame(() =>
      panels.overview.classList.add("is-animated")
    );
  }

  if (key === "skills") {
    setTimeout(animateSkillBubbles, 60);
  }

  if (key === "eduwork") {
    panels.eduwork.classList.remove("is-animated");
    requestAnimationFrame(() =>
      panels.eduwork.classList.add("is-animated")
    );
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

/* ============================
   RESUME ANALYZER MODAL
============================ */
const openResumeAnalyzer = document.getElementById("openResumeAnalyzer");
const resumeModal = document.getElementById("resumeModal");
const resumeCloseBtn = document.getElementById("resumeCloseBtn");
const resumeCloseBackdrop = document.getElementById("resumeCloseBackdrop");

openResumeAnalyzer?.addEventListener("click", (e) => {
  e.preventDefault();
  openModal(resumeModal);
});

/* ============================
   RESUME ANALYZER — EXAMPLE DATA
============================ */
/* ============================
   RESUME ANALYZER — LOGIC
============================ */
const resumeTextEl = document.getElementById("resumeText");
const jobTextEl = document.getElementById("jobText");
const analyzeBtnEl = document.getElementById("analyzeResume");
const clearBtnEl = document.getElementById("clearResume");

const resumeScoreEl = document.getElementById("resumeScore");
const missingKeywordsEl = document.getElementById("missingKeywords");
const resumeSuggestionsEl = document.getElementById("resumeSuggestions");

// Quick sanity check in console:
console.log("Resume Analyzer elements:", {
  resumeTextEl,
  jobTextEl,
  analyzeBtnEl,
  clearBtnEl,
  resumeScoreEl,
  missingKeywordsEl,
  resumeSuggestionsEl
});

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","if","then","than","to","of","in","on","for","with","as","at","by",
  "is","are","was","were","be","been","being","it","this","that","these","those","you","your","we",
  "our","they","their","from","into","over","under","within","across","per","etc"
]);

function normalizeWords(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\+\#\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function extractKeywords(text) {
  const words = normalizeWords(text);
  const counts = new Map();

  for (const w of words) {
    if (w.length < 3) continue;
    if (STOP_WORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function setSuggestions(items) {
  if (!resumeSuggestionsEl) return;
  resumeSuggestionsEl.innerHTML = "";
  items.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    resumeSuggestionsEl.appendChild(li);
  });
}

analyzeBtnEl?.addEventListener("click", () => {
  console.log("Analyze clicked ✅");

  const resume = resumeTextEl?.value || "";
  const job = jobTextEl?.value || "";

  if (!resume.trim() || !job.trim()) {
    if (resumeScoreEl) resumeScoreEl.textContent = "Match Score: — (paste both resume + job description)";
    if (missingKeywordsEl) missingKeywordsEl.textContent = "—";
    setSuggestions(["Paste both fields, then click Analyze."]);
    return;
  }

  const jobKeywords = extractKeywords(job);
  const resumeWords = new Set(normalizeWords(resume));

  const matched = jobKeywords.filter((k) => resumeWords.has(k));
  const missing = jobKeywords.filter((k) => !resumeWords.has(k));

  const score = Math.round((matched.length / Math.max(jobKeywords.length, 1)) * 100);

  if (resumeScoreEl) {
    resumeScoreEl.textContent = `Match Score: ${score}% (${matched.length}/${jobKeywords.length} keywords matched)`;
  }

  if (missingKeywordsEl) {
    missingKeywordsEl.textContent = missing.length ? missing.join(", ") : "None — great match.";
  }

  setSuggestions([
    `Add 2–3 bullets that include: ${missing.slice(0, 4).join(", ") || "the job’s top keywords"}.`,
    "Mirror the job title and tools in your Summary (if true).",
    "Put the most relevant project first and include measurable impact (time saved, users, accuracy).",
    "Use ATS-friendly formatting: standard headings, consistent dates, simple layout."
  ]);
});

clearBtnEl?.addEventListener("click", () => {
  console.log("Clear clicked ✅");

  if (resumeTextEl) resumeTextEl.value = "";
  if (jobTextEl) jobTextEl.value = "";

  if (resumeScoreEl) resumeScoreEl.textContent = "Match Score: —";
  if (missingKeywordsEl) missingKeywordsEl.textContent = "—";
  setSuggestions(["—"]);
});


// Close via X button
resumeCloseBtn?.addEventListener("click", (e) => {
  e.stopPropagation();           // IMPORTANT
  closeModal(resumeModal);
});

// Close via backdrop
resumeCloseBackdrop?.addEventListener("click", () => {
  closeModal(resumeModal);
});

/* ============================
   IT TROUBLESHOOTING SIMULATOR
============================ */

/* ---------- Scenario Data ---------- */
const TROUBLESHOOT_SCENARIOS = {
  boot: {
    question: "The PC powers on but shows no display. What is your FIRST step?",
    choices: [
      {
        text: "Check monitor and cable connections",
        correct: true,
        explanation: "Always verify external connections before internal hardware changes."
      },
      {
        text: "Replace the motherboard",
        correct: false,
        explanation: "Major hardware replacement should never be the first step."
      },
      {
        text: "Reinstall the operating system",
        correct: false,
        explanation: "Software fixes come after confirming hardware output."
      }
    ]
  },

  network: {
    question: "Multiple users report no internet access. What should you check first?",
    choices: [
      {
        text: "Verify router and network connectivity",
        correct: true,
        explanation: "Checking shared infrastructure helps isolate the root cause."
      },
      {
        text: "Replace individual laptops",
        correct: false,
        explanation: "A shared issue points to the network, not individual devices."
      },
      {
        text: "Reset user passwords",
        correct: false,
        explanation: "Authentication issues do not affect network connectivity."
      }
    ]
  },

  battery: {
    question: "A mobile device battery drains quickly. What is the FIRST action?",
    choices: [
      {
        text: "Check battery health and usage statistics",
        correct: true,
        explanation: "Gathering data comes before hardware replacement."
      },
      {
        text: "Replace the battery immediately",
        correct: false,
        explanation: "You should diagnose the issue before replacing components."
      },
      {
        text: "Factory reset the device",
        correct: false,
        explanation: "This is a last-resort troubleshooting step."
      }
    ]
  }
};

/* ---------- Element References ---------- */
const openTroubleshootSim = document.getElementById("openTroubleshootSim");
const troubleshootModal = document.getElementById("troubleshootModal");
const troubleshootCloseBtn = document.getElementById("troubleshootCloseBtn");
const troubleshootCloseBackdrop = document.getElementById("troubleshootCloseBackdrop");

const scenarioSelect = document.getElementById("scenarioSelect");
const scenarioPanel = document.getElementById("scenarioPanel");
const scenarioQuestion = document.getElementById("scenarioQuestion");
const scenarioChoices = document.getElementById("scenarioChoices");

/* ---------- Open / Close Modal ---------- */
openTroubleshootSim?.addEventListener("click", (e) => {
  e.preventDefault();
  openModal(troubleshootModal);
});

troubleshootCloseBtn?.addEventListener("click", () => {
  closeModal(troubleshootModal);
});

troubleshootCloseBackdrop?.addEventListener("click", () => {
  closeModal(troubleshootModal);
});

/* ---------- Scenario Selection ---------- */
scenarioSelect?.addEventListener("change", () => {
  const key = scenarioSelect.value;
  const scenario = TROUBLESHOOT_SCENARIOS[key];

  // If no scenario selected
  if (!scenario) {
    scenarioPanel.classList.remove("is-visible");
    scenarioQuestion.textContent = "";
    scenarioChoices.innerHTML = "";
    return;
  }

  // Show panel
  scenarioPanel.classList.add("is-visible");

  // Set question
  scenarioQuestion.textContent = scenario.question;

  // Clear old choices
  scenarioChoices.innerHTML = "";

  // Render choices
  scenario.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "small-btn troubleshoot-choice";
    btn.textContent = choice.text;

    btn.addEventListener("click", () => {
      // Disable all buttons after selection
      scenarioChoices.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
      });

      // Mark correct / incorrect
      btn.classList.add(choice.correct ? "is-correct" : "is-wrong");

      // Add explanation text
      const explanation = document.createElement("span");
      explanation.textContent = choice.explanation;
      btn.appendChild(explanation);
    });

    scenarioChoices.appendChild(btn);
  });
});

/* ---------- ESC Key Support ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (troubleshootModal?.classList.contains("is-open")) {
    closeModal(troubleshootModal);
  }
});


/* ============================
   SKILL BUBBLE ANIMATION
============================ */
function animateSkillBubbles() {
  const wrap = document.getElementById("skillBubbles");
  if (!wrap) return;

  wrap.querySelectorAll(".bubble").forEach((bubble) => {
    bubble.style.setProperty("--p", 0);
    const target = Number(bubble.dataset.percent || 100);
    const start = performance.now();
    const duration = 900;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      bubble.style.setProperty("--p", Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}


/* ============================
   UI ANIMATION DEMO MODAL (SAFE)
   (Only runs if the elements exist)
============================ */

const openUiDemo = document.getElementById("openUiDemo");
const uiModal = document.getElementById("uiModal");
const uiCloseBtn = document.getElementById("uiCloseBtn");
const uiCloseBackdrop = document.getElementById("uiCloseBackdrop");

openUiDemo?.addEventListener("click", (e) => {
  e.preventDefault();
  openModal(uiModal);
});

uiCloseBtn?.addEventListener("click", () => closeModal(uiModal));
uiCloseBackdrop?.addEventListener("click", () => closeModal(uiModal));

/* ============================
   JOB TRACKER AI (opens Next.js app)
============================ */
function openJobTracker() {
  // local Next.js app
  const LOCAL = "http://localhost:3000/dashboard";

  // production (set this after you deploy job-tracker)
  const PROD = "https://YOUR-JOB-TRACKER-URL.vercel.app/dashboard";

  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  const url = isLocal ? LOCAL : PROD;
  window.open(url, "_blank", "noopener,noreferrer");
}

// One handler for all your cards/buttons using data-open
document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-open");

    if (key === "job-tracker") {
      openJobTracker();
      return;
    }

    // keep your existing logic for other buttons here (if you add more later)
  });
});


/* ============================
   ESC KEY HANDLING
============================ */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (chatModal?.classList.contains("is-open")) closeModal(chatModal);
  if (whyHireModal?.classList.contains("is-open")) closeModal(whyHireModal);
  if (uiModal?.classList.contains("is-open")) closeModal(uiModal);
  if (resumeModal?.classList.contains("is-open")) closeModal(resumeModal);
});
