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
   ESC KEY HANDLING
============================ */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (chatModal?.classList.contains("is-open")) closeModal(chatModal);
  if (whyHireModal?.classList.contains("is-open")) closeModal(whyHireModal);
  if (uiModal?.classList.contains("is-open")) closeModal(uiModal);
});
