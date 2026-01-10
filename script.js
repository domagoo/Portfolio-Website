

document.querySelectorAll("[data-target]").forEach((btn) => {

  btn.addEventListener("click", () => {

    const target = btn.getAttribute("data-target");

    const el = document.querySelector(target);

    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

  });

});


document.getElementById("year").textContent = new Date().getFullYear();

/* ============================

   CHAT APP MODAL ELEMENTS

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

/* ============================

   MODE TOGGLE (DEMO / LIVE)

============================ */

let APP_MODE = "demo"; // demo | live


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

/* ============================   CHAT STATE============================ */
let messages = [{
    role: "assistant",
    content:
    "Welcome! This chat uses a Context Engineering layout.\n\nDemo mode works offline.\nLive mode uses a real API via a secure backend."
}
];

/* ============================

   RENDER CHAT

============================ */

function renderMessages() {

  chatLog.innerHTML = "";


  messages.forEach((m) => {

    const div = document.createElement("div");

    div.className = `msg ${m.role === "user" ? "user" : "assistant"}`;

    div.textContent = m.content;

    chatLog.appendChild(div);

  });


  chatLog.scrollTop = chatLog.scrollHeight;

}

/* ============================

   MODAL OPEN / CLOSE

============================ */

function openModal() {

  chatModal.classList.add("is-open");

  chatModal.setAttribute("aria-hidden", "false");

  renderMessages();

  setTimeout(() => chatMessage.focus(), 0);

}


function closeModal() {

  chatModal.classList.remove("is-open");

  chatModal.setAttribute("aria-hidden", "true");

}


openChatApp?.addEventListener("click", (e) => {

  e.preventDefault();

  openModal();

});


chatCloseBtn?.addEventListener("click", closeModal);

chatCloseBackdrop?.addEventListener("click", closeModal);


document.addEventListener("keydown", (e) => {

  if (e.key === "Escape" && chatModal.classList.contains("is-open")) {

    closeModal();

  }

});


/* ============================

   DEMO MODE RESPONSE (LOCAL)

============================ */

function demoReply({ system, memory, context, userText }) {

  const hasContext = context && context.trim().length > 0;

  const q = userText.toLowerCase();


  if (q.includes("about") || q.includes("bio")) {

    return (

      "Here are two About Me options:\n\n" +

      "1) Front-end developer focused on clean UI, JavaScript logic, and smooth animations.\n" +

      "2) Developer passionate about interactive web experiences and modern UX patterns.\n\n" +

      "Want it more technical or more recruiter-friendly?"

    );

  }


  if (q.includes("project")) {

    return (

      "Portfolio tip:\n" +

      "- Include a live demo\n" +

      "- Add GitHub links\n" +

      "- Explain the problem → solution → tech\n\n" +

      "Which project do you want to improve first?"

    );

  }


  if (!hasContext && q.includes("context")) {

    return "No retrieved context detected. Paste something into the Context panel and ask again.";

  }


  if (hasContext && q.includes("summarize")) {

    return `Using your retrieved context:\n\n${context.slice(0, 800)}\n\nWant a recruiter-friendly rewrite?`;

  }


  return (

    "Demo reply:\n\n" +

    "This mode simulates context-aware behavior without calling an API.\n" +

    "Switch to Live mode for real AI responses."

  );

}

/* ============================

   LIVE MODE API CALL

============================ */

async function callLiveAPI(payload) {

  const res = await fetch("/api/chat", {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(payload)

  });


  if (!res.ok) {

    const err = await res.text();

    throw new Error(err || "Live API error");

  }


  const data = await res.json();

  return data.reply;

}

/* ============================

   FORM SUBMIT

============================ */

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

    system: systemPrompt.value,

    memory: memory.value,

    context: retrievedContext.value,

    messages: messages.filter((m) => m.content !== "Thinking…"),

    temperature: Number(temp.value || 0.7),

    maxTokens: Number(maxTokens.value || 300),

    userText: text

  };


  try {

    let reply;


    if (APP_MODE === "demo") {

      reply = demoReply(payload);

    } else {

      reply = await callLiveAPI(payload);

    }


    messages.pop();

    messages.push({ role: "assistant", content: reply });

    renderMessages();

  } catch (err) {

    messages.pop();

    messages.push({

      role: "assistant",

      content:

        "Live mode failed. Switched back to Demo.\n\nError: " + err.message

    });

    setMode("demo");

    renderMessages();

  }

});


/* ============================

   CLEAR / SAVE

============================ */

clearChat?.addEventListener("click", () => {

  messages = [{ role: "assistant", content: "Chat cleared. What would you like to try next?" }];

  renderMessages();

});


saveState?.addEventListener("click", () => {

  const state = {

    system: systemPrompt.value,

    memory: memory.value,

    context: retrievedContext.value,

    messages,

    temperature: temp.value,

    maxTokens: maxTokens.value

  };

  localStorage.setItem("chatAppState", JSON.stringify(state));

  messages.push({ role: "assistant", content: "State saved to localStorage ✅" });

  renderMessages();

});


/* ============================

   LOAD SAVED STATE

============================ */

(function loadState() {

  const raw = localStorage.getItem("chatAppState");

  if (!raw) return;


  try {

    const state = JSON.parse(raw);

    systemPrompt.value = state.system || systemPrompt.value;

    memory.value = state.memory || memory.value;

    retrievedContext.value = state.context || retrievedContext.value;

    temp.value = state.temperature || temp.value;

    maxTokens.value = state.maxTokens || maxTokens.value;

    messages = Array.isArray(state.messages) ? state.messages : messages;

  } catch {

    // ignore corrupt state

  }

})();