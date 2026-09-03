// GeeSoft — public site logic.
// Content is loaded live from Firestore, but the site renders and is fully
// usable BEFORE/WITHOUT Firebase: navigation, animation, modal and layout all
// work offline. Firebase is loaded dynamically so a blocked CDN or a project
// that has not been configured yet can never blank the page.
import { DEFAULTS, merge } from "./content.js";

document.documentElement.classList.add("js-ready");

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u = "") => {
  const s = String(u).trim();
  if (/^\s*(javascript|vbscript|data:(?!image\/))/i.test(s)) return "";
  return /^(https?:|mailto:|tel:|#|\/|\.\/|data:image\/|[\w-]+[\w./-]*\.(png|jpe?g|webp|svg|gif|avif)$)/i.test(s) ? s : "";
};

/* ---------------- state ---------------- */
const state = {
  settings: { ...DEFAULTS.settings },
  hero: { ...DEFAULTS.hero },
  intro: { ...DEFAULTS.intro },
  skillsMeta: { ...DEFAULTS.skillsMeta },
  projectsMeta: { ...DEFAULTS.projectsMeta },
  contact: { ...DEFAULTS.contact },
  skills: [],
  projects: []
};

/* ---------------- generic binding ---------------- */
function get(path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), state);
}
function applyBindings() {
  $$("[data-bind]").forEach(el => {
    const v = get(el.dataset.bind);
    if (v === undefined || v === null) return;
    if (el.tagName === "TITLE") document.title = v;
    else el.textContent = v;
  });
  $$("[data-meta]").forEach(el => {
    const v = get(el.dataset.meta);
    if (v) el.setAttribute("content", v);
  });
  $$("[data-src]").forEach(el => {
    const v = safeUrl(get(el.dataset.src));
    if (v) el.src = v;
  });
  // hide empty text nodes so nothing looks broken
  $$("[data-bind]").forEach(el => {
    if (el.closest(".sechead") || el.classList.contains("panel__text") || el.classList.contains("contact__desc")) {
      el.hidden = !el.textContent.trim();
    }
  });
}

/* ---------------- hero extras ---------------- */
function renderHero() {
  const caps = $("#heroCaps");
  const list = Array.isArray(state.hero.capabilities) ? state.hero.capabilities : [];
  caps.innerHTML = list.filter(Boolean).map(c => `<li>${esc(c)}</li>`).join("");
  caps.hidden = !list.length;

  const p = $("#heroPrimary"), s = $("#heroSecondary");
  p.href = safeUrl(state.hero.primaryCtaLink) || "#projects";
  p.hidden = !state.hero.primaryCtaText;
  s.href = safeUrl(state.hero.secondaryCtaLink) || "#contact";
  s.hidden = !state.hero.secondaryCtaText;
}

/* ---------------- introduction ---------------- */
function renderIntro() {
  const ul = $("#servicesList");
  const list = Array.isArray(state.intro.services) ? state.intro.services : [];
  ul.innerHTML = list.filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("");
  ul.hidden = !list.length;
  const cta = $("#introCta");
  cta.href = safeUrl(state.intro.ctaLink) || "#contact";
  cta.hidden = !state.intro.ctaText;
}

/* ---------------- skills ---------------- */
function renderSkills() {
  const wrap = $("#skillsList"), empty = $("#skillsEmpty");
  const items = state.skills;
  if (!items.length) { wrap.innerHTML = ""; wrap.hidden = true; empty.hidden = false; return; }
  wrap.hidden = false; empty.hidden = true;
  wrap.innerHTML = items.map(s => {
    const icon = safeUrl(s.icon || "");
    const iconEl = icon
      ? `<img class="skill__icon" src="${esc(icon)}" alt="" loading="lazy" width="42" height="42">`
      : `<span class="skill__icon" aria-hidden="true">${esc((s.iconText || s.name || "•").slice(0, 2))}</span>`;
    const lvl = Number(s.level);
    return `<article class="skill">
      <div class="skill__top">${iconEl}
        <div>
          ${s.category ? `<span class="skill__cat">${esc(s.category)}</span>` : ""}
          <div class="skill__name">${esc(s.name || "")}</div>
        </div>
      </div>
      ${s.description ? `<p class="skill__desc">${esc(s.description)}</p>` : ""}
      ${Number.isFinite(lvl) && lvl > 0 ? `<div class="skill__bar"><i data-lvl="${Math.min(100, lvl)}"></i></div>` : ""}
    </article>`;
  }).join("");
  requestAnimationFrame(() => $$(".skill__bar i", wrap).forEach(b => b.style.width = b.dataset.lvl + "%"));
}

/* ---------------- projects ---------------- */
const arrow = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>`;

function renderProjects() {
  const wrap = $("#projectsList"), empty = $("#projectsEmpty");
  const items = state.projects.filter(p => p.published !== false);
  empty.textContent = state.projectsMeta.emptyText || "";
  if (!items.length) { wrap.innerHTML = ""; wrap.hidden = true; empty.hidden = false; return; }
  wrap.hidden = false; empty.hidden = true;

  wrap.innerHTML = items.map((p, i) => {
    const thumb = safeUrl(p.thumbnail || "");
    const tech = (Array.isArray(p.technologies) ? p.technologies : String(p.technologies || "").split(","))
      .map(t => String(t).trim()).filter(Boolean);
    return `<button class="proj reveal" data-index="${i}" type="button" aria-haspopup="dialog">
      <div class="proj__thumb">
        ${thumb
          ? `<img src="${esc(thumb)}" alt="${esc(p.name || "Project")} — project thumbnail" loading="lazy">`
          : `<span class="proj__fallback">${esc(state.settings.brandName || "GeeSoft")}</span>`}
        ${p.category ? `<span class="proj__badge">${esc(p.category)}</span>` : ""}
      </div>
      <div class="proj__body">
        <h3 class="proj__name">${esc(p.name || "Untitled project")}</h3>
        ${p.description ? `<p class="proj__desc">${esc(p.description)}</p>` : ""}
        ${tech.length ? `<div class="tags">${tech.slice(0, 6).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        <span class="proj__foot">${esc(p.ctaText || state.projectsMeta.defaultCtaText || "View Project")} ${arrow}</span>
      </div>
    </button>`;
  }).join("");

  $$(".proj", wrap).forEach(btn =>
    btn.addEventListener("click", () => openProject(items[+btn.dataset.index], btn)));
  observeReveals();
}

/* ---------------- project modal ---------------- */
const modal = $("#projectModal");
let lastFocus = null;

function openProject(p, trigger) {
  lastFocus = trigger || document.activeElement;
  const thumb = safeUrl(p.thumbnail || "");
  const tech = (Array.isArray(p.technologies) ? p.technologies : String(p.technologies || "").split(","))
    .map(t => String(t).trim()).filter(Boolean);
  const gallery = (Array.isArray(p.images) ? p.images : []).map(safeUrl).filter(Boolean);
  const live = safeUrl(p.projectUrl || ""), git = safeUrl(p.githubUrl || "");

  $("#pmBody").innerHTML = `
    ${thumb ? `<img class="modal__hero" src="${esc(thumb)}" alt="${esc(p.name || "Project")} preview">` : ""}
    <div class="modal__content">
      ${p.category ? `<p class="eyebrow">${esc(p.category)}</p>` : ""}
      <h3 id="pmTitle">${esc(p.name || "Project")}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ""}
      ${p.longDescription ? `<p>${esc(p.longDescription)}</p>` : ""}
      ${tech.length ? `<div class="tags">${tech.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      ${gallery.length ? `<div class="modal__gallery">${gallery.map(g =>
        `<img src="${esc(g)}" alt="${esc(p.name || "Project")} screenshot" loading="lazy">`).join("")}</div>` : ""}
      <div class="modal__actions">
        ${live ? `<a class="btn btn--primary btn--sm" href="${esc(live)}" target="_blank" rel="noopener noreferrer">${esc(p.ctaText || "View Project")}</a>` : ""}
        ${git ? `<a class="btn btn--ghost btn--sm" href="${esc(git)}" target="_blank" rel="noopener noreferrer">View Source</a>` : ""}
      </div>
    </div>`;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $("#pmClose").focus();
}
function closeProject() {
  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}
$("#pmClose").addEventListener("click", closeProject);
modal.addEventListener("click", e => { if (e.target.hasAttribute("data-close")) closeProject(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!modal.hidden) closeProject(); if (mobileOpen) toggleMobile(false); }
  if (e.key === "Tab" && !modal.hidden) {
    const f = $$('a[href],button:not([disabled])', modal);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------------- contact ---------------- */
function renderContact() {
  const c = state.contact;
  const rows = [];
  if (c.email)   rows.push(["Email", c.email, "mailto:" + c.email]);
  if (c.phone)   rows.push(["Phone", c.phone, "tel:" + String(c.phone).replace(/[^\d+]/g, "")]);
  if (c.location) rows.push(["Location", c.location, ""]);
  if (c.availability) rows.push(["Availability", c.availability, ""]);

  $("#contactList").innerHTML = rows.map(([label, val, href]) => {
    const inner = `<span><span class="ci__label">${esc(label)}</span><span class="ci__value">${esc(val)}</span></span>`;
    return `<li>${href ? `<a href="${esc(href)}">${inner}</a>` : `<span>${inner}</span>`}</li>`;
  }).join("");

  const socials = (Array.isArray(c.socials) ? c.socials : []).filter(s => s && s.label && safeUrl(s.url));
  $("#socialList").innerHTML = socials.map(s =>
    `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join("");

  const form = $("#contactForm");
  form.hidden = c.formEnabled === false;
  const note = $(".cform__note");
  if (note) note.hidden = !c.formNote;
}

// The contact form composes a real mail message to the admin-configured address.
$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const status = $("#formStatus");
  const f = e.target;
  if (!f.checkValidity()) { status.className = "cform__status err"; status.textContent = "Please complete all fields with a valid email."; return; }
  const to = state.contact.email;
  if (!to) { status.className = "cform__status err"; status.textContent = "No contact email is configured yet — please try again soon."; return; }
  const subject = encodeURIComponent(`New project enquiry from ${f.name.value}`);
  const body = encodeURIComponent(`${f.message.value}\n\n—\n${f.name.value}\n${f.email.value}`);
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  status.className = "cform__status ok";
  status.textContent = "Opening your email app…";
});

/* ---------------- reveals / nav / scroll ---------------- */
let io;
function observeReveals() {
  if (!io) {
    io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });
  }
  $$(".reveal:not(.in)").forEach(el => io.observe(el));
}

const nav = $("#nav");
const links = $$(".navlink");
const pill = $(".navlink__pill");
function movePill(el) {
  if (!el || !pill || window.innerWidth <= 860) return;
  pill.classList.add("on");
  pill.style.width = el.offsetWidth + "px";
  pill.style.transform = `translateX(${el.offsetLeft}px)`;
}
function setActive(id) {
  links.forEach(l => {
    const on = l.getAttribute("href") === "#" + id;
    l.classList.toggle("is-active", on);
    if (on) movePill(l);
  });
}
const sections = ["home", "intro", "skills", "projects", "contact"];
const sio = new IntersectionObserver(entries => {
  entries.filter(e => e.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    .slice(0, 1).forEach(e => setActive(e.target.id));
}, { threshold: [.25, .5], rootMargin: "-18% 0px -55% 0px" });
sections.forEach(id => { const el = document.getElementById(id); if (el) sio.observe(el); });

addEventListener("scroll", () => nav.classList.toggle("is-stuck", scrollY > 24), { passive: true });
addEventListener("resize", () => movePill($(".navlink.is-active")));

/* mobile nav */
const burger = $("#burger"), mnav = $("#mobileNav");
let mobileOpen = false;
function toggleMobile(open) {
  mobileOpen = open;
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  if (open) { mnav.hidden = false; requestAnimationFrame(() => mnav.classList.add("open")); document.body.style.overflow = "hidden"; }
  else { mnav.classList.remove("open"); document.body.style.overflow = ""; setTimeout(() => { if (!mobileOpen) mnav.hidden = true; }, 300); }
}
burger.addEventListener("click", () => toggleMobile(!mobileOpen));
$$(".mnav__link").forEach(a => a.addEventListener("click", () => toggleMobile(false)));

/* ---------------- Firestore live content ---------------- */
const DOCS = [
  ["content", "settings", "settings"],
  ["content", "hero", "hero"],
  ["content", "intro", "intro"],
  ["content", "skillsMeta", "skillsMeta"],
  ["content", "projectsMeta", "projectsMeta"],
  ["content", "contact", "contact"]
];

function rerender() {
  applyBindings(); renderHero(); renderIntro(); renderContact(); observeReveals();
}

// Render immediately from defaults, then upgrade with live Firestore data.
function boot() {
  // Safety: guarantee no overlay is blocking the page and scrolling is free.
  const m = document.getElementById("projectModal");
  const n = document.getElementById("mobileNav");
  if (m) m.hidden = true;
  if (n) { n.hidden = true; n.classList.remove("open"); }
  document.body.style.overflow = "";

  rerender(); renderSkills(); renderProjects();
  connectFirebase();
}

async function connectFirebase() {
  let db, doc, collection, getDocs, onSnapshot, query, orderBy;
  try {
    ({ db } = await import("./firebase.js"));
    ({ collection, doc, getDocs, onSnapshot, query, orderBy } =
      await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"));
  } catch (err) {
    console.warn("Live content unavailable (offline or Firebase blocked). Showing built-in content.", err?.message || err);
    return; // site stays fully functional on defaults
  }

  DOCS.forEach(([col, id, key]) => {
    onSnapshot(doc(db, col, id), snap => {
      if (snap.exists()) state[key] = merge(DEFAULTS[key] || {}, snap.data());
      rerender();
    }, err => console.warn("content:" + id, err.message));
  });

  onSnapshot(query(collection(db, "skills"), orderBy("order", "asc")), snap => {
    state.skills = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSkills();
  }, async err => {
    console.warn("skills", err.message);
    try {
      const s = await getDocs(collection(db, "skills"));
      state.skills = s.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      renderSkills();
    } catch (_) { renderSkills(); }
  });

  onSnapshot(query(collection(db, "projects"), orderBy("order", "asc")), snap => {
    state.projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProjects();
  }, async err => {
    console.warn("projects", err.message);
    try {
      const s = await getDocs(collection(db, "projects"));
      state.projects = s.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      renderProjects();
    } catch (_) { renderProjects(); }
  });
}
boot();
