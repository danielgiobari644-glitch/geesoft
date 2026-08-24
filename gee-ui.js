/* ============================================================
   GEE — shared UI helpers (icons, toast, modal, list editor).
   Pure ES module, no framework.
   ============================================================ */

export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function prettyUrl(url) {
  return String(url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}
export function normalizeUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}

/* ---------- icons ---------- */
const PATHS = {
  education: '<path d="m22 9-10-5L2 9l10 5 10-5Z"/><path d="M6 11.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5"/>',
  church: '<path d="M12 2v6M9 5h6"/><path d="M4 21V11l8-4 8 4v10"/><path d="M10 21v-5h4v5"/>',
  community: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-3-5"/>',
  cbt: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m8 9 2 2 4-4"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  devices: '<rect x="2" y="4" width="14" height="10" rx="2"/><rect x="16" y="9" width="6" height="11" rx="1.5"/><path d="M6 18h6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="18" cy="9" r="2.4"/><path d="M17 15.5c2.4.4 4 2.2 4 4.5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  phone: '<path d="M6 2h4l2 5-2.5 1.5a12 12 0 0 0 6 6L17 12l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 4a2 2 0 0 1 2-2Z"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19.8 5a4.9 4.9 0 0 0-.1-3.6s-1.2-.3-3.9 1.5a13.4 13.4 0 0 0-7 0C6 1.1 4.8 1.4 4.8 1.4A4.9 4.9 0 0 0 4.7 5 5.2 5.2 0 0 0 3.3 8.8c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-1 2.6V22"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  rocket: '<path d="M5 13c-1.5 1.5-2 6-2 6s4.5-.5 6-2"/><path d="M14 4c4-2 7-1 7-1s1 3-1 7c-1.6 3.2-5.5 6-8 7l-4-4c1-2.5 3.8-6.4 6-9Z"/><circle cx="15" cy="9" r="1.5"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.5A1.6 1.6 0 0 0 10.5 3V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.6 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 20"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
};
export function icon(name, size = 20, cls = "") {
  const p = PATHS[name] || PATHS.code;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
export function spinner(size = 18) {
  return `<svg class="anim-spin" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
}

/* ---------- toast ---------- */
let toastWrap = null;
export function toast(message, tone = "success") {
  if (!toastWrap) {
    toastWrap = document.createElement("div");
    toastWrap.className = "toast-wrap";
    document.body.appendChild(toastWrap);
  }
  const t = document.createElement("div");
  t.className = `toast toast--${tone}`;
  const mark = tone === "error"
    ? '<path d="M18 6 6 18M6 6l12 12"/>'
    : '<path d="m20 6-11 11-5-5"/>';
  t.innerHTML = `<span style="display:grid;place-items:center;height:20px;width:20px;border-radius:999px;border:1px solid currentColor;flex-shrink:0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${mark}</svg></span><span>${escapeHtml(message)}</span>`;
  toastWrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 300); }, 3400);
}

/* ---------- modal ---------- */
function setNode(el, val) {
  if (!val) return;
  if (typeof val === "string") el.innerHTML = val;
  else if (val instanceof Node) el.appendChild(val);
}
export function openModal({ title = "", body = "", footer = "", size = "md", onClose }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal modal--${size}" role="dialog" aria-modal="true">
      <div class="modal__head">
        <div class="modal__title">${title}</div>
        <button class="modal__close" data-close aria-label="Close"><span style="display:inline-block;transform:rotate(45deg)">${icon("plus", 16)}</span></button>
      </div>
      <div class="modal__body scroll-thin"></div>
      <div class="modal__foot"></div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  const bodyEl = overlay.querySelector(".modal__body");
  const footEl = overlay.querySelector(".modal__foot");
  setNode(bodyEl, body);
  setNode(footEl, footer);
  if (!footer) footEl.style.display = "none";
  const onKey = (e) => { if (e.key === "Escape") close(); };
  function close() {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (onClose) onClose();
  }
  overlay.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", onKey);
  return { overlay, bodyEl, footEl, close };
}

export function confirmDialog({ title, message, confirmLabel = "Delete" }) {
  return new Promise((resolve) => {
    const m = openModal({
      title, size: "sm",
      body: `<p class="muted" style="font-size:14px;line-height:1.6;margin:0">${escapeHtml(message)}</p>`,
      footer: `<div class="flex justify-end gap8"><button class="btn btn--secondary btn--sm" data-cancel>Cancel</button><button class="btn btn--danger btn--sm" data-ok>${escapeHtml(confirmLabel)}</button></div>`,
    });
    m.overlay.querySelector("[data-cancel]").onclick = () => { m.close(); resolve(false); };
    m.overlay.querySelector("[data-ok]").onclick = () => { m.close(); resolve(true); };
  });
}

/* ---------- list editor (mounts into a container) ---------- */
export function mountListEditor(container, items, onChange, placeholder = "Add item") {
  let arr = items.slice();
  function render() {
    container.innerHTML = "";
    const chips = document.createElement("div");
    chips.className = "le-chips";
    arr.forEach((it, i) => {
      const c = document.createElement("span");
      c.className = "le-chip";
      c.innerHTML = `<span>${escapeHtml(it)}</span><button aria-label="Remove">${icon("plus", 12)}</button>`;
      c.querySelector("button").onclick = () => { arr.splice(i, 1); onChange(arr.slice()); render(); };
      chips.appendChild(c);
    });
    container.appendChild(chips);
    const row = document.createElement("div");
    row.className = "le-row";
    const input = document.createElement("input");
    input.className = "input";
    input.placeholder = placeholder;
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn--secondary btn--md";
    addBtn.textContent = "Add";
    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      arr.push(v);
      onChange(arr.slice());
      input.value = "";
      render();
      input.focus();
    };
    addBtn.onclick = add;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    row.appendChild(input);
    row.appendChild(addBtn);
    container.appendChild(row);
  }
  render();
  return { get: () => arr.slice(), set: (next) => { arr = next.slice(); render(); } };
}
