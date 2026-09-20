/* ============================================================
   Giobari Daniel — Portfolio · Admin dashboard application
   Firebase Authentication gates this entire view. All content
   operations are real Firestore CRUD protected by security rules.
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
  DEFAULT_SETTINGS, mergeSettings, SAMPLE_PROJECTS, SAMPLE_SERVICES, SAMPLE_SKILLS
} from "./sample-data.js";

/* ---------------- Utilities ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const esc = (v) => String(v == null ? "" : v)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const lines = (v) => String(v || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const list = (v) => Array.isArray(v) ? v.map(s => String(s).trim()).filter(Boolean)
  : String(v || "").split(",").map(s => s.trim()).filter(Boolean);
const slugify = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";

const sortered = (arr) => [...arr].sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999));

function fmtDate(ts) {
  try {
    const d = ts && typeof ts.toDate === "function" ? ts.toDate() : (ts ? new Date(ts) : null);
    if (!d || isNaN(d)) return "—";
    return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return "—"; }
}

function toast(msg, type = "") {
  const wrap = $("#toast-wrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<svg class="icon"><use href="#${type === "bad" ? "i-x" : "i-check"}"/></svg><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 320); }, 4200);
}

function confirmDlg(title, text, yesLabel = "Delete") {
  return new Promise((resolve) => {
    const dlg = $("#confirm-dlg");
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    $("#confirm-yes").textContent = yesLabel;
    const done = (val) => { dlg.close(); resolve(val); };
    $("#confirm-yes").onclick = () => done(true);
    $("#confirm-no").onclick = () => done(false);
    dlg.addEventListener("close", () => resolve(false), { once: true });
    dlg.showModal();
  });
}

function btnLoading(btn, on, label) {
  if (on) {
    btn.dataset.label = btn.querySelector("span") ? btn.querySelector("span").textContent : btn.textContent;
    btn.disabled = true;
    if (btn.querySelector("span")) btn.querySelector("span").textContent = label || "Working…";
  } else {
    btn.disabled = false;
    if (btn.querySelector("span")) btn.querySelector("span").textContent = btn.dataset.label || "Save";
  }
}

/* ---------------- Cache ---------------- */
const cache = { projects: [], services: [], skills: [], testimonials: [], messages: [], settingsExists: false, rulesOk: true };
let editing = { projectId: null, serviceId: null, skillId: null, testimonialId: null };
let msgFilter = "all";
let msgUnsub = null;

/* ---------------- Auth gating ---------------- */
onAuthStateChanged(auth, (user) => {
  if (user) {
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    const email = user.email || "admin";
    $("#sb-email").textContent = email;
    $("#sb-ava").textContent = email.slice(0, 1).toUpperCase();
    boot();
  } else {
    $("#login-view").hidden = false;
    $("#app-view").hidden = true;
    if (msgUnsub) { msgUnsub(); msgUnsub = null; }
  }
});

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#lg-email").value.trim();
  const pass = $("#lg-pass").value;
  const errEl = $("#login-err");
  errEl.style.display = "none";
  if (!email || !pass) { errEl.textContent = "Enter your email and password."; errEl.style.display = "block"; return; }
  const btn = $("#login-btn");
  btnLoading(btn, true, "Signing in…");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    const map = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/user-not-found": "No account found with that email.",
      "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
      "auth/network-request-failed": "Network problem — check your connection and try again.",
      "auth/invalid-email": "That email address looks invalid."
    };
    errEl.textContent = map[err.code] || "Sign-in failed — please try again.";
    errEl.style.display = "block";
  } finally {
    btnLoading(btn, false);
  }
});

$("#forgot-btn").addEventListener("click", async () => {
  const email = $("#lg-email").value.trim();
  if (!email) { toast("Enter your email above first, then press Forgot password.", "bad"); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    toast("Password reset email sent — check your inbox.", "good");
  } catch (err) {
    toast(err.code === "auth/user-not-found" ? "No account found with that email." : "Could not send reset email — try again.", "bad");
  }
});

$("#logout-btn").addEventListener("click", () => signOut(auth));

/* ---------------- Navigation ---------------- */
const PANEL_TITLES = { dashboard: "Dashboard", projects: "Projects", services: "Services", skills: "Skills", testimonials: "Testimonials", messages: "Messages", settings: "Settings" };

function goto(panel) {
  $$(".panel").forEach(p => p.classList.toggle("active", p.dataset.panel === panel));
  $$("#snav button").forEach(b => b.classList.toggle("active", b.dataset.nav === panel));
  $("#topbar-title").textContent = PANEL_TITLES[panel] || "Admin";
  $("#sidebar").classList.remove("open");
  $(".sb-backdrop") && $(".sb-backdrop").remove();
  window.scrollTo({ top: 0 });
  if (panel !== "projects") showProjectList();
  if (panel !== "services") showServiceList();
  if (panel !== "skills") showSkillList();
  if (panel !== "testimonials") showTestimonialList();
}

$$("#snav button").forEach(b => b.addEventListener("click", () => goto(b.dataset.nav)));
$$("[data-goto]").forEach(b => b.addEventListener("click", () => {
  goto(b.dataset.goto);
  if (b.dataset.new === "1") openProjectEditor(null);
}));

$("#sb-toggle").addEventListener("click", () => {
  $("#sidebar").classList.add("open");
  const bd = document.createElement("div");
  bd.className = "sb-backdrop";
  bd.addEventListener("click", () => { $("#sidebar").classList.remove("open"); bd.remove(); });
  document.body.appendChild(bd);
});
$("#sb-close").addEventListener("click", () => { $("#sidebar").classList.remove("open"); $(".sb-backdrop") && $(".sb-backdrop").remove(); });

/* ---------------- Data loading ---------------- */
async function fetchCol(name) {
  try {
    const snap = await getDocs(collection(db, name));
    cache.rulesOk = cache.rulesOk && true;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    if (err && err.code === "permission-denied") cache.rulesOk = false;
    console.warn(`[admin] load ${name}:`, err && err.code);
    return [];
  }
}

async function boot() {
  const [projects, services, skills, testimonials] = await Promise.all([
    fetchCol("projects"), fetchCol("services"), fetchCol("skills"), fetchCol("testimonials")
  ]);
  cache.projects = sortered(projects);
  cache.services = sortered(services);
  cache.skills = sortered(skills);
  cache.testimonials = sortered(testimonials);

  try {
    const snap = await getDoc(doc(db, "settings", "general"));
    cache.settingsExists = snap.exists();
  } catch (err) {
    if (err && err.code === "permission-denied") cache.rulesOk = false;
  }

  subscribeMessages();
  renderDashboard();
  renderProjects();
  renderServices();
  renderSkills();
  renderTestimonials();
  renderSetupCard();
  await loadSettingsForm();
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const unread = cache.messages.filter(m => !m.read).length;
  const stats = [
    ["Projects", cache.projects.length], ["Published", cache.projects.filter(p => p.published !== false).length],
    ["Featured", cache.projects.filter(p => p.featured).length], ["Services", cache.services.length],
    ["Skills", cache.skills.length], ["Testimonials", cache.testimonials.length],
    ["Messages", cache.messages.length], ["Unread", unread, unread > 0]
  ];
  $("#stat-grid").innerHTML = stats.map(([label, val, alert]) =>
    `<div class="stat${alert ? " alert" : ""}"><b>${val}</b><span>${label}</span></div>`).join("");

  const badge = $("#unread-badge");
  badge.hidden = unread === 0;
  badge.textContent = unread;

  const pj = cache.projects.slice(-4).reverse();
  $("#dash-projects").innerHTML = pj.length ? pj.map(p => `
    <div class="mini-row">
      <img src="${esc(p.thumbnail || "")}" alt="" onerror="this.style.visibility='hidden'">
      <span class="grow"><b>${esc(p.title || "Untitled")}</b><span>${esc(p.category || "")}${p.year ? " · " + esc(p.year) : ""}</span></span>
      <span class="chip ${p.published !== false ? "ok" : "off"}">${p.published !== false ? "Live" : "Draft"}</span>
    </div>`).join("") : `<div class="empty">No projects yet.<br>Add your first project to see it here.</div>`;

  const ms = cache.messages.slice(0, 4);
  $("#dash-messages").innerHTML = ms.length ? ms.map(m => `
    <div class="mini-row">
      <span class="dot${m.read ? " read" : ""}"></span>
      <span class="grow"><b>${esc(m.name || "Anonymous")}</b><span>${esc((m.message || "").slice(0, 60))}${(m.message || "").length > 60 ? "…" : ""}</span></span>
      <span class="small mono muted">${fmtDate(m.createdAt).split(",")[0]}</span>
    </div>`).join("") : `<div class="empty">No messages yet.<br>Contact form submissions will appear here.</div>`;
}

function renderSetupCard() {
  const steps = [];
  steps.push(`<li class="done"><b>Admin account</b> — you are signed in.</li>`);
  steps.push(cache.rulesOk
    ? `<li class="done"><b>Security rules</b> — Firestore access works.</li>`
    : `<li><b>Security rules</b> — Firestore denied access. Deploy <code>firestore.rules</code> from the Firebase console (Firestore &rarr; Rules).</li>`);
  steps.push(cache.projects.length
    ? `<li class="done"><b>Content</b> — ${cache.projects.length} project(s) created.</li>`
    : `<li><b>Content</b> — no projects yet. Load the sample content below or add your own.</li>`);
  steps.push(cache.settingsExists
    ? `<li class="done"><b>Settings</b> — saved. The site reads your live content.</li>`
    : `<li><b>Settings</b> — not saved yet. Open Settings and press "Save settings" to switch the public site from samples to your data.</li>`);

  const card = $("#setup-card");
  if (cache.projects.length && cache.settingsExists && cache.rulesOk) { card.hidden = true; return; }
  card.hidden = false;
  $("#setup-steps").innerHTML = steps.join("");
}

$("#seed-btn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (cache.projects.length) {
    const ok = await confirmDlg("Load sample content?", "Sample projects and services will be added alongside your existing content. You can edit or delete them any time.", "Load samples");
    if (!ok) return;
  }
  btnLoading(btn, true, "Loading…");
  try {
    const batch = writeBatch(db);
    SAMPLE_PROJECTS.forEach(({ id, ...data }) => batch.set(doc(db, "projects", id), data));
    SAMPLE_SERVICES.forEach(({ id, ...data }) => batch.set(doc(db, "services", id), data));
    SAMPLE_SKILLS.forEach(({ id, ...data }) => batch.set(doc(db, "skills", id), data));
    await batch.commit();
    toast("Sample content loaded — edit or replace it any time.", "good");
    await boot();
  } catch (err) {
    console.warn(err);
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not load samples — try again.", "bad");
  } finally { btnLoading(btn, false); }
});
/* ---------------- Projects CRUD ---------------- */
function showProjectList() {
  $("#project-editor").hidden = true;
  $("#projects-list-view").hidden = false;
}

function openProjectEditor(id) {
  editing.projectId = id || null;
  const p = id ? cache.projects.find(x => x.id === id) : null;
  $("#proj-editor-title").textContent = p ? "Edit project" : "New project";
  $("#proj-form").reset();
  $("#pf-title").value = p?.title || "";
  $("#pf-slug").value = p?.slug || "";
  $("#pf-category").value = p?.category || "Websites";
  $("#pf-year").value = p?.year || "";
  $("#pf-client").value = p?.client || "";
  $("#pf-order").value = p?.order ?? nextOrder(cache.projects);
  $("#pf-thumb").value = p?.thumbnail || "";
  $("#pf-gallery").value = (p?.gallery || []).join("\n");
  $("#pf-desc").value = p?.description || "";
  $("#pf-tech").value = (p?.technologies || []).join(", ");
  $("#pf-overview").value = p?.overview || "";
  $("#pf-problem").value = p?.problem || "";
  $("#pf-solution").value = p?.solution || "";
  $("#pf-built").value = p?.whatIBuilt || "";
  $("#pf-features").value = p?.features || "";
  $("#pf-design").value = p?.designNotes || "";
  $("#pf-results").value = p?.results || "";
  $("#pf-live").value = p?.liveUrl || "";
  $("#pf-github").value = p?.githubUrl || "";
  $("#pf-published").checked = p ? p.published !== false : true;
  $("#pf-featured").checked = !!p?.featured;
  $("#pf-sample").checked = !!p?.sample;
  thumbPreview();
  $("#projects-list-view").hidden = true;
  $("#project-editor").hidden = false;
  window.scrollTo({ top: 0 });
  $("#pf-title").focus();
}

function nextOrder(arr) { return arr.reduce((m, x) => Math.max(m, Number(x.order) || 0), 0) + 1; }

function thumbPreview() {
  const url = $("#pf-thumb").value.trim();
  const img = $("#pf-thumb-preview");
  if (!url) { img.style.display = "none"; return; }
  img.src = url;
  img.style.display = "block";
  img.onerror = () => { img.style.display = "none"; };
}

$("#pf-thumb").addEventListener("change", thumbPreview);
$("#new-project-btn").addEventListener("click", () => openProjectEditor(null));
$("#proj-back").addEventListener("click", showProjectList);
$("#proj-cancel").addEventListener("click", showProjectList);
$("#pf-title").addEventListener("blur", () => { if (!$("#pf-slug").value.trim()) $("#pf-slug").value = slugify($("#pf-title").value); });

$("#proj-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("#pf-title").value.trim();
  const thumb = $("#pf-thumb").value.trim();
  const desc = $("#pf-desc").value.trim();
  const err = !title ? "Give the project a title." : !thumb ? "Add a thumbnail image URL." : !desc ? "Write a short description." : null;
  if (err) { toast(err, "bad"); return; }

  const btn = $("#proj-save");
  btnLoading(btn, true, "Saving…");
  const data = {
    title,
    slug: slugify($("#pf-slug").value.trim() || title),
    category: $("#pf-category").value,
    year: $("#pf-year").value.trim(),
    client: $("#pf-client").value.trim(),
    order: Number($("#pf-order").value) || nextOrder(cache.projects),
    thumbnail: thumb,
    gallery: lines($("#pf-gallery").value),
    description: desc,
    technologies: list($("#pf-tech").value),
    overview: $("#pf-overview").value.trim(),
    problem: $("#pf-problem").value.trim(),
    solution: $("#pf-solution").value.trim(),
    whatIBuilt: $("#pf-built").value.trim(),
    features: $("#pf-features").value.trim(),
    designNotes: $("#pf-design").value.trim(),
    results: $("#pf-results").value.trim(),
    liveUrl: $("#pf-live").value.trim(),
    githubUrl: $("#pf-github").value.trim(),
    published: $("#pf-published").checked,
    featured: $("#pf-featured").checked,
    sample: $("#pf-sample").checked,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing.projectId) {
      await updateDoc(doc(db, "projects", editing.projectId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "projects"), data);
    }
    toast("Project saved.", "good");
    await refreshProjects();
    showProjectList();
  } catch (err2) {
    console.warn(err2);
    toast(err2.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not save — try again.", "bad");
  } finally { btnLoading(btn, false); }
});

async function refreshProjects() {
  cache.projects = sortered(await fetchCol("projects"));
  renderProjects();
  renderDashboard();
  renderSetupCard();
}

function renderProjects() {
  const wrap = $("#projects-list");
  if (!cache.projects.length) {
    wrap.innerHTML = `<div class="empty"><b>No projects yet.</b>Add your first project, or load the sample content from the dashboard.</div>`;
    $("#projects-sub").textContent = "Digital products and visual design work shown on the site.";
    return;
  }
  wrap.innerHTML = cache.projects.map((p, i) => `
    <div class="lrow">
      <img class="thumb" src="${esc(p.thumbnail || "")}" alt="" onerror="this.style.visibility='hidden'">
      <div class="t"><b>${esc(p.title || "Untitled")}</b><span>${esc(p.category || "Uncategorized")}${p.year ? " · " + esc(p.year) : ""}${p.client ? " · " + esc(p.client) : ""}</span></div>
      <div class="chips">
        <span class="chip ${p.published !== false ? "ok" : "off"}">${p.published !== false ? "Published" : "Draft"}</span>
        ${p.featured ? `<span class="chip acc">Featured</span>` : ""}
        ${p.sample ? `<span class="chip">Sample</span>` : ""}
      </div>
      <div class="actions">
        <button class="icon-btn" title="Move up" data-pmove="up" data-id="${esc(p.id)}" data-i="${i}" ${i === 0 ? "disabled" : ""}><svg class="icon"><use href="#i-up"/></svg></button>
        <button class="icon-btn" title="Move down" data-pmove="down" data-id="${esc(p.id)}" data-i="${i}" ${i === cache.projects.length - 1 ? "disabled" : ""}><svg class="icon"><use href="#i-down"/></svg></button>
        <button class="icon-btn" title="${p.published !== false ? "Unpublish" : "Publish"}" data-ptoggle="published" data-id="${esc(p.id)}"><svg class="icon"><use href="#i-eye"/></svg></button>
        <button class="icon-btn" title="Edit" data-pedit="${esc(p.id)}"><svg class="icon"><use href="#i-edit"/></svg></button>
        <button class="icon-btn danger" title="Delete" data-pdel="${esc(p.id)}"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
    </div>`).join("");
}

$("#projects-list").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-pedit]");
  const del = e.target.closest("[data-pdel]");
  const tog = e.target.closest("[data-ptoggle]");
  const mv = e.target.closest("[data-pmove]");
  if (edit) openProjectEditor(edit.dataset.pedit);
  if (del) {
    const p = cache.projects.find(x => x.id === del.dataset.pdel);
    if (p && await confirmDlg("Delete project?", `"${p.title || "Untitled"}" will be removed from the website permanently.`)) {
      await deleteDoc(doc(db, "projects", p.id));
      toast("Project deleted.", "good");
      await refreshProjects();
    }
  }
  if (tog) {
    const p = cache.projects.find(x => x.id === tog.dataset.id);
    if (p) {
      await updateDoc(doc(db, "projects", p.id), { published: p.published === false });
      toast(p.published === false ? "Project published." : "Project unpublished.", "good");
      await refreshProjects();
    }
  }
  if (mv) {
    const i = Number(mv.dataset.i);
    const a = cache.projects[i], b = cache.projects[mv.dataset.pmove === "up" ? i - 1 : i + 1];
    if (a && b) {
      await updateDoc(doc(db, "projects", a.id), { order: Number(b.order) || i });
      await updateDoc(doc(db, "projects", b.id), { order: Number(a.order) || i + 1 });
      await refreshProjects();
    }
  }
});

/* ---------------- Services CRUD ---------------- */
function showServiceList() { $("#service-editor").hidden = true; $("#services-list-view").hidden = false; }

function openServiceEditor(id) {
  editing.serviceId = id || null;
  const s = id ? cache.services.find(x => x.id === id) : null;
  $("#srv-editor-title").textContent = s ? "Edit service" : "New service";
  $("#srv-form").reset();
  $("#sf-title").value = s?.title || "";
  $("#sf-desc").value = s?.description || "";
  $("#sf-icon").value = s?.icon || "spark";
  $("#sf-order").value = s?.order ?? nextOrder(cache.services);
  $("#sf-published").checked = s ? s.published !== false : true;
  $("#services-list-view").hidden = true;
  $("#service-editor").hidden = false;
  $("#sf-title").focus();
}

$("#new-service-btn").addEventListener("click", () => openServiceEditor(null));
$("#srv-back").addEventListener("click", showServiceList);
$("#srv-cancel").addEventListener("click", showServiceList);

$("#srv-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("#sf-title").value.trim();
  const description = $("#sf-desc").value.trim();
  if (!title || !description) { toast("Title and description are required.", "bad"); return; }
  const btn = $("#srv-save");
  btnLoading(btn, true, "Saving…");
  const data = {
    title, description,
    icon: $("#sf-icon").value,
    order: Number($("#sf-order").value) || nextOrder(cache.services),
    published: $("#sf-published").checked,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing.serviceId) await updateDoc(doc(db, "services", editing.serviceId), data);
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, "services"), data); }
    toast("Service saved.", "good");
    cache.services = sortered(await fetchCol("services"));
    renderServices(); renderDashboard(); renderSetupCard();
    showServiceList();
  } catch (err) {
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not save — try again.", "bad");
  } finally { btnLoading(btn, false); }
});

function renderServices() {
  const wrap = $("#services-list");
  if (!cache.services.length) {
    wrap.innerHTML = `<div class="empty"><b>No services yet.</b>Add the services you offer — they appear on the public site.</div>`;
    return;
  }
  wrap.innerHTML = cache.services.map((s, i) => `
    <div class="lrow">
      <span class="icon-btn" style="pointer-events:none"><svg class="icon"><use href="#i-${esc(s.icon || "spark")}"/></svg></span>
      <div class="t"><b>${esc(s.title)}</b><span>${esc(s.description || "")}</span></div>
      <div class="chips"><span class="chip ${s.published !== false ? "ok" : "off"}">${s.published !== false ? "Published" : "Hidden"}</span></div>
      <div class="actions">
        <button class="icon-btn" title="Move up" data-smove="up" data-i="${i}" ${i === 0 ? "disabled" : ""}><svg class="icon"><use href="#i-up"/></svg></button>
        <button class="icon-btn" title="Move down" data-smove="down" data-i="${i}" ${i === cache.services.length - 1 ? "disabled" : ""}><svg class="icon"><use href="#i-down"/></svg></button>
        <button class="icon-btn" title="Edit" data-sedit="${esc(s.id)}"><svg class="icon"><use href="#i-edit"/></svg></button>
        <button class="icon-btn danger" title="Delete" data-sdel="${esc(s.id)}"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
    </div>`).join("");
}

$("#services-list").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-sedit]");
  const del = e.target.closest("[data-sdel]");
  const mv = e.target.closest("[data-smove]");
  if (edit) openServiceEditor(edit.dataset.sedit);
  if (del) {
    const s = cache.services.find(x => x.id === del.dataset.sdel);
    if (s && await confirmDlg("Delete service?", `"${s.title}" will be removed from the services section.`)) {
      await deleteDoc(doc(db, "services", s.id));
      toast("Service deleted.", "good");
      cache.services = sortered(await fetchCol("services"));
      renderServices(); renderDashboard(); renderSetupCard();
    }
  }
  if (mv) {
    const i = Number(mv.dataset.i);
    const a = cache.services[i], b = cache.services[mv.dataset.smove === "up" ? i - 1 : i + 1];
    if (a && b) {
      await updateDoc(doc(db, "services", a.id), { order: Number(b.order) || i });
      await updateDoc(doc(db, "services", b.id), { order: Number(a.order) || i + 1 });
      cache.services = sortered(await fetchCol("services"));
      renderServices();
    }
  }
});
/* ---------------- Skills CRUD ---------------- */
function showSkillList() { $("#skill-editor").hidden = true; $("#skills-list-view").hidden = false; }

function openSkillEditor(id) {
  editing.skillId = id || null;
  const s = id ? cache.skills.find(x => x.id === id) : null;
  $("#skl-editor-title").textContent = s ? "Edit skill" : "New skill";
  $("#skl-form").reset();
  $("#kf-name").value = s?.name || "";
  $("#kf-cat").value = s?.category || "";
  $("#kf-order").value = s?.order ?? nextOrder(cache.skills);
  $("#kf-icon").value = s?.iconUrl || "";
  $("#kf-published").checked = s ? s.published !== false : true;
  $("#skills-list-view").hidden = true;
  $("#skill-editor").hidden = false;
  $("#kf-name").focus();
}

$("#new-skill-btn").addEventListener("click", () => openSkillEditor(null));
$("#skl-back").addEventListener("click", showSkillList);
$("#skl-cancel").addEventListener("click", showSkillList);

$("#skl-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#kf-name").value.trim();
  if (!name) { toast("Give the skill a name.", "bad"); return; }
  const btn = $("#skl-save");
  btnLoading(btn, true, "Saving…");
  const data = {
    name,
    category: $("#kf-cat").value.trim(),
    iconUrl: $("#kf-icon").value.trim(),
    order: Number($("#kf-order").value) || nextOrder(cache.skills),
    published: $("#kf-published").checked,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing.skillId) await updateDoc(doc(db, "skills", editing.skillId), data);
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, "skills"), data); }
    toast("Skill saved.", "good");
    cache.skills = sortered(await fetchCol("skills"));
    renderSkills(); renderDashboard(); renderSetupCard();
    showSkillList();
  } catch (err) {
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not save — try again.", "bad");
  } finally { btnLoading(btn, false); }
});

function renderSkills() {
  const wrap = $("#skills-list");
  if (!cache.skills.length) {
    wrap.innerHTML = `<div class="empty"><b>No skills yet.</b>Add the technologies and disciplines you work with.</div>`;
    return;
  }
  wrap.innerHTML = cache.skills.map((s, i) => `
    <div class="lrow">
      <div class="t"><b>${esc(s.name)}</b><span>${esc(s.category || "Uncategorized")}</span></div>
      <div class="chips"><span class="chip ${s.published !== false ? "ok" : "off"}">${s.published !== false ? "Published" : "Hidden"}</span></div>
      <div class="actions">
        <button class="icon-btn" title="Move up" data-kmove="up" data-i="${i}" ${i === 0 ? "disabled" : ""}><svg class="icon"><use href="#i-up"/></svg></button>
        <button class="icon-btn" title="Move down" data-kmove="down" data-i="${i}" ${i === cache.skills.length - 1 ? "disabled" : ""}><svg class="icon"><use href="#i-down"/></svg></button>
        <button class="icon-btn" title="Edit" data-kedit="${esc(s.id)}"><svg class="icon"><use href="#i-edit"/></svg></button>
        <button class="icon-btn danger" title="Delete" data-kdel="${esc(s.id)}"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
    </div>`).join("");
}

$("#skills-list").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-kedit]");
  const del = e.target.closest("[data-kdel]");
  const mv = e.target.closest("[data-kmove]");
  if (edit) openSkillEditor(edit.dataset.kedit);
  if (del) {
    const s = cache.skills.find(x => x.id === del.dataset.kdel);
    if (s && await confirmDlg("Delete skill?", `"${s.name}" will be removed from the skills section.`)) {
      await deleteDoc(doc(db, "skills", s.id));
      toast("Skill deleted.", "good");
      cache.skills = sortered(await fetchCol("skills"));
      renderSkills(); renderDashboard(); renderSetupCard();
    }
  }
  if (mv) {
    const i = Number(mv.dataset.i);
    const a = cache.skills[i], b = cache.skills[mv.dataset.kmove === "up" ? i - 1 : i + 1];
    if (a && b) {
      await updateDoc(doc(db, "skills", a.id), { order: Number(b.order) || i });
      await updateDoc(doc(db, "skills", b.id), { order: Number(a.order) || i + 1 });
      cache.skills = sortered(await fetchCol("skills"));
      renderSkills();
    }
  }
});

/* ---------------- Testimonials CRUD ---------------- */
function showTestimonialList() { $("#testimonial-editor").hidden = true; $("#testimonials-list-view").hidden = false; }

function openTestimonialEditor(id) {
  editing.testimonialId = id || null;
  const t = id ? cache.testimonials.find(x => x.id === id) : null;
  $("#tst-editor-title").textContent = t ? "Edit testimonial" : "New testimonial";
  $("#tst-form").reset();
  $("#tf-text").value = t?.text || "";
  $("#tf-name").value = t?.name || "";
  $("#tf-role").value = t?.role || "";
  $("#tf-avatar").value = t?.avatar || "";
  $("#tf-order").value = t?.order ?? nextOrder(cache.testimonials);
  $("#tf-published").checked = t ? t.published !== false : true;
  $("#testimonials-list-view").hidden = true;
  $("#testimonial-editor").hidden = false;
  $("#tf-text").focus();
}

$("#new-testimonial-btn").addEventListener("click", () => openTestimonialEditor(null));
$("#tst-back").addEventListener("click", showTestimonialList);
$("#tst-cancel").addEventListener("click", showTestimonialList);

$("#tst-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("#tf-text").value.trim();
  const name = $("#tf-name").value.trim();
  if (!text || !name) { toast("Testimonial text and client name are required.", "bad"); return; }
  const btn = $("#tst-save");
  btnLoading(btn, true, "Saving…");
  const data = {
    text, name,
    role: $("#tf-role").value.trim(),
    avatar: $("#tf-avatar").value.trim(),
    order: Number($("#tf-order").value) || nextOrder(cache.testimonials),
    published: $("#tf-published").checked,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing.testimonialId) await updateDoc(doc(db, "testimonials", editing.testimonialId), data);
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, "testimonials"), data); }
    toast("Testimonial saved.", "good");
    cache.testimonials = sortered(await fetchCol("testimonials"));
    renderTestimonials(); renderDashboard(); renderSetupCard();
    showTestimonialList();
  } catch (err) {
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not save — try again.", "bad");
  } finally { btnLoading(btn, false); }
});

function renderTestimonials() {
  const wrap = $("#testimonials-list");
  if (!cache.testimonials.length) {
    wrap.innerHTML = `<div class="empty"><b>No testimonials yet.</b>Add real words from real clients — the public section stays hidden until you do.</div>`;
    return;
  }
  wrap.innerHTML = cache.testimonials.map((t) => `
    <div class="lrow">
      <div class="t"><b>${esc(t.name)}</b><span>${esc((t.text || "").slice(0, 90))}${(t.text || "").length > 90 ? "…" : ""}</span></div>
      <div class="chips"><span class="chip ${t.published !== false ? "ok" : "off"}">${t.published !== false ? "Published" : "Hidden"}</span></div>
      <div class="actions">
        <button class="icon-btn" title="Edit" data-tedit="${esc(t.id)}"><svg class="icon"><use href="#i-edit"/></svg></button>
        <button class="icon-btn danger" title="Delete" data-tdel="${esc(t.id)}"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
    </div>`).join("");
}

$("#testimonials-list").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-tedit]");
  const del = e.target.closest("[data-tdel]");
  if (edit) openTestimonialEditor(edit.dataset.tedit);
  if (del) {
    const t = cache.testimonials.find(x => x.id === del.dataset.tdel);
    if (t && await confirmDlg("Delete testimonial?", `The testimonial from "${t.name}" will be removed.`)) {
      await deleteDoc(doc(db, "testimonials", t.id));
      toast("Testimonial deleted.", "good");
      cache.testimonials = sortered(await fetchCol("testimonials"));
      renderTestimonials(); renderDashboard(); renderSetupCard();
    }
  }
});
/* ---------------- Messages ---------------- */
function subscribeMessages() {
  if (msgUnsub) msgUnsub();
  try {
    msgUnsub = onSnapshot(
      query(collection(db, "messages"), orderBy("createdAt", "desc")),
      (snap) => {
        cache.rulesOk = true;
        cache.messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMessages();
        renderDashboard();
      },
      (err) => {
        if (err.code === "permission-denied") { cache.rulesOk = false; renderSetupCard(); }
        console.warn("[admin] messages:", err.code);
        $("#messages-list").innerHTML = `<div class="empty"><b>Cannot load messages.</b>Deploy <code>firestore.rules</code> and make sure Firestore is created.</div>`;
      }
    );
  } catch (err) {
    console.warn("[admin] messages subscribe failed:", err);
  }
}

$("#msg-refresh").addEventListener("click", () => { subscribeMessages(); toast("Messages refreshed."); });
$("#msg-filter-all").addEventListener("click", () => { msgFilter = "all"; syncMsgFilter(); renderMessages(); });
$("#msg-filter-unread").addEventListener("click", () => { msgFilter = "unread"; syncMsgFilter(); renderMessages(); });
function syncMsgFilter() {
  $("#msg-filter-all").setAttribute("aria-pressed", String(msgFilter === "all"));
  $("#msg-filter-unread").setAttribute("aria-pressed", String(msgFilter === "unread"));
}

function renderMessages() {
  const wrap = $("#messages-list");
  const all = msgFilter === "unread" ? cache.messages.filter(m => !m.read) : cache.messages;
  if (!all.length) {
    wrap.innerHTML = `<div class="empty"><b>${msgFilter === "unread" ? "No unread messages." : "No messages yet."}</b>Contact form submissions appear here instantly.</div>`;
    return;
  }
  wrap.innerHTML = all.map(m => `
    <div class="lrow ${m.read ? "" : "unread"}" style="align-items:flex-start">
      <span class="dot${m.read ? " read" : ""}" style="margin-top:8px"></span>
      <div class="t" style="flex:1">
        <div class="row-between">
          <b style="font-size:15px">${esc(m.name || "Anonymous")}</b>
          <span class="small mono muted">${fmtDate(m.createdAt)}</span>
        </div>
        <span style="white-space:normal;display:flex;gap:14px;flex-wrap:wrap;margin-top:4px">
          <a class="chip" href="mailto:${esc(m.email || "")}"><svg class="icon" style="width:12px;height:12px"><use href="#i-mail"/></svg>${esc(m.email || "—")}</a>
          ${m.phone ? `<a class="chip" href="tel:${esc(m.phone)}"><svg class="icon" style="width:12px;height:12px"><use href="#i-phone"/></svg>${esc(m.phone)}</a>` : ""}
        </span>
        <div class="msg-body">${esc(m.message || "")}</div>
        <div class="row" style="margin-top:12px;gap:8px">
          ${!m.read ? `<button class="btn btn-ghost btn-sm" data-mread="${esc(m.id)}"><svg class="icon"><use href="#i-check"/></svg>Mark as read</button>` : `<button class="btn btn-ghost btn-sm" data-munread="${esc(m.id)}">Mark unread</button>`}
          <a class="btn btn-ghost btn-sm" href="mailto:${esc(m.email || "")}?subject=Re: your message">Reply</a>
          <button class="btn btn-danger btn-sm" data-mdel="${esc(m.id)}"><svg class="icon"><use href="#i-trash"/></svg>Delete</button>
        </div>
      </div>
    </div>`).join("");
}

$("#messages-list").addEventListener("click", async (e) => {
  const read = e.target.closest("[data-mread]");
  const unread = e.target.closest("[data-munread]");
  const del = e.target.closest("[data-mdel]");
  try {
    if (read) { await updateDoc(doc(db, "messages", read.dataset.mread), { read: true }); }
    if (unread) { await updateDoc(doc(db, "messages", unread.dataset.munread), { read: false }); }
    if (del) {
      if (await confirmDlg("Delete message?", "This message will be permanently removed.")) {
        await deleteDoc(doc(db, "messages", del.dataset.mdel));
        toast("Message deleted.", "good");
      }
    }
  } catch (err) {
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Action failed — try again.", "bad");
  }
});

/* ---------------- Settings ---------------- */
const SET_FIELDS = [
  ["st-name", "name"], ["st-title", "title"], ["st-avail", "availability"],
  ["st-logo", "logoUrl"], ["st-favicon", "faviconUrl"], ["st-profile", "profileImage"],
  ["st-hero-h", "heroHeading"], ["st-hero-d", "heroDescription"], ["st-cta1", "ctaPrimary"], ["st-cta2", "ctaSecondary"],
  ["st-about-h", "aboutHeading"], ["st-about-t", "aboutText"],
  ["st-c-h", "contactHeading"], ["st-c-s", "contactSub"], ["st-c-n", "contactNote"],
  ["st-email", "email"], ["st-phone", "phone"], ["st-wa", "whatsapp"],
  ["st-seo-t", "seoTitle"], ["st-seo-d", "seoDescription"], ["st-seo-i", "seoImage"], ["st-footer", "footerText"]
];
const SOCIAL_FIELDS = [["st-so-ig", "instagram"], ["st-so-tt", "tiktok"], ["st-so-tg", "telegram"], ["st-so-yt", "youtube"], ["st-so-gh", "github"], ["st-so-li", "linkedin"], ["st-so-wa", "whatsapp"], ["st-so-x", "x"]];

let otherLinks = [];

function addOtherLinkRow(label = "", url = "") {
  const wrap = $("#other-links");
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <input type="text" placeholder="Label (e.g. Behance)" value="${esc(label)}" data-ol-label style="flex:1;background:var(--bg2);border:1px solid var(--line2);border-radius:11px;padding:12px 14px;color:var(--text)">
    <input type="url" placeholder="https://" value="${esc(url)}" data-ol-url style="flex:1.6;background:var(--bg2);border:1px solid var(--line2);border-radius:11px;padding:12px 14px;color:var(--text)">
    <button class="icon-btn danger" type="button" aria-label="Remove link"><svg class="icon"><use href="#i-x"/></svg></button>`;
  row.querySelector("button").addEventListener("click", () => row.remove());
  wrap.appendChild(row);
}

$("#add-other-link").addEventListener("click", () => addOtherLinkRow());

$("#st-accent").addEventListener("input", (e) => { $("#st-accent-hex").value = e.target.value; });
$("#st-accent-hex").addEventListener("input", (e) => {
  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value.trim())) $("#st-accent").value = e.target.value.trim();
});

async function loadSettingsForm() {
  let data = null;
  try {
    const snap = await getDoc(doc(db, "settings", "general"));
    cache.settingsExists = snap.exists();
    data = snap.data();
  } catch (err) {
    if (err && err.code === "permission-denied") cache.rulesOk = false;
  }
  const s = mergeSettings(data);
  SET_FIELDS.forEach(([id, key]) => { $("#" + id).value = s[key] != null ? s[key] : ""; });
  SOCIAL_FIELDS.forEach(([id, key]) => { $("#" + id).value = (s.socials && s.socials[key]) || ""; });
  $("#st-theme").value = s.theme.mode || "dark";
  $("#st-accent").value = s.theme.accent || "#E9A23B";
  $("#st-accent-hex").value = s.theme.accent || "#E9A23B";
  otherLinks = s.otherLinks || [];
  $("#other-links").innerHTML = "";
  otherLinks.forEach(l => addOtherLinkRow(l.label, l.url));
}

$("#settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#st-save");
  btnLoading(btn, true, "Saving…");
  const data = { updatedAt: serverTimestamp() };
  SET_FIELDS.forEach(([id, key]) => { data[key] = $("#" + id).value.trim(); });
  data.socials = {};
  SOCIAL_FIELDS.forEach(([id, key]) => { data.socials[key] = $("#" + id).value.trim(); });
  data.otherLinks = $$("#other-links [data-ol-label]").map(row => ({
    label: row.querySelector("[data-ol-label]").value.trim(),
    url: row.querySelector("[data-ol-url]").value.trim()
  })).filter(l => l.url);
  const hex = $("#st-accent-hex").value.trim();
  data.theme = { mode: $("#st-theme").value, accent: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#E9A23B" };
  try {
    await setDoc(doc(db, "settings", "general"), data, { merge: true });
    cache.settingsExists = true;
    toast("Settings saved — the public site now shows your content.", "good");
    renderSetupCard();
  } catch (err) {
    toast(err.code === "permission-denied" ? "Permission denied — deploy firestore.rules first." : "Could not save — try again.", "bad");
  } finally { btnLoading(btn, false); }
});



