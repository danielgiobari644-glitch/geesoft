// GeeSoft — Admin console. Real Firebase Auth + Firestore CRUD.
import { db, auth } from "./firebase.js";
import { DEFAULTS } from "./content.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updatePassword, verifyBeforeUpdateEmail,
  reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(msg, kind = "ok") {
  const t = $("#toast");
  t.textContent = msg; t.className = `toast show ${kind}`;
  clearTimeout(t._t); t._t = setTimeout(() => t.className = "toast", 3200);
}
const friendly = e => ({
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "That email address is not valid.",
  "auth/user-not-found": "No account found for that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/requires-recent-login": "Please re-enter your current password to continue.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "permission-denied": "Permission denied — check your Firestore security rules."
}[e?.code] || e?.message || "Something went wrong.");

/* ================= AUTH ================= */
const authView = $("#authView"), appView = $("#appView");

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#authMsg"), btn = $("#loginBtn");
  m.className = "msg"; m.textContent = "Signing in…"; btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $("#li-email").value.trim(), $("#li-pass").value);
    m.textContent = "";
  } catch (err) { m.className = "msg err"; m.textContent = friendly(err); }
  btn.disabled = false;
});

$("#resetBtn").addEventListener("click", async () => {
  const email = $("#li-email").value.trim();
  const m = $("#authMsg");
  if (!email) { m.className = "msg err"; m.textContent = "Enter your email address first."; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    m.className = "msg ok"; m.textContent = "Reset email sent. Check your inbox.";
  } catch (err) { m.className = "msg err"; m.textContent = friendly(err); }
});

$("#signOutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  if (user) {
    authView.hidden = true; appView.hidden = false;
    $("#whoami").textContent = user.email || user.uid;
    $("#li-pass").value = "";
    loadAll();
  } else {
    appView.hidden = true; authView.hidden = false;
  }
});

/* ================= DATA ================= */
const store = {
  settings: {}, hero: {}, intro: {}, skillsMeta: {}, projectsMeta: {}, contact: {},
  skills: [], projects: []
};

async function loadDoc(id, key) {
  try {
    const s = await getDoc(doc(db, "content", id));
    store[key] = { ...DEFAULTS[key], ...(s.exists() ? s.data() : {}) };
  } catch (e) { store[key] = { ...DEFAULTS[key] }; console.warn(id, e.message); }
}
async function saveDoc(id, key, data) {
  await setDoc(doc(db, "content", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  store[key] = { ...store[key], ...data };
  toast("Saved to Firebase.");
}
async function loadCol(name) {
  try {
    const s = await getDocs(query(collection(db, name), orderBy("order", "asc")));
    store[name] = s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (_) {
    try {
      const s = await getDocs(collection(db, name));
      store[name] = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (e) { store[name] = []; console.warn(name, e.message); }
  }
}
async function loadAll() {
  await Promise.all([
    loadDoc("settings", "settings"), loadDoc("hero", "hero"), loadDoc("intro", "intro"),
    loadDoc("skillsMeta", "skillsMeta"), loadDoc("projectsMeta", "projectsMeta"), loadDoc("contact", "contact"),
    loadCol("skills"), loadCol("projects")
  ]);
  render(current);
}

/* ================= FORM HELPERS ================= */
const field = (name, label, val = "", type = "text", hint = "") => `
  <div class="f"><label for="fld-${name}">${esc(label)}</label>
  <input id="fld-${name}" name="${name}" type="${type}" value="${esc(val ?? "")}" />
  ${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
const area = (name, label, val = "", rows = 4, hint = "") => `
  <div class="f"><label for="fld-${name}">${esc(label)}</label>
  <textarea id="fld-${name}" name="${name}" rows="${rows}">${esc(val ?? "")}</textarea>
  ${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
const listField = (name, label, arr = [], hint = "One per line.") =>
  area(name, label, (arr || []).join("\n"), Math.max(3, (arr || []).length + 1), hint);
const lines = v => String(v || "").split("\n").map(s => s.trim()).filter(Boolean);
const formData = form => Object.fromEntries(new FormData(form).entries());

function bindForm(id, handler) {
  const f = $(id);
  if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = "Saving…"; }
    try { await handler(formData(f), f); }
    catch (err) { toast(friendly(err), "err"); }
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t; }
  });
}

/* ================= VIEWS ================= */
let current = "overview";
const titles = {
  overview: "Overview", hero: "Hero", intro: "Introduction", skills: "Skills",
  projects: "Projects", contact: "Contact", settings: "Site Settings", account: "Account & Security"
};

const views = {
  /* ---------- overview ---------- */
  overview() {
    const s = store.settings, c = store.contact;
    return `
    <div class="stats">
      <div class="stat"><b>${store.projects.length}</b><span>Projects</span></div>
      <div class="stat"><b>${store.skills.length}</b><span>Skills</span></div>
      <div class="stat"><b>${(c.socials || []).length}</b><span>Social links</span></div>
      <div class="stat"><b>${store.projects.filter(p => p.featured).length}</b><span>Featured</span></div>
    </div>
    <div class="card">
      <h3>Welcome back</h3>
      <p class="cap">Everything visible on the public GeeSoft website is managed from this console. Changes save straight to Firestore and appear on the live site immediately.</p>
      <div class="row">
        <button class="btn btn--primary btn--sm" data-go="projects">Manage projects</button>
        <button class="btn btn--ghost btn--sm" data-go="skills">Manage skills</button>
        <button class="btn btn--ghost btn--sm" data-go="contact">Contact details</button>
      </div>
    </div>
    <div class="card">
      <h3>Setup checklist</h3>
      <p class="cap">Items still needing your real information.</p>
      ${[
        [!!c.email, "Contact email added"],
        [!!(c.socials || []).length, "Social links added"],
        [!!store.projects.length, "At least one real project published"],
        [!!store.skills.length, "Skills added"],
        [!!s.brandName, "Brand name set"]
      ].map(([done, label]) =>
        `<div class="item"><span class="chip">${done ? "Done" : "To do"}</span><div class="item__main"><strong>${esc(label)}</strong></div></div>`
      ).join("")}
    </div>`;
  },

  /* ---------- hero ---------- */
  hero() {
    const h = store.hero;
    return `<form class="card" id="heroForm">
      <h3>Hero section</h3><p class="cap">The first thing every visitor sees.</p>
      ${field("eyebrow", "Eyebrow label", h.eyebrow)}
      <div class="grid2">
        ${field("headlineLine1", "Headline — line 1", h.headlineLine1)}
        ${field("headlineLine2", "Headline — line 2 (gradient)", h.headlineLine2)}
      </div>
      ${area("supporting", "Supporting text", h.supporting, 3)}
      <div class="grid2">
        ${field("primaryCtaText", "Primary CTA text", h.primaryCtaText)}
        ${field("primaryCtaLink", "Primary CTA link", h.primaryCtaLink, "text", "e.g. #projects")}
        ${field("secondaryCtaText", "Secondary CTA text", h.secondaryCtaText)}
        ${field("secondaryCtaLink", "Secondary CTA link", h.secondaryCtaLink, "text", "e.g. #contact")}
      </div>
      ${listField("capabilities", "Capability labels", h.capabilities)}
      ${field("scrollLabel", "Scroll hint text", h.scrollLabel)}
      <button class="btn btn--primary" type="submit">Save hero</button>
    </form>`;
  },

  /* ---------- intro ---------- */
  intro() {
    const i = store.intro;
    return `<form class="card" id="introForm">
      <h3>Introduction section</h3><p class="cap">Who GeeSoft and Giobari Daniel are.</p>
      ${field("eyebrow", "Eyebrow label", i.eyebrow)}
      ${field("heading", "Heading", i.heading)}
      ${area("lead", "Lead paragraph", i.lead, 3)}
      ${field("brandHeading", "GeeSoft — heading", i.brandHeading)}
      ${area("brandText", "GeeSoft — text", i.brandText, 4)}
      ${field("personHeading", "Giobari Daniel — heading", i.personHeading)}
      ${area("personText", "Giobari Daniel — text", i.personText, 4)}
      ${field("valueHeading", "Value — heading", i.valueHeading)}
      ${area("valueText", "Value — text", i.valueText, 3)}
      ${listField("services", "Services list", i.services)}
      <div class="grid2">
        ${field("ctaText", "CTA text", i.ctaText)}
        ${field("ctaLink", "CTA link", i.ctaLink)}
      </div>
      <button class="btn btn--primary" type="submit">Save introduction</button>
    </form>`;
  },

  /* ---------- skills ---------- */
  skills() {
    const m = store.skillsMeta;
    return `<form class="card" id="skillsMetaForm">
      <h3>Skills — section text</h3><p class="cap">Headings shown above the skills grid.</p>
      ${field("eyebrow", "Eyebrow label", m.eyebrow)}
      ${field("heading", "Heading", m.heading)}
      ${area("description", "Description", m.description, 2)}
      <button class="btn btn--primary" type="submit">Save section text</button>
    </form>
    <div class="card">
      <div class="row"><h3>Skills</h3>
        <button class="btn btn--primary btn--sm right" id="addSkill">Add skill</button></div>
      <p class="cap">Use the arrows to reorder. Order is reflected on the public site.</p>
      <div id="skillList">${store.skills.length ? store.skills.map((s, i) => `
        <div class="item">
          <span class="item__thumb">${s.icon ? `<img src="${esc(s.icon)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : esc((s.iconText || s.name || "•").slice(0, 2))}</span>
          <div class="item__main"><strong>${esc(s.name || "Untitled")}</strong>
            <small>${esc(s.category || "Uncategorised")}${s.level ? " · " + esc(s.level) + "%" : ""}</small></div>
          <div class="item__acts">
            <button class="btn btn--ghost btn--sm" data-mv="skills" data-id="${s.id}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
            <button class="btn btn--ghost btn--sm" data-mv="skills" data-id="${s.id}" data-dir="1" ${i === store.skills.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
            <button class="btn btn--ghost btn--sm" data-edit="skill" data-id="${s.id}">Edit</button>
            <button class="btn btn--danger btn--sm" data-del="skills" data-id="${s.id}">Delete</button>
          </div>
        </div>`).join("") : `<p class="empty">No skills yet. Add your real skills to display them.</p>`}</div>
    </div>`;
  },

  /* ---------- projects ---------- */
  projects() {
    const m = store.projectsMeta;
    return `<form class="card" id="projectsMetaForm">
      <h3>Projects — section text</h3><p class="cap">Headings and fallback text for the projects section.</p>
      ${field("eyebrow", "Eyebrow label", m.eyebrow)}
      ${field("heading", "Heading", m.heading)}
      ${area("description", "Description", m.description, 2)}
      ${field("emptyText", "Text shown when there are no projects", m.emptyText)}
      ${field("defaultCtaText", "Default project CTA text", m.defaultCtaText)}
      <button class="btn btn--primary" type="submit">Save section text</button>
    </form>
    <div class="card">
      <div class="row"><h3>Projects</h3>
        <button class="btn btn--primary btn--sm right" id="addProject">Add project</button></div>
      <p class="cap">Thumbnails and gallery images are set by image URL — paste any public image link.</p>
      <div id="projectList">${store.projects.length ? store.projects.map((p, i) => `
        <div class="item">
          ${p.thumbnail ? `<img class="item__thumb" src="${esc(p.thumbnail)}" alt="">`
            : `<span class="item__thumb">No image</span>`}
          <div class="item__main"><strong>${esc(p.name || "Untitled")}</strong>
            <small>${esc(p.category || "Uncategorised")}${p.featured ? " · Featured" : ""}${p.published === false ? " · Hidden" : ""}</small></div>
          <div class="item__acts">
            <button class="btn btn--ghost btn--sm" data-mv="projects" data-id="${p.id}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
            <button class="btn btn--ghost btn--sm" data-mv="projects" data-id="${p.id}" data-dir="1" ${i === store.projects.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
            <button class="btn btn--ghost btn--sm" data-edit="project" data-id="${p.id}">Edit</button>
            <button class="btn btn--danger btn--sm" data-del="projects" data-id="${p.id}">Delete</button>
          </div>
        </div>`).join("") : `<p class="empty">No projects yet. Add your real projects here — nothing is invented for you.</p>`}</div>
    </div>`;
  },

  /* ---------- contact ---------- */
  contact() {
    const c = store.contact;
    const socials = (c.socials || []);
    return `<form class="card" id="contactForm">
      <h3>Contact section</h3><p class="cap">Only enter details you actually want published.</p>
      ${field("eyebrow", "Eyebrow label", c.eyebrow)}
      ${field("heading", "Heading", c.heading)}
      ${area("description", "Description", c.description, 3)}
      <div class="grid2">
        ${field("email", "Email address", c.email, "email")}
        ${field("phone", "Phone", c.phone)}
        ${field("location", "Location", c.location)}
        ${field("availability", "Availability", c.availability)}
      </div>
      ${field("ctaText", "Form button text", c.ctaText)}
      ${field("formHeading", "Form heading", c.formHeading)}
      ${field("formNote", "Form note", c.formNote)}
      <div class="f"><label for="fld-formEnabled">Show contact form</label>
        <select id="fld-formEnabled" name="formEnabled">
          <option value="yes" ${c.formEnabled !== false ? "selected" : ""}>Yes</option>
          <option value="no" ${c.formEnabled === false ? "selected" : ""}>No</option>
        </select></div>
      <button class="btn btn--primary" type="submit">Save contact</button>
    </form>
    <div class="card">
      <div class="row"><h3>Social links</h3>
        <button class="btn btn--primary btn--sm right" id="addSocial">Add link</button></div>
      <div id="socialList">${socials.length ? socials.map((s, i) => `
        <div class="item">
          <div class="item__main"><strong>${esc(s.label)}</strong><small>${esc(s.url)}</small></div>
          <div class="item__acts">
            <button class="btn btn--ghost btn--sm" data-editsocial="${i}">Edit</button>
            <button class="btn btn--danger btn--sm" data-delsocial="${i}">Delete</button>
          </div>
        </div>`).join("") : `<p class="empty">No social links yet.</p>`}</div>
    </div>`;
  },

  /* ---------- settings ---------- */
  settings() {
    const s = store.settings;
    return `<form class="card" id="settingsForm">
      <h3>Brand &amp; SEO</h3><p class="cap">Page title, description, logo and footer.</p>
      ${field("siteTitle", "Page title (SEO)", s.siteTitle)}
      ${area("metaDescription", "Meta description", s.metaDescription, 3)}
      <div class="grid2">
        ${field("brandName", "Brand name", s.brandName)}
        ${field("tagline", "Tagline", s.tagline)}
      </div>
      ${field("logoUrl", "Logo image URL", s.logoUrl, "text", "Defaults to the official bundled GeeSoft logo.")}
      ${s.logoUrl ? `<img class="preview" src="${esc(s.logoUrl)}" alt="Current logo preview" style="aspect-ratio:auto;max-height:180px;object-fit:contain">` : ""}
      ${field("footerText", "Footer text", s.footerText)}
      ${field("copyright", "Copyright text", s.copyright)}
      ${field("builtBy", "Footer credit", s.builtBy)}
      <button class="btn btn--primary" type="submit">Save settings</button>
    </form>
    <form class="card" id="navForm">
      <h3>Navigation labels</h3><p class="cap">The five navigation items.</p>
      <div class="grid2">
        ${field("navHome", "Home", s.navHome)}
        ${field("navIntro", "Introduction", s.navIntro)}
        ${field("navSkills", "Skills", s.navSkills)}
        ${field("navProjects", "Projects", s.navProjects)}
        ${field("navContact", "Contact", s.navContact)}
      </div>
      <button class="btn btn--primary" type="submit">Save navigation</button>
    </form>`;
  },

  /* ---------- account ---------- */
  account() {
    const u = auth.currentUser;
    return `<div class="card">
      <h3>Signed in as</h3>
      <p class="cap">${esc(u?.email || "")}${u?.emailVerified ? " · verified" : " · not verified"}</p>
      <button class="btn btn--ghost btn--sm" id="soBtn">Sign out</button>
    </div>
    <form class="card" id="emailForm">
      <h3>Change login email</h3>
      <p class="cap">Firebase sends a verification link to the new address. The change takes effect once you click it — then sign in with the new email.</p>
      ${field("currentPassword", "Current password", "", "password")}
      ${field("newEmail", "New email address", "", "email")}
      <button class="btn btn--primary" type="submit">Send verification &amp; update email</button>
    </form>
    <form class="card" id="passForm">
      <h3>Change password</h3>
      <p class="cap">Handled entirely by Firebase Authentication. Passwords are never stored in Firestore or in this source code.</p>
      ${field("currentPassword2", "Current password", "", "password")}
      ${field("newPassword", "New password", "", "password", "Minimum 6 characters.")}
      ${field("confirmPassword", "Confirm new password", "", "password")}
      <button class="btn btn--primary" type="submit">Update password</button>
    </form>`;
  }
};

/* ================= WIRING ================= */
function render(view) {
  current = view;
  $("#viewTitle").textContent = titles[view];
  $$(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view === view));
  $("#views").innerHTML = views[view]();
  wire(view);
  $("#views").scrollIntoView({ block: "start" });
}

function wire(view) {
  $$("[data-go]").forEach(b => b.addEventListener("click", () => render(b.dataset.go)));

  bindForm("#heroForm", async d => saveDoc("hero", "hero", { ...d, capabilities: lines(d.capabilities) }));
  bindForm("#introForm", async d => saveDoc("intro", "intro", { ...d, services: lines(d.services) }));
  bindForm("#skillsMetaForm", async d => saveDoc("skillsMeta", "skillsMeta", d));
  bindForm("#projectsMetaForm", async d => saveDoc("projectsMeta", "projectsMeta", d));
  bindForm("#settingsForm", async d => saveDoc("settings", "settings", d));
  bindForm("#navForm", async d => saveDoc("settings", "settings", d));
  bindForm("#contactForm", async d => {
    const payload = { ...d, formEnabled: d.formEnabled === "yes", socials: store.contact.socials || [] };
    await saveDoc("contact", "contact", payload);
  });

  // collection actions
  $$("[data-del]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this item permanently?")) return;
    try {
      await deleteDoc(doc(db, b.dataset.del, b.dataset.id));
      await loadCol(b.dataset.del); render(view); toast("Deleted.");
    } catch (e) { toast(friendly(e), "err"); }
  }));

  $$("[data-mv]").forEach(b => b.addEventListener("click", async () => {
    const col = b.dataset.mv, dir = +b.dataset.dir;
    const arr = store[col], i = arr.findIndex(x => x.id === b.dataset.id), j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    try {
      await Promise.all(arr.map((x, k) => updateDoc(doc(db, col, x.id), { order: k })));
      arr.forEach((x, k) => x.order = k);
      render(view); toast("Order updated.");
    } catch (e) { toast(friendly(e), "err"); }
  }));

  $("#addSkill")?.addEventListener("click", () => skillModal(null));
  $("#addProject")?.addEventListener("click", () => projectModal(null));
  $$("[data-edit='skill']").forEach(b => b.addEventListener("click", () =>
    skillModal(store.skills.find(s => s.id === b.dataset.id))));
  $$("[data-edit='project']").forEach(b => b.addEventListener("click", () =>
    projectModal(store.projects.find(p => p.id === b.dataset.id))));

  $("#addSocial")?.addEventListener("click", () => socialModal(-1));
  $$("[data-editsocial]").forEach(b => b.addEventListener("click", () => socialModal(+b.dataset.editsocial)));
  $$("[data-delsocial]").forEach(b => b.addEventListener("click", async () => {
    const arr = [...(store.contact.socials || [])];
    arr.splice(+b.dataset.delsocial, 1);
    await saveDoc("contact", "contact", { socials: arr });
    store.contact.socials = arr; render(view);
  }));

  // account
  $("#soBtn")?.addEventListener("click", () => signOut(auth));
  bindForm("#emailForm", async (d, f) => {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, d.currentPassword));
    await verifyBeforeUpdateEmail(u, d.newEmail.trim());
    f.reset();
    toast("Verification email sent to the new address.");
  });
  bindForm("#passForm", async (d, f) => {
    if (d.newPassword !== d.confirmPassword) { toast("New passwords do not match.", "err"); return; }
    if ((d.newPassword || "").length < 6) { toast("Password must be at least 6 characters.", "err"); return; }
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, d.currentPassword2));
    await updatePassword(u, d.newPassword);
    f.reset();
    toast("Password updated.");
  });
}

/* ================= MODALS ================= */
function openModal(html, onSubmit) {
  const wrap = document.createElement("div");
  wrap.className = "mdl";
  wrap.innerHTML = `<div class="mdl__panel"><form id="mdlForm">${html}
    <div class="mdl__foot">
      <button class="btn btn--ghost" type="button" id="mdlCancel">Cancel</button>
      <button class="btn btn--primary" type="submit">Save</button>
    </div></form></div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  const close = () => { wrap.remove(); document.body.style.overflow = ""; };
  $("#mdlCancel", wrap).addEventListener("click", close);
  wrap.addEventListener("mousedown", e => { if (e.target === wrap) close(); });
  wrap.querySelector("input,textarea,select")?.focus();
  $("#mdlForm", wrap).addEventListener("submit", async e => {
    e.preventDefault();
    const btn = wrap.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Saving…";
    try { await onSubmit(formData(e.target)); close(); }
    catch (err) { toast(friendly(err), "err"); btn.disabled = false; btn.textContent = "Save"; }
  });
  // live thumbnail preview
  const url = $("#fld-thumbnail", wrap), prev = $("#thumbPrev", wrap);
  if (url && prev) {
    const upd = () => { if (url.value.trim()) { prev.src = url.value.trim(); prev.hidden = false; } else prev.hidden = true; };
    url.addEventListener("input", upd); upd();
  }
}

function skillModal(s) {
  const e = s || {};
  openModal(`<h3>${s ? "Edit" : "Add"} skill</h3>
    ${field("name", "Skill name", e.name)}
    ${field("category", "Category", e.category, "text", "e.g. Frontend, Backend, Design")}
    ${area("description", "Short description", e.description, 3)}
    <div class="grid2">
      ${field("level", "Proficiency % (optional)", e.level, "number")}
      ${field("iconText", "Icon text / emoji (optional)", e.iconText, "text", "Used when no icon URL is set.")}
    </div>
    ${field("icon", "Icon image URL (optional)", e.icon)}`,
    async d => {
      const payload = {
        name: d.name.trim(), category: d.category.trim(), description: d.description.trim(),
        level: d.level ? Number(d.level) : null, iconText: d.iconText.trim(), icon: d.icon.trim(),
        updatedAt: serverTimestamp()
      };
      if (s) await updateDoc(doc(db, "skills", s.id), payload);
      else await addDoc(collection(db, "skills"), { ...payload, order: store.skills.length, createdAt: serverTimestamp() });
      await loadCol("skills"); render("skills"); toast("Skill saved.");
    });
}

function projectModal(p) {
  const e = p || {};
  const tech = Array.isArray(e.technologies) ? e.technologies.join(", ") : (e.technologies || "");
  openModal(`<h3>${p ? "Edit" : "Add"} project</h3>
    ${field("name", "Project name", e.name)}
    ${field("category", "Category", e.category, "text", "e.g. Web Application, Website, Software")}
    ${area("description", "Short description (card)", e.description, 3)}
    ${area("longDescription", "Full case study (modal)", e.longDescription, 6)}
    ${field("technologies", "Technologies", tech, "text", "Comma separated.")}
    ${field("thumbnail", "Thumbnail image URL", e.thumbnail, "text", "Paste a public image link.")}
    <img id="thumbPrev" class="preview" alt="Thumbnail preview" hidden />
    ${listField("images", "Additional image URLs", e.images || [], "One image URL per line.")}
    <div class="grid2">
      ${field("projectUrl", "Live project URL", e.projectUrl, "url")}
      ${field("githubUrl", "GitHub URL", e.githubUrl, "url")}
    </div>
    ${field("ctaText", "CTA button text", e.ctaText || "")}
    <div class="grid2">
      <div class="f"><label for="fld-featured">Featured</label>
        <select id="fld-featured" name="featured">
          <option value="yes" ${e.featured ? "selected" : ""}>Yes</option>
          <option value="no" ${!e.featured ? "selected" : ""}>No</option></select></div>
      <div class="f"><label for="fld-published">Visible on site</label>
        <select id="fld-published" name="published">
          <option value="yes" ${e.published !== false ? "selected" : ""}>Yes</option>
          <option value="no" ${e.published === false ? "selected" : ""}>No</option></select></div>
    </div>`,
    async d => {
      const payload = {
        name: d.name.trim(), category: d.category.trim(),
        description: d.description.trim(), longDescription: d.longDescription.trim(),
        technologies: d.technologies.split(",").map(t => t.trim()).filter(Boolean),
        thumbnail: d.thumbnail.trim(), images: lines(d.images),
        projectUrl: d.projectUrl.trim(), githubUrl: d.githubUrl.trim(),
        ctaText: d.ctaText.trim(), featured: d.featured === "yes", published: d.published === "yes",
        updatedAt: serverTimestamp()
      };
      if (p) await updateDoc(doc(db, "projects", p.id), payload);
      else await addDoc(collection(db, "projects"), { ...payload, order: store.projects.length, createdAt: serverTimestamp() });
      await loadCol("projects"); render("projects"); toast("Project saved.");
    });
}

function socialModal(index) {
  const arr = [...(store.contact.socials || [])];
  const s = index >= 0 ? arr[index] : { label: "", url: "" };
  openModal(`<h3>${index >= 0 ? "Edit" : "Add"} social link</h3>
    ${field("label", "Label", s.label, "text", "e.g. GitHub, LinkedIn, WhatsApp")}
    ${field("url", "URL", s.url, "url")}`,
    async d => {
      const item = { label: d.label.trim(), url: d.url.trim() };
      if (index >= 0) arr[index] = item; else arr.push(item);
      await saveDoc("contact", "contact", { socials: arr });
      store.contact.socials = arr; render("contact");
    });
}

/* ================= NAV ================= */
$("#sideNav").addEventListener("click", e => {
  const t = e.target.closest(".tab");
  if (!t) return;
  render(t.dataset.view);
  $("#side").classList.remove("open");
});
$("#sideToggle").addEventListener("click", () => $("#side").classList.toggle("open"));
