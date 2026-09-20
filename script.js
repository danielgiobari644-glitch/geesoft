/* ============================================================
   Giobari Daniel — Portfolio · Public application
   Dynamically renders the portfolio from Firestore.
   Falls back to clearly-marked sample content on first run
   (before the site has been configured from the dashboard).
   ============================================================ */

import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
  DEFAULT_SETTINGS, mergeSettings, VISUAL_CATEGORIES,
  SAMPLE_PROJECTS, SAMPLE_SERVICES, SAMPLE_SKILLS, SAMPLE_TESTIMONIALS
} from "./sample-data.js";

/* ---------------- Utilities ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const esc = (v) => String(v == null ? "" : v)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const splitLines = (v) => String(v || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const splitList = (v) => Array.isArray(v) ? v.map(s => String(s).trim()).filter(Boolean)
  : String(v || "").split(",").map(s => s.trim()).filter(Boolean);

function withTimeout(promise, ms, onTimeout) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(onTimeout), ms))
  ]);
}

function sortByOrder(list) {
  return [...list].sort((a, b) => {
    const oa = Number.isFinite(+a.order) ? +a.order : 9999;
    const ob = Number.isFinite(+b.order) ? +b.order : 9999;
    return oa - ob || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

const isVisual = (p) => VISUAL_CATEGORIES.includes(p.category);

/* ---------------- State ---------------- */
const state = {
  settings: mergeSettings(null),
  settingsExists: false,
  configured: false,
  digital: [],
  visual: [],
  filter: "All",
  bySlug: new Map(),
  loaded: false
};

/* ---------------- Firestore loading ---------------- */
async function loadCollection(name) {
  const fail = { ok: false, docs: [] };
  try {
    const snap = await withTimeout(getDocs(collection(db, name)), 9000, null);
    if (!snap) return fail;
    return { ok: true, docs: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (err) {
    console.warn(`[portfolio] Could not load "${name}":`, err && err.code ? err.code : err);
    return fail;
  }
}

async function loadSettings() {
  const fail = { ok: false, exists: false, data: null };
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "general")), 9000, null);
    if (!snap) return fail;
    return { ok: true, exists: snap.exists(), data: snap.data() || {} };
  } catch (err) {
    console.warn("[portfolio] Could not load settings:", err && err.code ? err.code : err);
    return fail;
  }
}

async function loadData() {
  const [settingsRes, projectsRes, servicesRes, skillsRes, testimonialsRes] = await Promise.all([
    loadSettings(),
    loadCollection("projects"),
    loadCollection("services"),
    loadCollection("skills"),
    loadCollection("testimonials")
  ]);

  state.settingsExists = settingsRes.exists;
  if (settingsRes.exists) state.settings = mergeSettings(settingsRes.data);

  const projects = projectsRes.ok ? sortByOrder(projectsRes.docs).filter(p => p.published !== false) : null;
  const services = servicesRes.ok ? sortByOrder(servicesRes.docs).filter(s => s.published !== false) : null;
  const skills = skillsRes.ok ? sortByOrder(skillsRes.docs).filter(s => s.published !== false) : null;
  const testimonials = testimonialsRes.ok ? sortByOrder(testimonialsRes.docs).filter(t => t.published !== false) : null;

  /* "Configured" = the dashboard has been used at least once (settings saved
     or content created). Until then, show the clearly-marked sample site. */
  const hasAnyContent = [
    projectsRes.ok && projects.length > 0,
    servicesRes.ok && services.length > 0,
    skillsRes.ok && skills.length > 0
  ].some(Boolean);
  state.configured = state.settingsExists || hasAnyContent;

  if (!state.configured) {
    state.digital = SAMPLE_PROJECTS.filter(p => !isVisual(p));
    state.visual = SAMPLE_PROJECTS.filter(p => isVisual(p));
    state.services = SAMPLE_SERVICES;
    state.skills = SAMPLE_SKILLS;
    state.testimonials = SAMPLE_TESTIMONIALS;
    state.settings = mergeSettings(null);
  } else {
    state.digital = projects ? projects.filter(p => !isVisual(p)) : SAMPLE_PROJECTS.filter(p => !isVisual(p));
    state.visual = projects ? projects.filter(p => isVisual(p)) : SAMPLE_PROJECTS.filter(p => isVisual(p));
    state.services = services || SAMPLE_SERVICES;
    state.skills = skills || SAMPLE_SKILLS;
    state.testimonials = testimonials || [];
  }

  state.bySlug = new Map();
  [...state.digital, ...state.visual].forEach(p => {
    const slug = p.slug || p.id;
    state.bySlug.set(slug, p);
  });
  state.loaded = true;
}

/* ---------------- Settings binding ---------------- */
function applySettings() {
  const s = state.settings;
  $$("[data-bind]").forEach(el => {
    const key = el.getAttribute("data-bind");
    if (s[key] != null && s[key] !== "") el.textContent = s[key];
    else if (s[key] === "") el.textContent = "";
  });

  /* SEO */
  if (s.seoTitle) { document.title = s.seoTitle; $("meta[property='og:title']").setAttribute("content", s.seoTitle); $("meta[name='twitter:title']").setAttribute("content", s.seoTitle); }
  if (s.seoDescription) {
    $("meta[name='description']").setAttribute("content", s.seoDescription);
    $("meta[property='og:description']").setAttribute("content", s.seoDescription);
    $("meta[name='twitter:description']").setAttribute("content", s.seoDescription);
  }
  if (s.seoImage) {
    const og = document.createElement("meta"); og.setAttribute("property", "og:image"); og.setAttribute("content", s.seoImage);
    const tw = document.createElement("meta"); tw.setAttribute("name", "twitter:image"); tw.setAttribute("content", s.seoImage);
    document.head.append(og, tw);
  }

  /* Theme */
  const mode = s.theme && s.theme.mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem("gd-theme", mode); } catch (e) { /* private mode */ }
  const accent = (s.theme && s.theme.accent) || "#E9A23B";
  document.documentElement.style.setProperty("--accent", accent);
  $("#meta-theme") && $("#meta-theme").setAttribute("content", mode === "light" ? "#F6F5F1" : "#0A0B0E");

  /* Logo */
  const brands = $$(".brand");
  brands.forEach(b => {
    const img = b.querySelector("img");
    if (s.logoUrl) {
      if (img) img.src = s.logoUrl;
      else {
        const text = b.querySelector(".brand-text");
        const el = document.createElement("img");
        el.src = s.logoUrl; el.alt = s.name || "Logo";
        if (text) b.replaceChild(el, text); else b.appendChild(el);
      }
    } else if (img) img.remove();
  });

  /* Favicon */
  if (s.faviconUrl) { const f = $("#favicon"); if (f) f.href = s.faviconUrl; }

  /* Profile image */
  const portrait = $("#about-portrait");
  if (s.profileImage) {
    portrait.innerHTML = `<img src="${esc(s.profileImage)}" alt="Portrait of ${esc(s.name)}" loading="lazy">`;
  }

  /* Availability chip */
  const avail = $("#hero-avail");
  if (s.availability) { avail.hidden = false; $("[data-bind='availability']").textContent = s.availability; }
  else avail.hidden = true;

  /* About */
  const lead = $("#about-lead");
  lead.innerHTML = esc(s.aboutHeading || "I work at the intersection of technology, design and creativity.")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  const copy = $("#about-copy");
  copy.innerHTML = String(s.aboutText || "").split(/\n{2,}/)
    .map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

  /* Contact info rows */
  renderContactRows(s);
  renderSocials(s);
}

function renderContactRows(s) {
  const rows = [];
  if (s.email) rows.push({ icon: "i-mail", label: "Email", value: s.email, href: `mailto:${s.email}` });
  if (s.phone) rows.push({ icon: "i-phone", label: "Phone", value: s.phone, href: `tel:${String(s.phone).replace(/[^+\d]/g, "")}` });
  if (s.whatsapp) {
    const digits = String(s.whatsapp).replace(/[^\d]/g, "");
    rows.push({
      icon: "i-whatsapp", label: "WhatsApp", value: s.whatsapp,
      href: /^https?:/i.test(s.whatsapp) ? s.whatsapp : `https://wa.me/${digits}`
    });
  }
  $("#contact-rows").innerHTML = rows.map(r => `
    <a class="c-row" href="${esc(r.href)}" target="_blank" rel="noopener">
      <svg class="icon"><use href="#${r.icon}"/></svg>
      <span><small>${esc(r.label)}</small><b>${esc(r.value)}</b></span>
    </a>`).join("");
}

const SOCIAL_META = [
  ["instagram", "Instagram", "i-instagram"], ["tiktok", "TikTok", "i-tiktok"],
  ["telegram", "Telegram", "i-send"], ["youtube", "YouTube", "i-youtube"],
  ["github", "GitHub", "i-github"], ["linkedin", "LinkedIn", "i-linkedin"],
  ["whatsapp", "WhatsApp", "i-whatsapp"], ["x", "X / Twitter", "i-x-social"]
];

function socialEntries(s) {
  const out = [];
  SOCIAL_META.forEach(([key, label, icon]) => {
    const v = s.socials && s.socials[key];
    if (v) {
      const href = key === "whatsapp" && !/^https?:/i.test(v) ? `https://wa.me/${String(v).replace(/[^\d]/g, "")}` : v;
      out.push({ label, icon, href });
    }
  });
  (s.otherLinks || []).forEach(l => { if (l && l.url) out.push({ label: l.label || "Link", icon: "i-link", href: l.url }); });
  return out;
}

function renderSocials(s) {
  const entries = socialEntries(s);
  const html = entries.map(e => `
    <a class="soc" href="${esc(e.href)}" target="_blank" rel="noopener" aria-label="${esc(e.label)}" title="${esc(e.label)}">
      <svg class="icon"><use href="#${e.icon}"/></svg>
    </a>`).join("");
  $("#footer-socials").innerHTML = html;
  $("#contact-socials").innerHTML = html;
  $("#about-socials").innerHTML = entries.map(e => `
    <a class="soc soc-label" href="${esc(e.href)}" target="_blank" rel="noopener">
      <svg class="icon"><use href="#${e.icon}"/></svg>${esc(e.label)}
    </a>`).join("") || `<span style="color:var(--faint);font-size:13.5px">Connect with me soon.</span>`;
}

/* ---------------- Marquee ---------------- */
function renderMarquee() {
  const items = ["Software Development", "Web Development", "Web Applications", "UI/UX",
    "Graphic Design", "Branding", "Church Media", "Digital Solutions"];
  const group = items.map(t => `<span>${esc(t)}</span><svg class="icon"><use href="#i-asterisk"/></svg>`).join("");
  $("#mq-track").innerHTML = `<div class="mq-group">${group}</div><div class="mq-group" aria-hidden="true">${group}</div>`;
}
/* ---------------- Selected work (digital products) ---------------- */
function projectCard(p, featured = false) {
  const slug = esc(p.slug || p.id);
  const tech = (p.technologies || []).map(esc).join(" · ");
  const year = p.year ? `<span class="wcard-year">${esc(p.year)}</span>` : "";
  const sampleChip = p.sample ? `<span class="chip chip-sample">Sample</span>` : "";
  const media = `
    <span class="wcard-media">
      <img src="${esc(p.thumbnail || "")}" alt="${esc(p.title)} — project preview" loading="lazy" decoding="async">
      <span class="wcard-chips"><span class="chip">${esc(p.category || "Project")}</span>${sampleChip}</span>
      <span class="wcard-arrow"><svg class="icon"><use href="#i-arrow-up-right"/></svg></span>
    </span>`;
  const body = `
    <div class="wcard-meta"><span class="chip"><i></i>${esc(p.category || "Project")}</span>${year}</div>
    <h3 class="wcard-title">${esc(p.title)}</h3>
    <p class="wcard-desc">${esc(p.description || "")}</p>
    ${tech ? `<p class="wcard-tech">${tech}</p>` : ""}
    <span class="wcard-case">View case study <svg class="icon"><use href="#i-arrow-up-right"/></svg></span>`;

  return featured
    ? `<article class="wcard wcard-featured"><a class="wcard-media" href="#/project/${slug}" aria-label="Open case study: ${esc(p.title)}">${media}</a><div>${body}</div></article>`
    : `<article class="wcard"><a class="wcard-media" href="#/project/${slug}" aria-label="Open case study: ${esc(p.title)}">${media}</a>${body}</article>`;
}

function renderFilters() {
  const cats = [...new Set(state.digital.map(p => p.category).filter(Boolean))];
  const all = ["All", ...cats];
  $("#work-filters").innerHTML = all.map(c =>
    `<button class="fbtn" type="button" data-filter="${esc(c)}" aria-pressed="${state.filter === c}">${esc(c)}</button>`).join("");
}

$("#work-filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn || btn.dataset.filter === state.filter) return;
  state.filter = btn.dataset.filter;
  renderFilters();
  renderWork();
});

function renderWork() {
  const grid = $("#work-grid");
  const list = state.filter === "All" ? state.digital : state.digital.filter(p => p.category === state.filter);

  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>New work is on the way.</b>I am preparing fresh case studies right now — check back soon, or reach out directly.</div>`;
    return;
  }

  let html = "";
  if (state.filter === "All") {
    const featured = list.find(p => p.featured);
    const rest = list.filter(p => p !== featured);
    html = (featured ? projectCard(featured, true) : "") + rest.map(p => projectCard(p)).join("");
  } else {
    html = list.map(p => projectCard(p)).join("");
  }
  grid.innerHTML = html;
  observeReveals(grid);
}

/* ---------------- Visual design gallery ---------------- */
function renderDesign() {
  const grid = $("#design-grid");
  const section = $("#design");
  if (!state.visual.length) { section.hidden = true; return; }
  section.hidden = false;
  grid.innerHTML = state.visual.map(p => {
    const slug = esc(p.slug || p.id);
    const sampleChip = p.sample ? `<span class="chip chip-sample">Sample</span>` : "";
    return `
    <figure class="dcard rv">
      <a class="dcard-media" href="#/project/${slug}" aria-label="Open case study: ${esc(p.title)}">
        <img src="${esc(p.thumbnail || "")}" alt="${esc(p.title)} — design preview" loading="lazy" decoding="async">
      </a>
      <figcaption class="dcard-cap">
        <h3>${esc(p.title)} ${sampleChip}</h3>
        <span>${esc(p.category || "")}${p.year ? " · " + esc(p.year) : ""}</span>
      </figcaption>
    </figure>`;
  }).join("");
  observeReveals(grid);
}

/* ---------------- Services ---------------- */
function renderServices() {
  const list = $("#services-list");
  const section = $("#services");
  if (!state.services.length) { section.hidden = true; return; }
  section.hidden = false;
  list.innerHTML = state.services.map((sv, i) => `
    <li class="srow rv" style="--d:${i * 60}ms">
      <span class="srow-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="srow-icon"><svg class="icon"><use href="#i-${esc(sv.icon || "spark")}"/></svg></span>
      <div class="srow-body">
        <h3>${esc(sv.title)}</h3>
        <p>${esc(sv.description || "")}</p>
      </div>
    </li>`).join("");
  observeReveals(list);
}

/* ---------------- Skills ---------------- */
function renderSkills() {
  const wrap = $("#skill-groups");
  const section = $("#skills");
  if (!state.skills.length) { section.hidden = true; return; }
  section.hidden = false;
  const groups = new Map();
  state.skills.forEach(sk => {
    const cat = sk.category || "Skills";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(sk);
  });
  wrap.innerHTML = [...groups.entries()].map(([cat, items], gi) => `
    <div class="skill-group rv" style="--d:${gi * 80}ms">
      <h4>${esc(cat)}</h4>
      <div class="skill-chips">
        ${items.map(sk => `<span class="skill">${sk.iconUrl ? `<img src="${esc(sk.iconUrl)}" alt="">` : "<i></i>"}${esc(sk.name)}</span>`).join("")}
      </div>
    </div>`).join("");
  observeReveals(wrap);
}

/* ---------------- Testimonials ---------------- */
function renderTestimonials() {
  const section = $("#testimonials");
  const grid = $("#testimonial-grid");
  if (!state.testimonials.length) { section.hidden = true; return; }
  section.hidden = false;
  grid.innerHTML = state.testimonials.map(t => {
    const initials = String(t.name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return `
    <figure class="tcard rv">
      <blockquote>${esc(t.text || "")}</blockquote>
      <figcaption>
        ${t.avatar ? `<img src="${esc(t.avatar)}" alt="Portrait of ${esc(t.name)}" loading="lazy">` : `<span class="t-ava">${esc(initials)}</span>`}
        <div><b>${esc(t.name || "")}</b><span>${esc(t.role || "")}</span></div>
      </figcaption>
    </figure>`;
  }).join("");
  observeReveals(grid);
}

/* ---------------- Project modal (case study) ---------------- */
const modal = $("#project-modal");
let lastFocus = null;
let modalOpen = false;

function pmSection(title, text) {
  if (!text) return "";
  return `<div class="pm-sec"><h4>${esc(title)}</h4><p>${esc(text).replace(/\n/g, "<br>")}</p></div>`;
}

function openProject(slug) {
  const p = state.bySlug.get(slug);
  if (!p) return false;
  lastFocus = document.activeElement;
  const tech = (p.technologies || []).map(esc).join(", ");
  const features = splitLines(p.features);
  const gallery = (p.gallery || []).filter(Boolean);
  const sampleChip = p.sample ? `<span class="chip chip-sample">Sample project</span>` : "";

  const links = [];
  if (p.liveUrl) links.push(`<a class="btn btn-primary btn-sm" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">Visit live project <svg class="icon"><use href="#i-external"/></svg></a>`);
  if (p.githubUrl) links.push(`<a class="btn btn-ghost btn-sm" href="${esc(p.githubUrl)}" target="_blank" rel="noopener">View on GitHub <svg class="icon"><use href="#i-github"/></svg></a>`);

  $("#pm-scroll").innerHTML = `
    <div class="pm-chips">
      <span class="chip"><i></i>${esc(p.category || "Project")}</span>
      ${p.year ? `<span class="chip">${esc(p.year)}</span>` : ""}
      ${p.client ? `<span class="chip">${esc(p.client)}</span>` : ""}
      ${sampleChip}
    </div>
    <h2 class="pm-title" id="pm-title">${esc(p.title)}</h2>
    <p class="pm-desc">${esc(p.description || "")}</p>
    <div class="pm-cover"><img src="${esc(p.thumbnail || "")}" alt="${esc(p.title)} — cover image"></div>
    <div class="pm-body">
      <aside class="pm-aside">
        ${p.year ? `<div class="pm-fact"><small>Year</small><p>${esc(p.year)}</p></div>` : ""}
        ${p.client ? `<div class="pm-fact"><small>Client / Organization</small><p>${esc(p.client)}</p></div>` : ""}
        ${tech ? `<div class="pm-fact"><small>Technologies</small><p>${tech}</p></div>` : ""}
        ${links.length ? `<div class="pm-links">${links.join("")}</div>` : ""}
      </aside>
      <div class="pm-main">
        ${pmSection("Overview", p.overview)}
        ${pmSection("The Problem", p.problem)}
        ${pmSection("The Solution", p.solution)}
        ${pmSection("What I Built", p.whatIBuilt)}
        ${features.length ? `<div class="pm-sec"><h4>Features</h4><ul class="pm-feats">${features.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
        ${pmSection("Design Work", p.designNotes)}
        ${pmSection("Results & Outcome", p.results)}
        ${gallery.length ? `<div class="pm-sec"><h4>Gallery</h4><div class="pm-gallery">${gallery.map((g, i) =>
          `<button type="button" data-lightbox="${esc(g)}" aria-label="Open image ${i + 1}"><img src="${esc(g)}" alt="${esc(p.title)} — gallery image ${i + 1}" loading="lazy"></button>`).join("")}</div></div>` : ""}
      </div>
    </div>`;

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("open"));
  document.body.style.overflow = "hidden";
  modalOpen = true;
  $(".pm-close", modal).focus();
  return true;
}

function closeProject() {
  if (!modalOpen) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
  modalOpen = false;
  setTimeout(() => { modal.hidden = true; }, 220);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* focus trap inside modal */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!lightbox.hidden) { hideLightbox(); return; }
    if (modalOpen) closeProject();
  }
  if (e.key === "Tab" && modalOpen) trapFocus(e, modal);
  if (e.key === "Tab" && !lightbox.hidden) trapFocus(e, $("#lightbox"));
});

function trapFocus(e, container) {
  const focusables = $$("a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex='-1'])", container)
    .filter(el => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-pm-close]")) {
    history.replaceState(null, "", location.pathname + location.search);
    closeProject();
  }
});

/* ---------------- Lightbox ---------------- */
const lightbox = $("#lightbox");
function showLightbox(src, alt) {
  $("#lightbox-img").src = src;
  $("#lightbox-img").alt = alt || "";
  lightbox.hidden = false;
  $("#lightbox-close").focus();
}
function hideLightbox() { lightbox.hidden = true; $("#lightbox-img").src = ""; }
lightbox.addEventListener("click", (e) => { if (!e.target.closest("img")) hideLightbox(); });
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lightbox]");
  if (btn) showLightbox(btn.getAttribute("data-lightbox"));
});
/* ---------------- Hash routing for case studies ---------------- */
function handleHash() {
  const m = location.hash.match(/^#\/project\/([\w-]+)/);
  if (m) {
    const found = state.bySlug.size > 0 && openProject(m[1]);
    if (!found && state.loaded) history.replaceState(null, "", location.pathname + location.search);
  } else if (modalOpen) {
    closeProject();
  }
}
window.addEventListener("hashchange", handleHash);

/* ---------------- Toast ---------------- */
function toast(msg, type = "") {
  const wrap = $("#toast-wrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<svg class="icon"><use href="#${type === "bad" ? "i-x" : "i-check"}"/></svg><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 320); }, 4200);
}

/* ---------------- Contact form ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(form) {
  let ok = true;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const message = form.message.value.trim();

  const setErr = (key, bad) => {
    const field = $(`[data-field="${key}"]`, form);
    field.classList.toggle("invalid", bad);
    if (bad) ok = false;
  };
  setErr("name", name.length < 2);
  setErr("email", !EMAIL_RE.test(email));
  setErr("phone", phone.length > 40);
  setErr("message", message.length < 10);
  return ok;
}

function bindContactForm() {
  const form = $("#contact-form");
  const btn = $("#cf-submit");
  const btnLabel = btn.querySelector("span");

  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field) field.classList.remove("invalid");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) {
      toast("Please check the highlighted fields.", "bad");
      return;
    }
    /* Honeypot — silently accept without storing (bot trap). */
    if (form.company && form.company.value) {
      $("#form-success").hidden = false;
      form.hidden = true;
      return;
    }

    btn.disabled = true;
    btnLabel.textContent = "Sending…";
    btn.insertAdjacentHTML("afterbegin", `<span class="spinner" aria-hidden="true"></span>`);

    try {
      const result = await withTimeout(addDoc(collection(db, "messages"), {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
        read: false,
        createdAt: serverTimestamp()
      }), 15000, "timeout");
      if (result === "timeout") throw Object.assign(new Error("The network is too slow right now."), { code: "timeout" });

      form.reset();
      $("#form-success").hidden = false;
      form.hidden = true;
      toast("Message sent — thank you!", "good");
    } catch (err) {
      console.warn("[portfolio] Contact form error:", err);
      toast(err && err.code === "permission-denied"
        ? "Messaging is not active yet. Please reach me through the links instead."
        : "Something went wrong — please try again in a moment.", "bad");
    } finally {
      btn.disabled = false;
      btnLabel.textContent = "Send Message";
      const sp = btn.querySelector(".spinner"); if (sp) sp.remove();
    }
  });

  $("#form-again").addEventListener("click", () => {
    $("#form-success").hidden = true;
    form.hidden = false;
    form.name.focus();
  });
}

/* ---------------- Navigation & scroll behavior ---------------- */
function bindChrome() {
  const header = $("#site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  const mnav = $("#mnav");
  const burger = $("#burger");
  const setMenu = (open) => {
    mnav.classList.toggle("open", open);
    mnav.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(true));
  $("#mnav-close").addEventListener("click", () => setMenu(false));
  $$(".mnav-links a, .mnav-cta a", mnav).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mnav.classList.contains("open")) setMenu(false); });

  /* Active section highlighting */
  const links = $$(".nav a");
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === `#${en.target.id}`));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));

  $("#year").textContent = new Date().getFullYear();
}

/* ---------------- Scroll reveals ---------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

function observeReveals(root) {
  $$(".rv", root).forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${Math.min(i * 55, 350)}ms`);
    revealObserver.observe(el);
  });
}

/* ---------------- Boot ---------------- */
async function init() {
  renderMarquee();
  bindChrome();
  bindContactForm();
  observeReveals(document);

  await loadData();
  applySettings();
  renderFilters();
  renderWork();
  renderDesign();
  renderServices();
  renderSkills();
  renderTestimonials();
  observeReveals(document);
  handleHash();
}

init().catch(err => {
  console.error("[portfolio] Fatal init error:", err);
  toast("Something went wrong while loading the portfolio.", "bad");
});


