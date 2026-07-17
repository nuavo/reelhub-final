const SUPABASE_URL = "https://gqcufcbkadmysqqgbstu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3VmY2JrYWRteXNxcWdic3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MjI3NDQsImV4cCI6MjA5OTM5ODc0NH0.ODYPL5sGSlhrMtKPfKsnLLdIQ9YGBJXNwVbsECKp1XA";
let db = null;
let demoMode = true;
try {
  if (SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    demoMode = false;
  }
} catch (e) { demoMode = true; }

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.view).classList.add("active");
  });
});

let localProjects = [];
let localInvestors = [];
let localCrew = [];
let localBudget = [];
let localGrants = [];
let localMessages = [];

async function persist(table, row) {
  if (demoMode || !db) return { data: row, error: null };
  return await db.from(table).insert(row).select();
}

document.getElementById("project-form").addEventListener("submit", async e => {
  e.preventDefault();
  const proj = {
    title: document.getElementById("proj-title").value,
    logline: document.getElementById("proj-logline").value,
    runtime: document.getElementById("proj-runtime").value,
    stage: document.getElementById("proj-stage").value,
    deadline: document.getElementById("proj-deadline").value
  };
  await persist("projects", proj);
  localProjects.push(proj);
  renderList("project-list", localProjects, p => `<strong>${p.title}</strong> — ${p.stage}<br><small>${p.logline}</small><br><small>Deadline: ${p.deadline || "TBD"}</small>`);
  e.target.reset();
});

document.getElementById("investor-form").addEventListener("submit", async e => {
  e.preventDefault();
  const inv = {
    name: document.getElementById("inv-name").value,
    type: document.getElementById("inv-type").value,
    stage: document.getElementById("inv-stage").value,
    amount: Number(document.getElementById("inv-amount").value) || 0,
    notes: document.getElementById("inv-notes").value
  };
  await persist("investors", inv);
  localInvestors.push(inv);
  renderList("investor-list", localInvestors, i => `<strong>${i.name}</strong> — ${i.type}<br><small>Stage: ${i.stage} | Amount: $${i.amount.toLocaleString()}</small><br><small>${i.notes}</small>`);
  updateDashboard();
  e.target.reset();
});

document.getElementById("crew-form").addEventListener("submit", async e => {
  e.preventDefault();
  const c = {
    name: document.getElementById("crew-name").value,
    role: document.getElementById("crew-role").value,
    credits: document.getElementById("crew-credits").value,
    contact: document.getElementById("crew-contact").value
  };
  await persist("crew", c);
  localCrew.push(c);
  renderList("crew-list", localCrew, c => `<strong>${c.name}</strong> — ${c.role}<br><small>${c.credits}</small><br><small>${c.contact}</small>`);
  e.target.reset();
});

document.getElementById("budget-form").addEventListener("submit", async e => {
  e.preventDefault();
  const b = {
    item: document.getElementById("budget-item").value,
    estimated: Number(document.getElementById("budget-estimated").value) || 0,
    status: document.getElementById("budget-status").value
  };
  await persist("budget_items", b);
  localBudget.push(b);
  renderList("budget-list", localBudget, b => `<strong>${b.item}</strong> — $${b.estimated.toLocaleString()}<br><small>Status: ${b.status}</small>`);
  const total = localBudget.reduce((s,b)=>s+b.estimated,0);
  document.getElementById("budget-total").textContent = "$" + total.toLocaleString();
  updateDashboard();
  e.target.reset();
});

document.getElementById("grant-form").addEventListener("submit", async e => {
  e.preventDefault();
  const g = {
    name: document.getElementById("grant-name").value,
    type: document.getElementById("grant-type").value,
    deadline: document.getElementById("grant-deadline").value,
    value: Number(document.getElementById("grant-value").value) || 0,
    status: document.getElementById("grant-status").value
  };
  await persist("grants", g);
  localGrants.push(g);
  renderList("grant-list", localGrants, g => `<strong>${g.name}</strong> — ${g.type}<br><small>Deadline: ${g.deadline||"TBD"} | Value: $${g.value.toLocaleString()}</small><br><small>Status: ${g.status}</small>`);
  updateDashboard();
  e.target.reset();
});

document.getElementById("chat-form").addEventListener("submit", async e => {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const msg = { text: input.value, time: new Date().toLocaleTimeString() };
  await persist("messages", msg);
  localMessages.push(msg);
  const el = document.getElementById("chat-messages");
  el.innerHTML = localMessages.map(m => `<div class="list-item">${m.text} <small>(${m.time})</small></div>`).join("");
  el.scrollTop = el.scrollHeight;
  input.value = "";
});

document.getElementById("generate-pitch-btn").addEventListener("click", () => {
  const totalBudget = localBudget.reduce((s,b)=>s+b.estimated,0);
  const raised = localInvestors.filter(i=>i.stage==="Committed"||i.stage==="Funded").reduce((s,i)=>s+i.amount,0);
  let out = "REEL HUB — INVESTOR SNAPSHOT\n\n";
  out += `Project: ${localProjects[0]?.title || "Untitled"}\n`;
  out += `Stage: ${localProjects[0]?.stage || "N/A"}\n\n`;
  out += `Budget: $${totalBudget.toLocaleString()} | Raised: $${raised.toLocaleString()} | Gap: $${Math.max(totalBudget-raised,0).toLocaleString()}\n\n`;
  out += "CREW:\n" + localCrew.map(c => `- ${c.name}, ${c.role} (${c.credits})`).join("\n") + "\n\n";
  out += "COMMITTED INVESTORS:\n" + localInvestors.filter(i=>i.stage==="Committed"||i.stage==="Funded").map(i=>`- ${i.name}: $${i.amount.toLocaleString()}`).join("\n");
  document.getElementById("pitch-output").textContent = out;
});

function renderList(elId, arr, tpl) {
  document.getElementById(elId).innerHTML = arr.map(x => `<div class="list-item">${tpl(x)}</div>`).join("");
}

function updateDashboard() {
  const totalBudget = localBudget.reduce((s,b)=>s+b.estimated,0);
  const raised = localInvestors.filter(i=>i.stage==="Committed"||i.stage==="Funded").reduce((s,i)=>s+i.amount,0);
  document.getElementById("stat-budget").textContent = "$" + totalBudget.toLocaleString();
  document.getElementById("stat-raised").textContent = "$" + raised.toLocaleString();
  document.getElementById("stat-gap").textContent = "$" + Math.max(totalBudget-raised,0).toLocaleString();
  document.getElementById("stat-investors").textContent = localInvestors.filter(i=>i.stage==="Committed"||i.stage==="Funded").length;
  document.getElementById("grant-deadline-list").innerHTML = localGrants.filter(g=>g.deadline).map(g=>`<li>${g.name} — ${g.deadline}</li>`).join("") || '<li class="muted">None yet</li>';
  document.getElementById("investors-in-talks-list").innerHTML = localInvestors.filter(i=>i.stage==="In Talks"||i.stage==="Pitched").map(i=>`<li>${i.name} ($${i.amount.toLocaleString()})</li>`).join("") || '<li class="muted">None yet</li>';
}

document.getElementById("google-login").addEventListener("click", async () => {
  if (demoMode || !db) { alert("Demo mode: add your Supabase URL/anon key in app.js to enable real sign-in."); return; }
  await db.auth.signInWithOAuth({ provider: "google" });
});
