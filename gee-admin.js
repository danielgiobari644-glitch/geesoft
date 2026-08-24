/* ============================================================
   GEE — admin dashboard (vanilla JS).
   Auth gate + shell + content management panels.
   ============================================================ */
import {
  store, getData, getSession, isProvisioned, getCredential,
  provisionAdmin, signIn, signOut, changePassword, uid,
} from "./gee-data.js";
import {
  escapeHtml, icon, spinner, toast, openModal, confirmDialog,
  mountListEditor, normalizeUrl, prettyUrl, timeAgo,
} from "./gee-ui.js";

const clone = (o) => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
function setPath(o, p, v) {
  const ks = p.split(".");
  let x = o;
  for (let i = 0; i < ks.length - 1; i++) { if (x[ks[i]] == null) x[ks[i]] = {}; x = x[ks[i]]; }
  x[ks[ks.length - 1]] = v;
}
function bindPaths(scope, obj, onDirty) {
  scope.querySelectorAll("[data-path]").forEach((el) => {
    const p = el.getAttribute("data-path");
    const ev = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(ev, () => { setPath(obj, p, el.type === "checkbox" ? el.checked : el.value); onDirty && onDirty(); });
  });
}
function field(label, controlHtml, hint) {
  return `<label class="field"><span class="field__label">${escapeHtml(label)}</span>${controlHtml}${hint ? `<span class="field__hint">${escapeHtml(hint)}</span>` : ""}</label>`;
}
function toggleHtml(checked, label, path) {
  return `<button type="button" class="toggle" data-path="${path}" aria-pressed="${checked}"><span class="toggle__track"></span><span class="toggle__label">${escapeHtml(label)}</span></button>`;
}

/* ---------- generic repeater (array of objects) ---------- */
function repeater(container, items, fields, onChange, addLabel) {
  function render() {
    container.innerHTML = "";
    items.forEach((it, i) => {
      const row = document.createElement("div");
      row.style.cssText = "border:1px solid var(--line);background:var(--ink-850);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;margin-bottom:10px";
      let html = "";
      fields.forEach((f) => {
        html += `<label class="field" style="margin:0"><span class="field__label">${escapeHtml(f.label)}</span>`;
        html += f.multiline
          ? `<textarea class="input" data-k="${f.key}" rows="${f.rows || 2}" style="min-height:auto">${escapeHtml(it[f.key] || "")}</textarea>`
          : `<input class="input" data-k="${f.key}" value="${escapeHtml(it[f.key] || "")}" placeholder="${escapeHtml(f.placeholder || "")}"/>`;
        html += `</label>`;
      });
      html += `<button type="button" class="btn btn--secondary btn--sm" data-rm style="align-self:flex-start">${icon("trash", 14)} Remove</button>`;
      row.innerHTML = html;
      row.querySelectorAll("[data-k]").forEach((inp) => {
        const k = inp.getAttribute("data-k");
        inp.addEventListener("input", () => { items[i][k] = inp.value; onChange(); });
      });
      row.querySelector("[data-rm]").onclick = () => { items.splice(i, 1); onChange(); render(); };
      container.appendChild(row);
    });
    const add = document.createElement("button");
    add.className = "btn btn--secondary btn--sm";
    add.innerHTML = `${icon("plus", 14)} ${escapeHtml(addLabel || "Add")}`;
    add.onclick = () => { const o = {}; fields.forEach((f) => (o[f.key] = "")); items.push(o); onChange(); render(); };
    container.appendChild(add);
  }
  render();
}

/* ---------- generic tabs panel ---------- */
function tabsPanel(host, defs) {
  let active = 0;
  function paint() {
    host.innerHTML = `<div class="tabs">${defs.map((d, i) => `<button class="tab ${i === active ? "active" : ""}" data-t="${i}"><span class="ic">${icon(d.icon, 14)}</span> ${escapeHtml(d.label)}</button>`).join("")}</div><div class="tab-body"></div>`;
    host.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { active = +b.dataset.t; paint(); }));
    defs[active].mount(host.querySelector(".tab-body"));
  }
  paint();
}

const NAV = [
  { id: "overview", label: "Dashboard", icon: "dashboard" },
  { id: "projects", label: "Projects", icon: "layers" },
  { id: "catalog", label: "Catalog", icon: "grid" },
  { id: "content", label: "Content", icon: "file" },
  { id: "messages", label: "Messages", icon: "mail" },
  { id: "settings", label: "Settings", icon: "settings" },
];

let rootRef = null;
let currentRoute = "overview";

export function mountAdmin(root) {
  rootRef = root;
  if (getSession()) renderShell();
  else renderAuth();
}

/* ============================================================ AUTH GATE */
function renderAuth() {
  const provisioned = isProvisioned();
  const mode = provisioned ? "login" : "setup";
  rootRef.innerHTML = `
  <div class="auth-screen">
    <div class="grid-bg mask-fade" style="position:absolute;inset:0;pointer-events:none"></div>
    <div style="position:absolute;top:25%;left:50%;height:288px;width:600px;transform:translateX(-50%);border-radius:999px;background:rgba(77,124,255,.12);filter:blur(120px);pointer-events:none"></div>
    <div class="auth-card anim-scalein">
      <a href="/" style="display:inline-flex;align-items:center;gap:10px;margin-bottom:32px">
        <span class="brand-mark" style="height:36px;width:36px"><b>G</b><span class="pip"></span></span>
        <span><b class="font-display" style="display:block;font-size:15px;letter-spacing:.16em;color:var(--paper)">GEE ADMIN</b><small class="font-mono" style="display:block;margin-top:4px;font-size:9px;letter-spacing:.18em;color:var(--mute-2);text-transform:uppercase">Protected area</small></span>
      </a>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <span style="display:grid;place-items:center;height:40px;width:40px;border-radius:12px;border:1px solid rgba(77,124,255,.3);background:rgba(77,124,255,.1);color:var(--accent)">${icon(provisioned ? "lock" : "shield", 18)}</span>
        <div><h1 class="font-display" style="font-size:18px;font-weight:700;color:var(--paper);margin:0">${provisioned ? "Administrator sign-in" : "Provision administrator"}</h1><p style="font-size:12.5px;color:var(--mute);margin:4px 0 0">${provisioned ? "Authorized access only." : "No admin account exists on this device yet."}</p></div>
      </div>
      <form id="authForm" style="display:flex;flex-direction:column;gap:16px">
        <label class="field"><span class="field__label">Email</span><input class="input" type="email" id="aEmail" required placeholder="admin@gee.dev" value="${provisioned ? escapeHtml(getCredential()?.email || "") : ""}"/></label>
        <label class="field"><span class="field__label">Password</span><input class="input" type="password" id="aPw" required placeholder="••••••••"/></label>
        ${!provisioned ? `<label class="field"><span class="field__label">Confirm password</span><input class="input" type="password" id="aPw2" required placeholder="••••••••"/></label>` : ""}
        <div id="aErr" class="err" style="display:none"></div>
        <button class="btn btn--primary btn--lg" type="submit" id="aSubmit" style="width:100%">${icon("lock", 15)} ${provisioned ? "Sign in" : "Create account & sign in"}</button>
      </form>
      <p style="margin:24px 0 0;border-top:1px solid var(--line);padding-top:20px;font-size:12px;line-height:1.6;color:var(--mute-2)">Credentials are never stored in the source code. The password is hashed with PBKDF2-SHA256 (210,000 iterations) and a random salt before it is written to this device; only the derived hash is kept.</p>
      <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px">
        <a href="/" style="display:inline-flex;align-items:center;gap:6px;color:var(--mute)"><span style="display:inline-block;transform:rotate(180deg)">${icon("arrow", 13)}</span> Back to website</a>
      </div>
    </div>
  </div>`;
  const form = document.getElementById("authForm");
  const errEl = document.getElementById("aErr");
  const submit = document.getElementById("aSubmit");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("aEmail").value;
    const pw = document.getElementById("aPw").value;
    errEl.style.display = "none";
    submit.disabled = true;
    submit.innerHTML = spinner(16) + " Working…";
    let res;
    if (provisioned) {
      res = await signIn(email, pw);
    } else {
      const pw2 = document.getElementById("aPw2").value;
      if (pw !== pw2) { res = { ok: false, error: "Passwords do not match." }; }
      else { const p = await provisionAdmin(email, pw); if (!p.ok) res = p; else res = await signIn(email, pw); }
    }
    if (!res.ok) {
      errEl.textContent = res.error || "Sign-in failed.";
      errEl.style.display = "block";
      submit.disabled = false;
      submit.innerHTML = icon("lock", 15) + (provisioned ? " Sign in" : " Create account & sign in");
    } else {
      toast("Signed in");
      renderShell();
    }
  });
}

/* ============================================================ SHELL */
function renderShell() {
  const email = getSession()?.email || "";
  rootRef.innerHTML = `
  <div class="admin">
    <aside class="admin__sidebar" id="sidebar">
      <div class="admin__brand"><span class="brand-mark" style="height:32px;width:32px"><b>G</b><span class="pip"></span></span><div><b class="font-display" style="display:block;font-size:13.5px;letter-spacing:.16em;color:var(--paper)">GEE ADMIN</b><small class="font-mono" style="display:block;margin-top:4px;font-size:9px;letter-spacing:.16em;color:var(--mute-2);text-transform:uppercase">Content operations</small></div></div>
      <nav class="admin__nav scroll-thin" id="adminNav"></nav>
      <div class="admin__sidebar-foot">
        <a href="/" class="admin__nav-item" style="margin-bottom:0">${icon("globe", 16)} View public site</a>
        <div class="admin__user">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="display:grid;place-items:center;height:28px;width:28px;border-radius:8px;background:rgba(77,124,255,.15);color:var(--accent);font-family:var(--font-display);font-size:11px;font-weight:700">${escapeHtml(email.slice(0, 2).toUpperCase())}</span>
            <span class="truncate" style="font-size:12px;color:var(--mute)">${escapeHtml(email)}</span>
          </div>
          <button class="btn btn--secondary btn--sm" id="signoutBtn" style="width:100%">${icon("logout", 13)} Sign out</button>
        </div>
      </div>
    </aside>
    <div class="admin__main">
      <header class="admin__topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="nav-burger" id="adminBurger" style="display:grid">${icon("menu", 18)}</button>
          <div><div class="font-display" id="topTitle" style="font-size:15px;font-weight:600;color:var(--paper)">Dashboard</div><small class="font-mono" style="display:none;font-size:10px;letter-spacing:.14em;color:var(--mute-2);text-transform:uppercase">gee / admin / overview</small></div>
        </div>
        <span class="badge badge--green"><span class="dot"></span> Authenticated</span>
      </header>
      <main class="admin__content" id="adminContent"></main>
    </div>
  </div>`;
  buildNav();
  document.getElementById("signoutBtn").onclick = () => { signOut(); renderAuth(); };
  const burger = document.getElementById("adminBurger");
  const sidebar = document.getElementById("sidebar");
  burger.onclick = () => sidebar.classList.toggle("open");
  sidebar.addEventListener("click", (e) => { if (e.target.closest(".admin__nav-item")) sidebar.classList.remove("open"); });
  if (!window.__geeAdminStorage) {
    window.__geeAdminStorage = true;
    window.addEventListener("storage", (e) => {
      if (e.key !== "gee.data.v1") return;
      buildNav();
      if (currentRoute === "messages") renderPanel("messages");
    });
  }
  renderPanel(currentRoute);
}

function buildNav() {
  const unread = store.getMessages().filter((m) => m.role === "visitor" && !m.adminRead).length;
  const nav = document.getElementById("adminNav");
  nav.innerHTML = NAV.map((n) => {
    const badge = n.id === "messages" && unread ? `<span class="nav-badge">${unread}</span>` : "";
    return `<button class="admin__nav-item ${n.id === currentRoute ? "active" : ""}" data-route="${n.id}"><span class="ic">${icon(n.icon, 16)}</span> ${n.label}${badge}</button>`;
  }).join("");
  nav.querySelectorAll("[data-route]").forEach((b) => (b.onclick = () => { currentRoute = b.dataset.route; buildNav(); renderPanel(currentRoute); document.getElementById("adminContent").scrollTo({ top: 0 }); }));
}

function renderPanel(route) {
  document.getElementById("topTitle").textContent = NAV.find((n) => n.id === route)?.label || "";
  const c = document.getElementById("adminContent");
  c.innerHTML = "";
  if (route === "overview") overview(c);
  else if (route === "projects") projectsPanel(c);
  else if (route === "catalog") catalogPanel(c);
  else if (route === "content") contentPanel(c);
  else if (route === "messages") messagesPanel(c);
  else if (route === "settings") settingsPanel(c);
}

/* ============================================================ OVERVIEW */
function overview(c) {
  const d = getData();
  const contactFilled = [d.contact.email, d.contact.phone, d.contact.whatsapp, d.contact.telegram, d.contact.instagram, d.contact.tiktok, d.contact.github, d.contact.youtube, ...d.contact.extra.map((e) => e.url)].filter(Boolean).length;
  const techCount = new Set(d.projects.flatMap((p) => p.tech.flatMap((g) => g.items))).size;
  const newMsgs = (d.messages || []).filter((m) => m.role === "visitor" && !m.adminRead).length;
  const stats = [
    { label: "Total projects", value: d.projects.length, icon: "layers", route: "projects" },
    { label: "Published projects", value: d.projects.filter((p) => p.published).length, icon: "check", route: "projects" },
    { label: "Solution categories", value: d.categories.length, icon: "users", route: "catalog" },
    { label: "Platforms", value: d.platforms.length, icon: "link", route: "catalog" },
    { label: "New messages", value: newMsgs, icon: "mail", route: "messages" },
    { label: "Contact channels", value: contactFilled, icon: "mail", route: "content" },
    { label: "Technologies in use", value: techCount, icon: "code", route: "content" },
  ];
  c.innerHTML = `
    <div class="panel-head"><div><h1>GEE ADMIN</h1><p>Everything the public website renders is managed from here. Changes are saved instantly and reflected on the site.</p></div><button class="btn btn--secondary btn--sm" data-route="projects">${icon("plus", 14)} Manage projects</button></div>
    <div class="stat-cards">
      ${stats.map((s) => `<button class="stat-card" data-route="${s.route}"><div class="stat-card__top"><span class="ico">${icon(s.icon, 17)}</span>${icon("arrow", 15)}</div><b>${s.value}</b><small>${escapeHtml(s.label)}</small></button>`).join("")}
    </div>
    <div class="grid-2" style="margin-top:20px">
      <div class="acard"><div class="acard__head"><h2>Recent content updates</h2><p>The last changes made through this dashboard.</p></div><div class="acard__body" id="actList"></div></div>
      <div class="acard"><div class="acard__head"><h2>Live platforms</h2><p>Verify the links an examiner will click.</p></div><div class="acard__body" id="pltList"></div></div>
    </div>`;
  c.querySelectorAll("[data-route]").forEach((b) => (b.onclick = () => { currentRoute = b.dataset.route; buildNav(); renderPanel(currentRoute); }));
  const actList = document.getElementById("actList");
  actList.innerHTML = d.activity.length ? `<div class="stack">` + d.activity.slice(0, 8).map((a) =>
    `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:12px 16px"><span style="display:grid;place-items:center;height:32px;width:32px;border-radius:8px;background:rgba(77,124,255,.12);color:var(--accent);flex-shrink:0">${icon("edit", 14)}</span><div class="truncate" style="flex:1;font-size:13.5px;color:var(--paper)">${escapeHtml(a.action)} <span style="color:var(--mute)">— ${escapeHtml(a.target)}</span></div><span class="font-mono" style="font-size:10.5px;color:var(--mute-2);flex-shrink:0">${timeAgo(a.at)}</span></div>`
  ).join("") + `</div>` : `<p style="font-size:13px;color:var(--mute-2)">No changes recorded yet in this session.</p>`;
  const pltList = document.getElementById("pltList");
  pltList.innerHTML = d.platforms.length ? d.platforms.slice().sort((a, b) => a.order - b.order).map((p) =>
    `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:12px 16px;margin-bottom:10px"><span style="display:grid;place-items:center;height:32px;width:32px;border-radius:8px;border:1px solid var(--line);background:var(--ink-800);color:var(--paper);font-family:var(--font-display);font-size:10px;font-weight:700;flex-shrink:0">${escapeHtml(p.icon || p.name.slice(0, 2).toUpperCase())}</span><div class="truncate" style="flex:1;min-width:0"><div class="truncate" style="font-size:13.5px;color:var(--paper)">${escapeHtml(p.name)}</div><div class="truncate font-mono" style="font-size:10.5px;color:var(--mute-2)">${escapeHtml(p.url.replace(/^https?:\/\//, ""))}</div></div><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="icon-btn" aria-label="Open ${escapeHtml(p.name)}">${icon("external", 13)}</a></div>`
  ).join("") : `<p style="font-size:13px;color:var(--mute-2)">No platforms configured.</p>`;
}

/* ============================================================ PROJECTS */
function emptyProject() {
  return { id: uid(), order: 999, published: false, name: "", tagline: "", categoryId: "", status: "Live", description: "", problem: "", users: [], solution: "", features: [], tech: [], challenges: [], result: "", liveUrl: "", githubUrl: "", logo: "", thumbnail: "", heroImage: "", screenshots: [], accent: "#4d7cff", updatedAt: Date.now() };
}

function projectsPanel(c) {
  const d = getData();
  const q = { v: "", f: "all" };
  function list() {
    return [...d.projects].sort((a, b) => a.order - b.order)
      .filter((p) => (q.f === "all" ? true : q.f === "published" ? p.published : !p.published))
      .filter((p) => (q.v ? (p.name + p.tagline + p.description).toLowerCase().includes(q.v.toLowerCase()) : true));
  }
  function paint() {
    const catName = (id) => d.categories.find((x) => x.id === id)?.title || "—";
    const items = list();
    c.innerHTML = `
      <div class="panel-head"><div><h1>Projects</h1><p>Everything on the public showcase is rendered from these records.</p></div><button class="btn btn--primary btn--sm" id="addProj">${icon("plus", 15)} Add project</button></div>
      <div class="toolbar"><div class="grow" style="position:relative"><span style="position:absolute;top:50%;left:12px;transform:translateY(-50%);color:var(--mute-2)">${icon("search", 15)}</span><input class="input" id="projQ" placeholder="Search projects…" style="padding-left:36px" value="${escapeHtml(q.v)}"/></div><select class="select" id="projF" style="width:100%"><option value="all" ${q.f === "all" ? "selected" : ""}>All projects</option><option value="published" ${q.f === "published" ? "selected" : ""}>Published</option><option value="draft" ${q.f === "draft" ? "selected" : ""}>Unpublished</option></select></div>
      <div id="projRows"></div>`;
    document.getElementById("projQ").addEventListener("input", (e) => { q.v = e.target.value; renderRows(); });
    document.getElementById("projF").addEventListener("change", (e) => { q.f = e.target.value; renderRows(); });
    document.getElementById("addProj").onclick = () => projectEditor(emptyProject(), () => { Object.assign(d, getData()); renderRows(); });
    function renderRows() {
      const items = list();
      const box = document.getElementById("projRows");
      if (!items.length) {
        box.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:var(--r-lg);padding:56px 24px;text-align:center"><div style="margin-bottom:16px;display:grid;place-items:center;height:48px;width:48px;border-radius:12px;border:1px solid var(--line);background:var(--ink-850);color:var(--mute)">${icon("layers", 20)}</div><h4 class="font-display" style="font-size:16px;font-weight:600;color:var(--paper);margin:0">No projects</h4><p style="margin:6px 0 20px;font-size:14px;color:var(--mute)">Add your first project to populate the public showcase.</p><button class="btn btn--primary btn--sm" id="addProj2">${icon("plus", 15)} Add project</button></div>`;
        const a = document.getElementById("addProj2"); if (a) a.onclick = () => projectEditor(emptyProject(), () => { Object.assign(d, getData()); renderRows(); });
        return;
      }
      box.innerHTML = `<div class="stack">${items.map((p) => `
        <div style="border:1px solid var(--line);background:rgba(10,13,18,.6);border-radius:var(--r-lg);padding:16px 20px">
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;align-items:flex-start;gap:14px;flex:1;min-width:0">
              <span style="display:grid;place-items:center;height:44px;width:44px;border-radius:12px;border:1px solid ${escapeHtml(p.accent)}55;background:${escapeHtml(p.accent)}14;color:${escapeHtml(p.accent)};font-family:var(--font-display);font-size:12px;font-weight:700;flex-shrink:0">${escapeHtml(p.logo || p.name.slice(0, 2).toUpperCase() || "··")}</span>
              <div style="min-width:0">
                <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"><h3 class="truncate font-display" style="font-size:15px;font-weight:700;color:var(--paper);margin:0">${escapeHtml(p.name || "Untitled")}</h3><span class="badge ${p.published ? "badge--green" : "badge--muted"}">${p.published ? "Published" : "Draft"}</span><span class="badge">${escapeHtml(catName(p.categoryId))}</span></div>
                <p class="truncate" style="margin:4px 0 0;font-size:13px;color:var(--mute)">${escapeHtml(p.tagline || "No tagline")}</p>
                <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:10.5px;color:var(--mute-2)"><span>order ${p.order}</span><span>${p.features.length} features</span><span>${p.challenges.length} challenges</span><span>updated ${timeAgo(p.updatedAt)}</span>${p.liveUrl ? `<span class="truncate">${escapeHtml(prettyUrl(p.liveUrl))}</span>` : ""}</div>
              </div>
            </div>
            <div class="row-actions" style="justify-content:flex-end">
              <div class="move-group"><button data-up="${p.id}" aria-label="Up">${chev(-90)}</button><span class="sep"></span><button data-down="${p.id}" aria-label="Down">${chev(90)}</button></div>
              <button class="btn btn--secondary btn--sm" data-pub="${p.id}">${p.published ? "Unpublish" : "Publish"}</button>
              <button class="btn btn--secondary btn--sm" data-edit="${p.id}">${icon("edit", 14)} Edit</button>
              <button class="icon-btn danger" data-del="${p.id}" aria-label="Delete">${icon("trash", 14)}</button>
            </div>
          </div>
        </div>`).join("")}</div>`;
      box.querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => { store.moveProject(b.dataset.up, -1); Object.assign(d, getData()); renderRows(); }));
      box.querySelectorAll("[data-down]").forEach((b) => (b.onclick = () => { store.moveProject(b.dataset.down, 1); Object.assign(d, getData()); renderRows(); }));
      box.querySelectorAll("[data-pub]").forEach((b) => (b.onclick = () => { const p = getData().projects.find((x) => x.id === b.dataset.pub); store.toggleProjectPublished(b.dataset.pub); Object.assign(d, getData()); toast((p.published ? p.name + " unpublished" : p.name + " published"), "info"); renderRows(); }));
      box.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => { const p = getData().projects.find((x) => x.id === b.dataset.edit); projectEditor(clone(p), () => { Object.assign(d, getData()); renderRows(); }); }));
      box.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => { const p = getData().projects.find((x) => x.id === b.dataset.del); const ok = await confirmDialog({ title: "Delete project", message: '"' + p.name + '" and its case study will be permanently removed from the website. This cannot be undone.' }); if (ok) { store.deleteProject(b.dataset.del); Object.assign(d, getData()); toast(p.name + " deleted", "info"); renderRows(); } }));
    }
    renderRows();
  }
  paint();
}
function chev(deg) { return `<span style="display:inline-block;transform:rotate(${deg}deg)">${icon("chevron", 14)}</span>`; }

function projectEditor(proj, onClose) {
  const ed = clone(proj);
  ["users", "features", "tech", "challenges", "screenshots"].forEach((k) => { if (!Array.isArray(ed[k])) ed[k] = []; });
  const TABS = ["Basics", "Problem & Users", "Solution & Features", "Technology", "Challenges", "Result & Media"];
  let active = 0;
  let err = "";
  const m = openModal({ title: ed.name ? "Edit — " + ed.name : "New project", size: "lg" });

  function tabbar() {
    return `<div class="cs-tabs">${TABS.map((t, i) => `<button class="cs-tab ${i === active ? "active" : ""}" data-tab="${i}"><span class="no">${String(i + 1).padStart(2, "0")}</span> ${t}</button>`).join("")}</div>`;
  }
  function foot() {
    return `<div style="display:flex;flex-direction:column-reverse;gap:8px"><div class="err">${escapeHtml(err)}</div><div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn--secondary btn--sm" data-close>Cancel</button><button class="btn btn--primary btn--sm" data-save>${icon("check", 14)} Save project</button></div></div>`;
  }
  function basics() {
    const cats = getData().categories;
    return `
      <div class="field-grid field-grid--2">${field("Project name", `<input class="input" data-bind="name" value="${escapeHtml(ed.name)}" placeholder="Home.cell"/>`)}${field("Tagline / project type", `<input class="input" data-bind="tagline" value="${escapeHtml(ed.tagline)}" placeholder="Christian Community Platform"/>`)}</div>
      <div class="field-grid field-grid--2" style="margin-top:16px">${field("Solution category", `<select class="select" data-bind="categoryId"><option value="">Select category…</option>${cats.map((c) => `<option value="${c.id}" ${ed.categoryId === c.id ? "selected" : ""}>${escapeHtml(c.title)}</option>`).join("")}</select>`)}${field("Status label", `<input class="input" data-bind="status" value="${escapeHtml(ed.status)}" placeholder="Live"/>`, "Only claim what is true — e.g. Live, In development.")}</div>
      <div style="margin-top:16px">${field("Short description", `<textarea class="input" data-bind="description" rows="3">${escapeHtml(ed.description)}</textarea>`)}</div>
      <div class="field-grid field-grid--2" style="margin-top:16px">${field("Live application URL", `<input class="input" data-bind="liveUrl" value="${escapeHtml(ed.liveUrl)}" placeholder="https://…"/>`)}${field("GitHub URL (optional)", `<input class="input" data-bind="githubUrl" value="${escapeHtml(ed.githubUrl)}" placeholder="https://github.com/…"/>`)}</div>
      <div class="field-grid field-grid--2" style="margin-top:16px">${field("Project logo (initials)", `<input class="input" data-bind="logo" maxlength="4" value="${escapeHtml(ed.logo)}" placeholder="HC"/>`)}${field("Accent colour", `<div style="display:flex;gap:8px"><input type="color" data-bind="accent" value="${escapeHtml(ed.accent)}" style="height:44px;width:56px;border-radius:12px;border:1px solid var(--line);background:var(--ink-950);padding:4px;cursor:pointer"/><input class="input" data-bind="accent" value="${escapeHtml(ed.accent)}"/></div>`)}</div>
      <div style="margin-top:16px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:16px">${toggleHtml(ed.published, "Published on the public website", "published")}</div>`;
  }
  function problemUsers() {
    return `${field("01 — The problem", `<textarea class="input" data-bind="problem" rows="6">${escapeHtml(ed.problem)}</textarea>`, "Written in plain language, before technology.")}<div style="margin-top:16px">${field("02 — Target users", "")}<div id="leUsers"></div></div>`;
  }
  function solutionFeatures() {
    return `${field("03 — The solution", `<textarea class="input" data-bind="solution" rows="6">${escapeHtml(ed.solution)}</textarea>`)}<div style="margin-top:16px">${field("04 — Implemented features", `<div id="leFeatures"></div>`, "Only list features that exist in the deployed application.")}</div>`;
  }
  function technology() {
    return `<p style="font-size:13px;color:var(--mute);margin:0 0 16px">Groups defined here feed the public Technology section automatically.</p><div id="techGroups"></div>`;
  }
  function challenges() {
    return `<p style="font-size:13px;color:var(--mute);margin:0 0 16px">Each challenge is rendered as challenge → approach → result.</p><div id="chRepeater"></div>`;
  }
  function resultMedia() {
    return `${field("07 — The result", `<textarea class="input" data-bind="result" rows="5">${escapeHtml(ed.result)}</textarea>`, "What users can actually accomplish through the platform.")}<div class="field-grid field-grid--2" style="margin-top:16px">${field("Thumbnail image URL", `<input class="input" data-bind="thumbnail" value="${escapeHtml(ed.thumbnail)}" placeholder="https://…"/>`, "Leave empty to use the generated GEE project graphic.")}${field("Hero image URL (optional)", `<input class="input" data-bind="heroImage" value="${escapeHtml(ed.heroImage)}" placeholder="https://…"/>`)}</div><div style="margin-top:16px"><div class="field__label" style="margin-bottom:10px">Screenshots</div><div id="shots"></div></div>`;
  }
  function body() {
    const map = [basics, problemUsers, solutionFeatures, technology, challenges, resultMedia];
    return tabbar() + `<div class="anim-fadeup">${map[active]()}</div>`;
  }
  function paint() {
    m.bodyEl.innerHTML = body();
    m.footEl.innerHTML = foot();
    m.footEl.style.display = "";
    // bind simple fields
    m.bodyEl.querySelectorAll("[data-bind]").forEach((el) => {
      const k = el.getAttribute("data-bind");
      const ev = el.type === "color" ? "input" : "input";
      el.addEventListener(ev, () => { ed[k] = el.value; });
      if (k === "published" && el.classList.contains("toggle")) { /* handled below */ }
    });
    // toggle
    m.bodyEl.querySelectorAll(".toggle[data-path='published']").forEach((t) => {
      t.onclick = () => { ed.published = !ed.published; t.setAttribute("aria-pressed", ed.published); };
    });
    // list editors
    const leU = m.bodyEl.querySelector("#leUsers"); if (leU) mountListEditor(leU, ed.users, (v) => (ed.users = v), "e.g. Cell leaders");
    const leF = m.bodyEl.querySelector("#leFeatures"); if (leF) mountListEditor(leF, ed.features, (v) => (ed.features = v), "e.g. Group chat");
    // tech groups
    const tg = m.bodyEl.querySelector("#techGroups");
    if (tg) {
      function renderTech() {
        tg.innerHTML = ed.tech.map((g, i) => `<div style="border:1px solid var(--line);background:var(--ink-850);border-radius:14px;padding:16px;margin-bottom:12px"><div style="display:flex;gap:8px;margin-bottom:12px"><input class="input tg-name" data-i="${i}" value="${escapeHtml(g.group)}" placeholder="Frontend"/><button class="btn btn--secondary btn--md tg-rm" data-i="${i}">${icon("trash", 14)}</button></div><div class="tg-items" data-i="${i}"></div></div>`).join("") + `<button class="btn btn--secondary btn--sm" id="tgAdd">${icon("plus", 14)} Add technology group</button>`;
        tg.querySelectorAll(".tg-name").forEach((inp) => (inp.oninput = () => { ed.tech[+inp.dataset.i].group = inp.value; }));
        tg.querySelectorAll(".tg-rm").forEach((b) => (b.onclick = () => { ed.tech.splice(+b.dataset.i, 1); renderTech(); }));
        tg.querySelectorAll(".tg-items").forEach((box) => mountListEditor(box, ed.tech[+box.dataset.i].items, (v) => { ed.tech[+box.dataset.i].items = v; }, "e.g. JavaScript"));
        document.getElementById("tgAdd").onclick = () => { ed.tech.push({ group: "", items: [] }); renderTech(); };
      }
      renderTech();
    }
    // challenges repeater
    const cr = m.bodyEl.querySelector("#chRepeater");
    if (cr) repeater(cr, ed.challenges, [
      { key: "title", label: "Title" },
      { key: "challenge", label: "Challenge", multiline: true },
      { key: "approach", label: "Approach", multiline: true },
      { key: "result", label: "Result", multiline: true },
    ], () => {}, "Add challenge");
    // screenshots repeater
    const sh = m.bodyEl.querySelector("#shots");
    if (sh) repeater(sh, ed.screenshots, [
      { key: "url", label: "Image URL" },
      { key: "caption", label: "Caption" },
    ], () => {}, "Add screenshot");
    // tab switching
    m.bodyEl.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { active = +b.dataset.tab; paint(); }));
    // footer
    m.footEl.querySelector("[data-close]").onclick = () => { m.close(); onClose && onClose(); };
    m.footEl.querySelector("[data-save]").onclick = () => {
      if (!ed.name.trim()) { err = "Project name is required."; active = 0; paint(); return; }
      if (!ed.categoryId) { err = "Select a solution category."; active = 0; paint(); return; }
      err = "";
      store.saveProject(ed);
      toast((ed.name || "Project") + " saved");
      m.close(); onClose && onClose();
    };
  }
  paint();
}

/* ============================================================ CATALOG */
function catalogPanel(c) {
  tabsPanel(c, [
    { label: "Solution Categories", icon: "users", mount: categoriesTab },
    { label: "Platforms & Links", icon: "link", mount: platformsTab },
  ]);
}

const CAT_ICONS = ["education", "church", "community", "cbt", "code", "users", "globe", "layers", "rocket", "database", "shield", "devices"];
function emptyCategory() { return { id: uid(), order: 999, enabled: true, title: "", icon: "layers", description: "", users: [], problems: [], updatedAt: Date.now() }; }
function categoriesTab(host) {
  function paint() {
    const d = getData();
    const list = [...d.categories].sort((a, b) => a.order - b.order);
    host.innerHTML = `
      <div class="panel-head"><div><h1 style="font-size:20px">Solution Categories</h1><p>Drives the “Audiences” section. Nothing about categories is hard-coded.</p></div><button class="btn btn--primary btn--sm" id="addCat">${icon("plus", 15)} Add category</button></div>
      <div class="field-grid" style="grid-template-columns:1fr 1fr;gap:12px;display:grid" id="catGrid"></div>`;
    const grid = document.getElementById("catGrid");
    grid.innerHTML = list.map((cat) => {
      const used = d.projects.filter((p) => p.categoryId === cat.id).length;
      return `<div style="border:1px solid var(--line);background:rgba(10,13,18,.6);border-radius:var(--r-lg);padding:20px">
        <div style="display:flex;align-items:flex-start;gap:14px"><span style="display:grid;place-items:center;height:40px;width:40px;border-radius:12px;border:1px solid rgba(77,124,255,.3);background:rgba(77,124,255,.1);color:var(--accent);flex-shrink:0">${icon(cat.icon, 18)}</span>
        <div style="min-width:0;flex:1"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"><h3 class="font-display" style="font-size:15px;font-weight:700;color:var(--paper);margin:0">${escapeHtml(cat.title)}</h3><span class="badge ${cat.enabled ? "badge--green" : "badge--muted"}">${cat.enabled ? "Enabled" : "Disabled"}</span><span class="badge">${used} project${used === 1 ? "" : "s"}</span></div>
        <p class="truncate" style="margin:6px 0 0;font-size:13px;color:var(--mute)">${escapeHtml(cat.description)}</p>
        <div class="font-mono" style="margin-top:8px;font-size:10.5px;color:var(--mute-2)">${cat.users.length} users · ${cat.problems.length} problems · order ${cat.order}</div></div></div>
        <div class="row-actions" style="margin-top:16px;border-top:1px solid var(--line);padding-top:16px"><div class="move-group"><button data-up="${cat.id}">${chev(-90)}</button><span class="sep"></span><button data-down="${cat.id}">${chev(90)}</button></div><button class="btn btn--secondary btn--sm" data-tog="${cat.id}">${cat.enabled ? "Disable" : "Enable"}</button><button class="btn btn--secondary btn--sm" data-edit="${cat.id}">${icon("edit", 14)} Edit</button><button class="icon-btn danger" data-del="${cat.id}">${icon("trash", 14)}</button></div>
      </div>`;
    }).join("") || `<p style="grid-column:1/-1;font-size:13px;color:var(--mute-2)">No categories yet.</p>`;
    grid.querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => { store.moveCategory(b.dataset.up, -1); paint(); }));
    grid.querySelectorAll("[data-down]").forEach((b) => (b.onclick = () => { store.moveCategory(b.dataset.down, 1); paint(); }));
    grid.querySelectorAll("[data-tog]").forEach((b) => (b.onclick = () => { store.toggleCategory(b.dataset.tog); paint(); }));
    grid.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => { categoryEditor(clone(getData().categories.find((x) => x.id === b.dataset.edit)), paint); }));
    grid.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => { const cat = getData().categories.find((x) => x.id === b.dataset.del); const ok = await confirmDialog({ title: "Delete category", message: '"' + cat.title + '" will be removed. Projects assigned to it will lose their category label.' }); if (ok) { store.deleteCategory(b.dataset.del); toast(cat.title + " deleted", "info"); paint(); } }));
    document.getElementById("addCat").onclick = () => categoryEditor(emptyCategory(), paint);
  }
  paint();
}
function categoryEditor(cat, onDone) {
  const ed = clone(cat);
  ["users", "problems"].forEach((k) => { if (!Array.isArray(ed[k])) ed[k] = []; });
  let err = "";
  const m = openModal({ title: ed.title ? "Edit — " + ed.title : "New category" });
  function paint() {
    m.bodyEl.innerHTML = `
      <div class="field-grid field-grid--2">${field("Title", `<input class="input" data-bind="title" value="${escapeHtml(ed.title)}" placeholder="Education"/>`)}${field("Icon", `<select class="select" data-bind="icon">${CAT_ICONS.map((i) => `<option value="${i}" ${ed.icon === i ? "selected" : ""}>${i}</option>`).join("")}</select>`)}</div>
      <div style="margin-top:16px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:16px;display:flex;align-items:center;gap:12px"><span style="display:grid;place-items:center;height:40px;width:40px;border-radius:12px;border:1px solid rgba(77,124,255,.3);background:rgba(77,124,255,.1);color:var(--accent)">${icon(ed.icon, 18)}</span><span style="font-size:13px;color:var(--mute)">Icon preview</span></div>
      <div style="margin-top:16px">${field("Description", `<textarea class="input" data-bind="description" rows="3">${escapeHtml(ed.description)}</textarea>`)}</div>
      <div style="margin-top:16px">${field("Users", `<div id="leU"></div>`)}</div>
      <div style="margin-top:16px">${field("Problems", `<div id="leP"></div>`)}</div>
      <div style="margin-top:16px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:16px">${toggleHtml(ed.enabled, "Visible on the public website", "enabled")}</div>`;
    m.footEl.innerHTML = `<div style="display:flex;justify-content:space-between;gap:8px"><span class="err">${escapeHtml(err)}</span><div style="display:flex;gap:8px"><button class="btn btn--secondary btn--sm" data-close>Cancel</button><button class="btn btn--primary btn--sm" data-save>${icon("check", 14)} Save</button></div></div>`;
    m.footEl.style.display = "";
    m.bodyEl.querySelectorAll("[data-bind]").forEach((el) => { el.addEventListener("input", () => { ed[el.getAttribute("data-bind")] = el.value; }); });
    m.bodyEl.querySelectorAll(".toggle[data-path='enabled']").forEach((t) => (t.onclick = () => { ed.enabled = !ed.enabled; t.setAttribute("aria-pressed", ed.enabled); }));
    mountListEditor(m.bodyEl.querySelector("#leU"), ed.users, (v) => (ed.users = v), "e.g. Teachers");
    mountListEditor(m.bodyEl.querySelector("#leP"), ed.problems, (v) => (ed.problems = v), "e.g. Manual academic processes");
    m.footEl.querySelector("[data-close]").onclick = () => m.close();
    m.footEl.querySelector("[data-save]").onclick = () => { if (!ed.title.trim()) { err = "Title is required."; paint(); return; } err = ""; store.saveCategory(ed); toast((ed.title || "Category") + " saved"); m.close(); onDone && onDone(); };
  }
  paint();
}

function emptyPlatform() { return { id: uid(), order: 999, visible: true, name: "", category: "", url: "", description: "", icon: "", buttonLabel: "OPEN PLATFORM", updatedAt: Date.now() }; }
function platformsTab(host) {
  function paint() {
    const d = getData();
    const list = [...d.platforms].sort((a, b) => a.order - b.order);
    host.innerHTML = `
      <div class="panel-head"><div><h1 style="font-size:20px">Platforms & Links</h1><p>Live applications shown in the hero strip and the final call-to-action. Add new platforms here — no code change required.</p></div><button class="btn btn--primary btn--sm" id="addPlt">${icon("plus", 15)} Add platform</button></div>
      <div class="data-table">${list.map((p) => `
        <div class="data-row" style="grid-template-columns:1fr;gap:16px">
          <div style="display:flex;align-items:center;gap:12px;min-width:0"><span style="display:grid;place-items:center;height:36px;width:36px;border-radius:8px;border:1px solid var(--line);background:var(--ink-800);color:var(--paper);font-family:var(--font-display);font-size:11px;font-weight:700;flex-shrink:0">${escapeHtml(p.icon || p.name.slice(0, 2).toUpperCase())}</span><div style="min-width:0"><div class="truncate" style="font-size:14px;font-weight:500;color:var(--paper)">${escapeHtml(p.name)}</div><div class="truncate" style="font-size:12px;color:var(--mute-2)">${escapeHtml(p.category)}</div></div></div>
          <a href="${normalizeUrl(p.url)}" target="_blank" rel="noopener noreferrer" class="truncate font-mono" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--mute)">${icon("link", 12)} ${escapeHtml(prettyUrl(p.url))}</a>
          <span class="badge ${p.visible ? "badge--green" : "badge--muted"}">${p.visible ? "Visible" : "Hidden"}</span>
          <div class="row-actions" style="justify-content:flex-end"><div class="move-group"><button data-up="${p.id}">${chev(-90)}</button><span class="sep"></span><button data-down="${p.id}">${chev(90)}</button></div><button class="btn btn--secondary btn--sm" data-tog="${p.id}">${p.visible ? "Hide" : "Show"}</button><button class="btn btn--secondary btn--sm" data-edit="${p.id}">${icon("edit", 14)}</button><button class="icon-btn danger" data-del="${p.id}">${icon("trash", 14)}</button></div>
        </div>`).join("") || `<p style="padding:24px;font-size:13px;color:var(--mute-2)">No platforms yet.</p>`}</div>`;
    host.querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => { store.movePlatform(b.dataset.up, -1); paint(); }));
    host.querySelectorAll("[data-down]").forEach((b) => (b.onclick = () => { store.movePlatform(b.dataset.down, 1); paint(); }));
    host.querySelectorAll("[data-tog]").forEach((b) => (b.onclick = () => { store.togglePlatform(b.dataset.tog); paint(); }));
    host.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => platformEditor(clone(getData().platforms.find((x) => x.id === b.dataset.edit)), paint)));
    host.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => { const p = getData().platforms.find((x) => x.id === b.dataset.del); const ok = await confirmDialog({ title: "Delete platform", message: '"' + p.name + '" will be removed from the website links.' }); if (ok) { store.deletePlatform(b.dataset.del); toast(p.name + " deleted", "info"); paint(); } }));
    document.getElementById("addPlt").onclick = () => platformEditor(emptyPlatform(), paint);
  }
  paint();
}
function platformEditor(plat, onDone) {
  const ed = clone(plat);
  let err = "";
  const m = openModal({ title: ed.name ? "Edit — " + ed.name : "New platform" });
  function paint() {
    m.bodyEl.innerHTML = `
      <div class="field-grid field-grid--2">${field("Platform name", `<input class="input" data-bind="name" value="${escapeHtml(ed.name)}" placeholder="Home.cell"/>`)}${field("Platform category", `<input class="input" data-bind="category" value="${escapeHtml(ed.category)}" placeholder="Church / Community Platform"/>`)}</div>
      <div style="margin-top:16px">${field("URL", `<input class="input" data-bind="url" value="${escapeHtml(ed.url)}" placeholder="https://…"/>`)}</div>
      <div style="margin-top:16px">${field("Description", `<textarea class="input" data-bind="description" rows="2">${escapeHtml(ed.description)}</textarea>`)}</div>
      <div class="field-grid field-grid--2" style="margin-top:16px">${field("Icon / logo initials", `<input class="input" data-bind="icon" maxlength="4" value="${escapeHtml(ed.icon)}" placeholder="HC"/>`, "Up to 4 characters.")}${field("Button label", `<input class="input" data-bind="buttonLabel" value="${escapeHtml(ed.buttonLabel)}" placeholder="OPEN HOME.CELL"/>`)}</div>
      <div style="margin-top:16px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:16px">${toggleHtml(ed.visible, "Visible on the public website", "visible")}</div>`;
    m.footEl.innerHTML = `<div style="display:flex;justify-content:space-between;gap:8px"><span class="err">${escapeHtml(err)}</span><div style="display:flex;gap:8px"><button class="btn btn--secondary btn--sm" data-close>Cancel</button><button class="btn btn--primary btn--sm" data-save>${icon("check", 14)} Save</button></div></div>`;
    m.footEl.style.display = "";
    m.bodyEl.querySelectorAll("[data-bind]").forEach((el) => (el.oninput = () => { ed[el.getAttribute("data-bind")] = el.value; }));
    m.bodyEl.querySelectorAll(".toggle[data-path='visible']").forEach((t) => (t.onclick = () => { ed.visible = !ed.visible; t.setAttribute("aria-pressed", ed.visible); }));
    m.footEl.querySelector("[data-close]").onclick = () => m.close();
    m.footEl.querySelector("[data-save]").onclick = () => { if (!ed.name.trim()) { err = "Platform name is required."; paint(); return; } if (!ed.url.trim()) { err = "URL is required."; paint(); return; } err = ""; store.savePlatform(ed); toast((ed.name || "Platform") + " saved"); m.close(); onDone && onDone(); };
  }
  paint();
}

/* ============================================================ CONTENT */
function contentPanel(c) {
  tabsPanel(c, [
    { label: "Website Content", icon: "file", mount: websiteTab },
    { label: "Contact Details", icon: "mail", mount: contactTab },
  ]);
}
function websiteTab(host) {
  const wc = clone(getData().content);
  let dirty = false;
  const SUB = ["Hero", "About", "Problem", "Process", "Challenges", "Defence", "Footer & CTA"];
  let active = 0;
  function head() {
    return `<div class="panel-head"><div><h1 style="font-size:20px">Website Content</h1><p>Every headline, paragraph and framework step on the public site is editable here.</p></div><button class="btn btn--primary btn--sm" id="saveContent" ${dirty ? "" : "disabled"}>${icon("check", 14)} Save changes</button></div>
    <div class="tabs" id="subTabs">${SUB.map((s, i) => `<button class="tab ${i === active ? "active" : ""}" data-s="${i}">${s}</button>`).join("")}</div>`;
  }
  function paint() {
    host.innerHTML = head() + `<div class="acard" style="margin-top:8px"><div class="acard__body" id="subBody"></div></div>`;
    host.querySelectorAll("#subTabs [data-s]").forEach((b) => (b.onclick = () => { active = +b.dataset.s; paint(); }));
    host.querySelector("#saveContent").onclick = () => { store.saveContent(wc); dirty = false; toast("Website content updated"); paint(); };
    const body = host.querySelector("#subBody");
    const markDirty = () => { dirty = true; const s = host.querySelector("#saveContent"); if (s) s.disabled = false; };
    body.innerHTML = subBody(active);
    bindPaths(body, wc, markDirty);
    bindSubLists(body, wc, markDirty);
  }
  function subBody(i) {
    if (i === 0) return `${field("Small label", `<input class="input" data-path="hero.label" value="${escapeHtml(wc.hero.label)}"/>`)}<div style="margin-top:16px">${field("Main heading", `<textarea class="input" data-path="hero.heading" rows="2">${escapeHtml(wc.hero.heading)}</textarea>`)}</div><div style="margin-top:16px">${field("Supporting text", `<textarea class="input" data-path="hero.supporting" rows="3">${escapeHtml(wc.hero.supporting)}</textarea>`)}</div><div class="field-grid field-grid--2" style="margin-top:16px">${field("Primary CTA label", `<input class="input" data-path="hero.cta1" value="${escapeHtml(wc.hero.cta1)}"/>`)}${field("Secondary CTA label", `<input class="input" data-path="hero.cta2" value="${escapeHtml(wc.hero.cta2)}"/>`)}</div>`;
    if (i === 1) return `${field("Heading", `<input class="input" data-path="about.heading" value="${escapeHtml(wc.about.heading)}"/>`)}<div style="margin-top:16px">${field("Introduction", `<textarea class="input" data-path="about.intro" rows="4">${escapeHtml(wc.about.intro)}</textarea>`)}</div><div style="margin-top:16px">${field("Development philosophy", `<textarea class="input" data-path="about.philosophy" rows="4">${escapeHtml(wc.about.philosophy)}</textarea>`)}</div><div style="margin-top:16px">${field("Process bullets", `<div id="leBullets"></div>`)}</div><div style="margin-top:24px"><div class="field__label" style="margin-bottom:10px">Skills</div><div id="repSkills"></div></div>`;
    if (i === 2) return `${field("Heading", `<input class="input" data-path="problem.heading" value="${escapeHtml(wc.problem.heading)}"/>`)}<div style="margin-top:16px">${field("Body", `<textarea class="input" data-path="problem.body" rows="4">${escapeHtml(wc.problem.body)}</textarea>`)}</div><div style="margin-top:16px">${field("Sequence steps", `<div id="leChain"></div>`, "Rendered as the PROBLEM → PEOPLE → … flow.")}</div>`;
    if (i === 3) return `<div id="repProcess"></div>`;
    if (i === 4) return `<div id="repChallenges"></div>`;
    if (i === 5) return `${field("Section heading", `<input class="input" data-path="defence.heading" value="${escapeHtml(wc.defence.heading)}"/>`)}<div style="margin-top:20px"><div class="field__label" style="margin-bottom:10px">Defence questions</div><div id="repQuestions"></div></div><div style="margin-top:20px">${field("Closing chain", `<div id="leDChain"></div>`)}</div>`;
    return `<div class="field-grid field-grid--2">${field("Final CTA heading", `<textarea class="input" data-path="finalCta.heading" rows="2">${escapeHtml(wc.finalCta.heading)}</textarea>`)}${field("Final CTA text", `<textarea class="input" data-path="finalCta.text" rows="2">${escapeHtml(wc.finalCta.text)}</textarea>`)}</div><div style="margin-top:16px">${field("Footer description", `<textarea class="input" data-path="footer.description" rows="3">${escapeHtml(wc.footer.description)}</textarea>`)}</div><div style="margin-top:16px">${field("Footer tagline / note", `<input class="input" data-path="footer.note" value="${escapeHtml(wc.footer.note)}"/>`)}</div>`;
  }
  function bindSubLists(body, wc, dirty) {
    const b = body.querySelector("#leBullets"); if (b) mountListEditor(b, wc.about.bullets, (v) => { wc.about.bullets = v; dirty(); });
    const c = body.querySelector("#leChain"); if (c) mountListEditor(c, wc.problem.chain, (v) => { wc.problem.chain = v; dirty(); });
    const dc = body.querySelector("#leDChain"); if (dc) mountListEditor(dc, wc.defence.chain, (v) => { wc.defence.chain = v; dirty(); });
    const sk = body.querySelector("#repSkills"); if (sk) repeater(sk, wc.about.skills, [{ key: "name", label: "Technology", placeholder: "HTML" }, { key: "note", label: "How you use it" }], dirty, "Add skill");
    const pr = body.querySelector("#repProcess"); if (pr) repeater(pr, wc.process, [{ key: "no", label: "No." }, { key: "title", label: "Title" }, { key: "summary", label: "Summary" }, { key: "detail", label: "Detail", multiline: true }], dirty, "Add step");
    const ch = body.querySelector("#repChallenges"); if (ch) repeater(ch, wc.challenges, [{ key: "title", label: "Title" }, { key: "challenge", label: "Challenge", multiline: true }, { key: "approach", label: "Approach", multiline: true }, { key: "result", label: "Result", multiline: true }], dirty, "Add challenge");
    const qs = body.querySelector("#repQuestions"); if (qs) repeater(qs, wc.defence.questions, [{ key: "no", label: "No." }, { key: "question", label: "Question" }, { key: "answer", label: "Answer", multiline: true }], dirty, "Add question");
  }
  paint();
}
function contactTab(host) {
  const ct = clone(getData().contact);
  let dirty = false;
  const F = [["email", "Email", "you@example.com"], ["phone", "Phone number", "+000 000 0000"], ["whatsapp", "WhatsApp number", "+000 000 0000"], ["telegram", "Telegram", "t.me/username"], ["instagram", "Instagram", "instagram.com/username"], ["tiktok", "TikTok", "tiktok.com/@username"], ["github", "GitHub", "github.com/username"], ["youtube", "YouTube", "youtube.com/@channel"]];
  function paint() {
    host.innerHTML = `
      <div class="panel-head"><div><h1 style="font-size:20px">Contact Details</h1><p>Stored once, rendered everywhere. Empty fields are hidden automatically.</p></div><button class="btn btn--primary btn--sm" id="saveContact" ${dirty ? "" : "disabled"}>${icon("check", 14)} Save changes</button></div>
      <div class="acard"><div class="acard__head"><h2>Channels</h2><p>Leave a field blank to hide it from the public website.</p></div><div class="acard__body"><div class="field-grid field-grid--2">${F.map((f) => field(f[1], `<input class="input" data-path="${f[0]}" value="${escapeHtml(ct[f[0]] || "")}" placeholder="${escapeHtml(f[2])}/>`)).join("")}</div></div></div>
      <div class="acard" style="margin-top:20px"><div class="acard__head"><h2>Presentation</h2><p>Location and the call-to-action text shown above the contact grid.</p></div><div class="acard__body">${field("Location / service area", `<input class="input" data-path="location" value="${escapeHtml(ct.location || "")}"/>`)}<div style="margin-top:16px">${field("Contact CTA", `<textarea class="input" data-path="cta" rows="3">${escapeHtml(ct.cta || "")}</textarea>`)}</div></div></div>
      <div class="acard" style="margin-top:20px"><div class="acard__head"><h2>Other platforms</h2><p>Any additional channel — rendered in the contact grid and footer.</p></div><div class="acard__body"><div id="repExtra"></div></div></div>`;
    bindPaths(host, ct, () => { dirty = true; host.querySelector("#saveContact").disabled = false; });
    repeater(host.querySelector("#repExtra"), ct.extra, [{ key: "label", label: "Label" }, { key: "value", label: "Display value" }, { key: "url", label: "URL" }], () => { dirty = true; host.querySelector("#saveContact").disabled = false; }, "Add channel");
    host.querySelector("#saveContact").onclick = () => { store.saveContact(ct); dirty = false; toast("Contact details updated"); paint(); };
  }
  paint();
}

/* ============================================================ MESSAGES */
function messagesPanel(c) {
  function paint() {
    const msgs = store.getMessages();
    if (!msgs.length) {
      c.innerHTML = `<div class="panel-head"><div><h1>Messages</h1><p>Direct chat from the public website will appear here.</p></div></div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:var(--r-lg);padding:64px 24px;text-align:center">
          <div style="margin-bottom:16px;display:grid;place-items:center;height:48px;width:48px;border-radius:12px;border:1px solid var(--line);background:var(--ink-850);color:var(--mute)">${icon("mail", 20)}</div>
          <h4 class="font-display" style="font-size:16px;font-weight:600;color:var(--paper);margin:0">No messages yet</h4>
          <p style="margin:6px 0 0;font-size:14px;color:var(--mute);max-width:340px">When a visitor sends a message from the chat widget on the public site, the conversation shows up here and you can reply directly.</p>
        </div>`;
      return;
    }
    c.innerHTML = `<div class="panel-head"><div><h1>Messages</h1><p>Direct chat from the public website. Replies are delivered back to the visitor's chat widget.</p></div><button class="btn btn--secondary btn--sm" id="clrMsg">${icon("trash", 14)} Clear thread</button></div>
      <div class="card msg-thread scroll-thin" id="msgThread"></div>
      <div class="msg-reply"><textarea class="input" id="replyText" rows="2" placeholder="Type a reply to the visitor…"></textarea><button class="btn btn--primary btn--sm" id="replySend">${icon("arrow", 14)} Send reply</button></div>`;
    const thread = document.getElementById("msgThread");
    thread.innerHTML = msgs.map((m) => m.role === "visitor"
      ? `<div class="mbubble mbubble--them"><div class="mbubble__head"><b>${escapeHtml(m.name)}</b><span>${timeAgo(m.at)}</span></div><div class="mbubble__text">${escapeHtml(m.text)}</div></div>`
      : `<div class="mbubble mbubble--me"><div class="mbubble__head"><b>GEE (you)</b><span>${timeAgo(m.at)}</span></div><div class="mbubble__text">${escapeHtml(m.text)}</div></div>`).join("");
    thread.scrollTop = thread.scrollHeight;
    const rt = document.getElementById("replyText");
    const sendReply = () => { const v = rt.value.trim(); if (!v) return; store.replyMessage(v); toast("Reply sent"); paint(); };
    document.getElementById("replySend").onclick = sendReply;
    rt.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } });
    document.getElementById("clrMsg").onclick = async () => {
      const ok = await confirmDialog({ title: "Clear all messages", message: "This removes the entire conversation. This cannot be undone.", confirmLabel: "Clear" });
      if (ok) { store.clearMessages(); toast("Conversation cleared", "info"); paint(); }
    };
  }
  paint();
  store.markAdminRead();
  buildNav();
}

/* ============================================================ SETTINGS */
function settingsPanel(c) {
  const cred = getCredential();
  const email = getSession()?.email || "";
  const d = getData();
  let msg = "";
  c.innerHTML = `
    <div class="panel-head"><div><h1>Settings & Security</h1><p>Administrator credentials and content backup.</p></div></div>
    <div class="grid-2">
      <div class="acard"><div class="acard__head"><h2>Administrator account</h2><p>The only account able to reach this dashboard.</p></div><div class="acard__body">
        <div class="field-grid field-grid--2">
          ${infoRow("Email", email)}${infoRow("Hash algorithm", "PBKDF2-SHA256")}${infoRow("Iterations", String(cred?.iterations || 0))}${infoRow("Last sign-in", cred?.lastLogin ? timeAgo(cred.lastLogin) : "—")}
        </div>
        <form id="pwForm" style="margin-top:20px;border-top:1px solid var(--line);padding-top:20px;display:flex;flex-direction:column;gap:16px">
          ${field("Current password", `<input class="input" type="password" id="pwCur" required autocomplete="current-password"/>`)}
          <div class="field-grid field-grid--2">${field("New password", `<input class="input" type="password" id="pwNew" required autocomplete="new-password"/>`)}${field("Confirm new password", `<input class="input" type="password" id="pwNew2" required autocomplete="new-password"/>`)}</div>
          <div class="err" id="pwMsg">${escapeHtml(msg)}</div>
          <button class="btn btn--primary btn--sm" type="submit" id="pwBtn">${icon("shield", 14)} Update password</button>
        </form>
      </div></div>
      <div class="stack">
        <div class="acard"><div class="acard__head"><h2>Content backup</h2><p>Export the whole content set as JSON, or restore a previous export.</p></div><div class="acard__body">
          <div class="row-actions"><button class="btn btn--secondary btn--sm" id="expBtn">${icon("file", 14)} Export JSON</button><button class="btn btn--secondary btn--sm" id="impBtn">${icon("image", 14)} Import JSON</button><input type="file" id="impFile" accept="application/json" class="hidden"/></div>
          <p class="font-mono" style="margin:14px 0 0;font-size:11px;color:var(--mute-2)">${d.projects.length} projects · ${d.categories.length} categories · ${d.platforms.length} platforms</p>
        </div></div>
        <div class="acard"><div class="acard__head"><h2>Danger zone</h2><p>Restore the original GEE content set. Your administrator account is not affected.</p></div><div class="acard__body"><button class="btn btn--danger btn--sm" id="resetBtn">${icon("trash", 14)} Reset all content</button></div></div>
      </div>
    </div>`;
  document.getElementById("pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cur = document.getElementById("pwCur").value;
    const next = document.getElementById("pwNew").value;
    const next2 = document.getElementById("pwNew2").value;
    const msgEl = document.getElementById("pwMsg");
    if (next !== next2) { msgEl.textContent = "New passwords do not match."; return; }
    const btn = document.getElementById("pwBtn");
    btn.disabled = true; btn.innerHTML = spinner(14) + " Updating…";
    const res = await changePassword(cur, next);
    btn.disabled = false; btn.innerHTML = icon("shield", 14) + " Update password";
    if (!res.ok) { msgEl.textContent = res.error || "Could not change password."; return; }
    msgEl.textContent = "";
    document.getElementById("pwForm").reset();
    toast("Password updated");
  });
  document.getElementById("expBtn").onclick = () => {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gee-content-" + new Date().toISOString().slice(0, 10) + ".json"; a.click();
    URL.revokeObjectURL(url);
    toast("Content exported");
  };
  document.getElementById("impBtn").onclick = () => document.getElementById("impFile").click();
  document.getElementById("impFile").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const res = store.importJson(await f.text());
    toast(res.ok ? "Content imported" : res.error || "Import failed", res.ok ? "success" : "error");
    e.target.value = "";
    if (res.ok) renderPanel("settings");
  });
  document.getElementById("resetBtn").onclick = async () => {
    const ok = await confirmDialog({ title: "Reset all content", message: "Every project, category, platform and content edit you have made will be replaced with the original GEE content set. This cannot be undone.", confirmLabel: "Reset content" });
    if (ok) { store.resetAll(); toast("Content reset to defaults", "info"); renderPanel("settings"); }
  };
}
function infoRow(label, value) {
  return `<div style="border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:12px 16px"><div class="mono-label">${escapeHtml(label)}</div><div class="truncate" style="margin-top:4px;font-size:13.5px;color:var(--paper)">${escapeHtml(value)}</div></div>`;
}
