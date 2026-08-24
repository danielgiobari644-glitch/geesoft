/* ============================================================
   GEE — public website renderer (vanilla JS).
   ============================================================ */
import { getPublic, store } from "./gee-data.js";
import { escapeHtml, icon, normalizeUrl, prettyUrl, openModal } from "./gee-ui.js";

const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "Who I Am" },
  { id: "problem", label: "Problems" },
  { id: "audience", label: "Audiences" },
  { id: "projects", label: "Projects" },
  { id: "technology", label: "Technology" },
  { id: "engineering", label: "Engineering" },
  { id: "defence", label: "Defence" },
  { id: "contact", label: "Contact" },
];

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
};

/* ---------------------------------------------------------- section header */
function head(label, title, sub, center) {
  return `<div class="sec-head ${center ? "sec-head--center" : ""} reveal">
    ${label ? `<div class="sec-head__label"><span class="bar"></span><span class="txt">${escapeHtml(label)}</span>${center ? '<span class="bar"></span>' : ""}</div>` : ""}
    <h2 class="sec-head__title balance">${title}</h2>
    ${sub ? `<p class="sec-head__sub">${sub}</p>` : ""}
  </div>`;
}

/* ---------------------------------------------------------- navbar */
function navbar(active) {
  const links = NAV.map((n) =>
    `<button class="nav-link ${active === n.id ? "active" : ""}" data-scroll="${n.id}">${n.label}</button>`
  ).join("");
  const mobile = NAV.map((n) =>
    `<button class="mobile-link ${active === n.id ? "active" : ""}" data-scroll="${n.id}">${n.label}</button>`
  ).join("");
  return `
  <header class="nav" id="nav">
    <div class="nav__inner">
      <button class="brand" data-scroll="home">
        <span class="brand-mark"><b>G</b><span class="pip"></span></span>
        <span class="brand-name"><b>GEE</b><small>Software Development</small></span>
      </button>
      <nav class="nav-links">${links}</nav>
      <div class="nav-actions">
        <button class="btn btn--outline btn--sm nav-cta" data-scroll="contact">Contact</button>
        <button class="nav-burger" id="burger" aria-label="Menu">${icon("menu", 18)}</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu hidden" id="mobileMenu">${mobile}</div>`;
}

/* ---------------------------------------------------------- hero visual */
function heroVisual() {
  return `
  <div class="hero-visual">
    <div style="position:absolute;inset:-40px;opacity:.7;pointer-events:none">
      <div class="anim-drift" style="position:absolute;top:8%;left:12%;height:208px;width:208px;border-radius:999px;background:rgba(77,124,255,.25);filter:blur(90px)"></div>
      <div class="anim-drift" style="position:absolute;right:6%;bottom:14%;height:224px;width:224px;border-radius:999px;background:rgba(139,108,255,.2);filter:blur(100px);animation-delay:-6s"></div>
      <div class="anim-drift" style="position:absolute;top:45%;right:35%;height:128px;width:128px;border-radius:999px;background:rgba(47,214,180,.2);filter:blur(70px);animation-delay:-12s"></div>
    </div>
    <svg viewBox="0 0 400 340" style="position:absolute;inset:0;height:100%;width:100%" fill="none">
      <defs><linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4d7cff" stop-opacity="0.8"/><stop offset="100%" stop-color="#2fd6b4" stop-opacity="0.35"/></linearGradient></defs>
      <g stroke="url(#edge)" stroke-width="1">
        <path class="anim-dash" d="M96 96 L96 210 L214 210"/>
        <path class="anim-dash" d="M250 78 L318 78 L318 168" style="animation-delay:-2s"/>
        <path class="anim-dash" d="M120 250 L200 250 L200 292 L300 292" style="animation-delay:-4s"/>
        <path class="anim-dash" d="M300 190 L300 250 L212 250" style="animation-delay:-1s"/>
      </g>
      <g fill="#4d7cff"><circle class="anim-node" cx="96" cy="210" r="3"/><circle class="anim-node" cx="318" cy="78" r="3" style="animation-delay:-1s"/><circle class="anim-node" cx="200" cy="292" r="3" style="animation-delay:-2s"/></g>
      <g fill="#2fd6b4"><circle class="anim-node" cx="300" cy="250" r="3" style="animation-delay:-1.6s"/><circle class="anim-node" cx="212" cy="210" r="3" style="animation-delay:-2.4s"/></g>
    </svg>
    <div class="hv-window anim-float" style="top:4%;left:3%;width:64%">
      <div style="display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line);background:var(--ink-850);padding:8px 12px">
        <span style="height:8px;width:8px;border-radius:999px;background:#ff5f57"></span>
        <span style="height:8px;width:8px;border-radius:999px;background:#febc2e"></span>
        <span style="height:8px;width:8px;border-radius:999px;background:#28c840"></span>
        <span style="margin-left:8px;font-family:var(--font-mono);font-size:9px;color:var(--mute-2)" class="truncate">gee://platform/dashboard</span>
      </div>
      <div style="display:grid;grid-template-columns:34px 1fr">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;border-right:1px solid var(--line);background:rgba(5,7,10,.6);padding:12px 0">
          ${[0,1,2,3].map((i)=>`<span style="height:16px;width:16px;border-radius:5px;border:1px solid var(--line);background:var(--ink-800)"></span>`).join("")}
        </div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;justify-content:space-between"><span style="height:8px;width:64px;border-radius:999px;background:var(--ink-600)"></span><span style="height:16px;width:40px;border-radius:6px;background:rgba(77,124,255,.25)"></span></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${[0,1,2].map(()=>`<div style="border:1px solid var(--line);background:var(--ink-850);border-radius:8px;padding:8px"><span style="display:block;height:6px;width:24px;border-radius:999px;background:var(--ink-600);margin-bottom:6px"></span><span style="display:block;height:10px;width:32px;border-radius:999px;background:var(--ink-700)"></span></div>`).join("")}
          </div>
          <div style="position:relative;height:56px;overflow:hidden;border:1px solid var(--line);background:var(--ink-950);border-radius:8px">
            <svg viewBox="0 0 200 56" style="height:100%;width:100%" fill="none" preserveAspectRatio="none">
              <path d="M0 44 L28 34 L56 38 L84 22 L112 28 L140 12 L168 18 L200 6" stroke="#4d7cff" stroke-width="1.6"/>
              <path d="M0 44 L28 34 L56 38 L84 22 L112 28 L140 12 L168 18 L200 6 L200 56 L0 56Z" fill="#4d7cff" fill-opacity="0.1"/>
            </svg>
            <div class="anim-sweep" style="position:absolute;inset:0;width:33%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="hv-window anim-float" style="top:38%;right:2%;width:46%;animation-delay:-2.5s">
      <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding:8px 12px"><span style="height:6px;width:6px;border-radius:999px;background:var(--accent-3)"></span><span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;color:var(--mute-2)">build.js</span></div>
      <div style="padding:12px;font-family:var(--font-mono);font-size:10px;line-height:1.6">
        <div style="display:flex;gap:8px"><span style="color:rgba(98,109,125,.5)">01</span><span class="muted-2">const problem = identify(users);</span></div>
        <div style="display:flex;gap:8px"><span style="color:rgba(98,109,125,.5)">02</span><span class="muted-2">const spec = requirements(problem);</span></div>
        <div style="display:flex;gap:8px"><span style="color:rgba(98,109,125,.5)">03</span><span style="color:var(--accent-3)">build(spec).deploy();</span></div>
      </div>
    </div>
    <div class="hv-window anim-float" style="bottom:16%;left:8%;display:flex;align-items:center;gap:10px;padding:10px 12px;animation-delay:-4.2s">
      <span style="display:grid;place-items:center;height:28px;width:28px;border-radius:8px;background:rgba(77,124,255,.15);color:var(--accent)">${icon("lock",14)}</span>
      <div><div style="font-size:10px;color:var(--paper)">Auth</div><div style="font-family:var(--font-mono);font-size:8.5px;color:var(--accent-3)">session · verified</div></div>
    </div>
    <div class="hv-window anim-float" style="right:6%;bottom:4%;display:flex;align-items:center;gap:10px;padding:10px 12px;animation-delay:-1.4s">
      <span style="display:grid;place-items:center;height:28px;width:28px;border-radius:8px;background:rgba(139,108,255,.15);color:var(--accent-2)">${icon("database",14)}</span>
      <div><div style="font-size:10px;color:var(--paper)">Firestore</div><div style="font-family:var(--font-mono);font-size:8.5px;color:var(--mute-2)">collections · rules</div></div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------- sections */
function hero(pub) {
  const c = pub.content;
  const stats = [
    { k: "Live platforms", v: String(pub.platforms.length) },
    { k: "Case studies", v: String(pub.projects.length) },
    { k: "Solution areas", v: String(pub.categories.length) },
    { k: "Status", v: "Deployed" },
  ];
  const strip = pub.platforms.length ? `
    <div class="platform-strip reveal">
      <div class="platform-strip__grid">
        ${pub.platforms.map((p) => `
          <a class="platform-item" href="${normalizeUrl(p.url)}" target="_blank" rel="noopener noreferrer">
            <span class="platform-item__logo">${escapeHtml(p.icon || p.name.slice(0, 2).toUpperCase())}</span>
            <span style="min-width:0;flex:1">
              <span style="display:flex;align-items:center;gap:8px"><span class="truncate font-display" style="font-size:15px;font-weight:600;color:var(--paper)">${escapeHtml(p.name)}</span><span class="live-pip"></span></span>
              <span class="truncate font-mono" style="display:block;margin-top:2px;font-size:11px;color:var(--mute-2)">${escapeHtml(prettyUrl(p.url))}</span>
            </span>
            <span class="badge" style="border-color:var(--line)">${escapeHtml(p.buttonLabel)} ${icon("external", 12)}</span>
          </a>`).join("")}
      </div>
    </div>` : "";
  return `
  <section class="hero" id="home">
    <div class="grid-bg mask-fade" style="position:absolute;inset:0;pointer-events:none"></div>
    <div style="position:absolute;top:-160px;left:50%;height:420px;width:820px;transform:translateX(-50%);border-radius:999px;background:rgba(77,124,255,.12);filter:blur(130px);pointer-events:none"></div>
    <div class="container" style="position:relative">
      <div class="hero__grid">
        <div>
          <div class="pill reveal"><span class="ico">${icon("bolt", 12)}</span><span>${escapeHtml(c.hero.label)}</span></div>
          <h1 class="reveal" style="transition-delay:80ms"><span class="text-gradient">${escapeHtml(c.hero.heading)}</span></h1>
          <p class="lead reveal" style="transition-delay:160ms">${escapeHtml(c.hero.supporting)}</p>
          <div class="hero__cta reveal" style="transition-delay:240ms">
            <button class="btn btn--primary btn--lg" data-scroll="projects">${escapeHtml(c.hero.cta1)} ${icon("arrow", 16)}</button>
            <button class="btn btn--secondary btn--lg" data-scroll="about">${escapeHtml(c.hero.cta2)}</button>
          </div>
          <div class="stat-grid reveal" style="transition-delay:320ms">
            ${stats.map((s) => `<div><b>${escapeHtml(s.v)}</b><small>${escapeHtml(s.k)}</small></div>`).join("")}
          </div>
        </div>
        <div class="reveal" style="transition-delay:200ms">${heroVisual()}</div>
      </div>
      ${strip}
    </div>
  </section>`;
}

function about(pub) {
  const c = pub.content;
  return `
  <section class="section" id="about">
    <div class="container">
      <div class="about-grid">
        <div>
        ${head("01 — Identity", escapeHtml(c.about.heading))}
        <p class="reveal" style="margin-top:24px;font-size:16px;line-height:1.65;color:var(--paper)">${escapeHtml(c.about.intro)}</p>
        <p class="reveal" style="margin-top:16px;font-size:15px;line-height:1.65;color:var(--mute)">${escapeHtml(c.about.philosophy)}</p>
        <div class="reveal card" style="margin-top:32px;padding:24px">
          <div class="mono-label" style="color:var(--accent);margin-bottom:20px">My development process begins by identifying</div>
          <ol style="list-style:none;margin:0;padding:0">
            ${c.about.bullets.map((b, i) => `<li style="display:flex;gap:16px;margin-bottom:16px"><span style="margin-top:2px;display:grid;place-items:center;height:24px;width:24px;border-radius:6px;border:1px solid var(--line);background:var(--ink-850);font-family:var(--font-mono);font-size:10px;color:var(--accent)">${String(i + 1).padStart(2, "0")}</span><span style="font-size:14.5px;line-height:1.6;color:var(--mute)">${escapeHtml(b)}</span></li>`).join("")}
          </ol>
          <p style="margin:0;border-top:1px solid var(--line);padding-top:20px;font-size:14.5px;color:var(--paper)">Then I design and develop the solution — and deploy it where the users are.</p>
        </div>
        </div>
        <div>
        <h3 class="reveal mono-label" style="margin:0 0 20px">Capabilities I actually use</h3>
        <div style="display:grid;gap:12px;grid-template-columns:repeat(2,1fr)">
          ${c.about.skills.map((s, i) => `
            <div class="reveal card card--hover" style="padding:20px;transition-delay:${i * 45}ms">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="display:grid;place-items:center;height:32px;width:32px;border-radius:8px;background:rgba(77,124,255,.12);color:var(--accent)">${icon("code", 15)}</span>
                <span class="font-display" style="font-size:14.5px;font-weight:600;color:var(--paper)">${escapeHtml(s.name)}</span>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.55;color:var(--mute)">${escapeHtml(s.note)}</p>
            </div>`).join("")}
        </div>
        <div class="reveal" style="margin-top:16px;border:1px solid rgba(77,124,255,.25);background:rgba(77,124,255,.06);border-radius:var(--r-lg);padding:20px">
          <p style="margin:0;font-size:13.5px;line-height:1.6;color:var(--mute)"><span style="font-weight:500;color:var(--paper)">No exaggeration.</span> Every technology listed here appears in a platform that is deployed and reachable at a public URL — you can open both from this page.</p>
        </div>
        </div>
      </div>
    </div>
  </section>`;
}

function chain(items, compact) {
  return `<div class="chain ${compact ? "chain--compact" : ""}">
    ${items.map((it, i) => `<div class="reveal chain-item" style="transition-delay:${i * 90}ms">
      <span class="no">${String(i + 1).padStart(2, "0")}</span>
      <span class="lbl">${escapeHtml(it)}</span>
      ${i < items.length - 1 ? `<span style="margin-left:auto;color:var(--mute-2)">${icon("arrow", 14)}</span>` : ""}
    </div>`).join("")}
  </div>`;
}

function problem(pub) {
  const c = pub.content;
  return `
  <section class="section section--tint" id="problem">
    <div class="container">
      ${head("02 — Method", escapeHtml(c.problem.heading), escapeHtml(c.problem.body), true)}
      ${chain(c.problem.chain)}
    </div>
  </section>`;
}

function audience(pub) {
  return `
  <section class="section section--tint" id="audience">
    <div class="container">
      ${head("03 — Audiences", "WHO FACES THESE PROBLEMS?", "Four groups whose daily work is slowed by manual, scattered or offline processes — and the working software that now serves each one. Managed as real data, not hard-coded markup.")}
      <div class="cat-grid">
        ${pub.categories.map((c, i) => {
          const related = pub.projects.filter((p) => p.categoryId === c.id);
          return `<div class="reveal card card--hover cat-card" style="transition-delay:${i * 70}ms">
            <div class="cat-card__head">
              <span class="cat-card__icon">${icon(c.icon, 22)}</span>
              <div style="min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <h3 class="cat-card__title">${escapeHtml(c.title)}</h3>
                  <span class="badge ${related.length ? "badge--green" : "badge--muted"}">${related.length ? "Shipped" : "Framework"}</span>
                </div>
                <p class="cat-card__desc">${escapeHtml(c.description)}</p>
              </div>
            </div>
            <div class="cat-card__body">
              <div><div class="mono-label" style="margin-bottom:12px">Users</div>
                <ul class="mini-list">${c.users.map((u) => `<li><span class="b"></span>${escapeHtml(u)}</li>`).join("")}</ul>
              </div>
              <div><div class="mono-label" style="margin-bottom:12px">Problems</div>
                <ul class="mini-list mini-list--mute">${c.problems.map((p) => `<li><span class="b"></span>${escapeHtml(p)}</li>`).join("")}</ul>
              </div>
            </div>
            <div class="cat-card__foot">
              <span class="mono-label">${related.length ? "Delivered through" : "Status"}</span>
              ${related.length ? related.map((p) => `<button class="btn btn--secondary btn--sm" data-cs="${p.id}">${escapeHtml(p.name)} ${icon("chevron", 12)}</button>`).join("") : `<span style="font-size:13px;color:var(--mute-2)">Framework defined — no platform shipped here yet.</span>`}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>`;
}

function projectCard(p, i, catTitle) {
  const accent = p.accent || "#4d7cff";
  const users = p.users.slice(0, 4);
  return `
  <div class="reveal card card--hover project-card" style="transition-delay:${i * 90}ms">
    <div class="project-card__grid">
      <div class="project-card__content">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
          <span class="mono-label">PROJECT ${String(i + 1).padStart(2, "0")}</span>
          ${catTitle ? `<span class="badge badge--accent">${escapeHtml(catTitle)}</span>` : ""}
          <span class="badge badge--green"><span class="dot"></span> ${escapeHtml(p.status)}</span>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <p style="margin:10px 0 0;font-size:15px;font-weight:500;color:${accent}">${escapeHtml(p.tagline)}</p>
        <p style="margin:20px 0 0;max-width:560px;font-size:14.5px;line-height:1.6;color:var(--mute)">${escapeHtml(p.description)}</p>
        ${p.features.length ? `<div style="margin-top:7px"><div class="mono-label" style="margin:0 0 12px">Implemented features</div><div class="feature-chips" style="margin-top:12px">${p.features.map((f) => `<span class="feature-chip">${escapeHtml(f)}</span>`).join("")}</div></div>` : ""}
        <div style="margin-top:32px;display:flex;flex-wrap:wrap;gap:12px">
          ${p.liveUrl ? `<a class="btn btn--primary btn--lg" href="${normalizeUrl(p.liveUrl)}" target="_blank" rel="noopener noreferrer" style="letter-spacing:.06em">OPEN ${escapeHtml(p.name.toUpperCase())} ${icon("external", 15)}</a>` : ""}
          <button class="btn btn--secondary btn--lg" data-cs="${p.id}" style="letter-spacing:.06em">VIEW CASE STUDY</button>
          ${p.githubUrl ? `<a class="btn btn--outline btn--lg" href="${normalizeUrl(p.githubUrl)}" target="_blank" rel="noopener noreferrer">${icon("github", 15)} GitHub</a>` : ""}
        </div>
        ${p.liveUrl ? `<div style="margin-top:20px;display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11.5px;color:var(--mute-2);word-break:break-all">${icon("link", 12)} ${escapeHtml(prettyUrl(p.liveUrl))}</div>` : ""}
      </div>
      <div class="project-card__visual">
        <div class="grid-bg" style="position:absolute;inset:0;opacity:.7"></div>
        <div class="anim-drift" style="position:absolute;top:-64px;right:-40px;height:256px;width:256px;border-radius:999px;filter:blur(90px);background:${accent}33;pointer-events:none"></div>
        ${p.thumbnail ? `<img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.name)} thumbnail" style="position:absolute;inset:0;height:100%;width:100%;object-fit:cover" loading="lazy"/>` : projectGlyph(p, accent, users)}
      </div>
    </div>
  </div>`;
}

function projectGlyph(p, accent, users) {
  return `<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:24px 32px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <span style="display:grid;place-items:center;height:56px;width:56px;border-radius:16px;border:1px solid ${accent}55;background:${accent}14;color:${accent};font-family:var(--font-display);font-size:18px;font-weight:700">${escapeHtml(p.logo || p.name.slice(0, 2).toUpperCase())}</span>
      <span class="mono-label">${p.tech.length} layers</span>
    </div>
    <div style="margin:24px 0;display:flex;flex-direction:column;gap:10px">
      ${p.tech.map((g, gi) => `<div style="display:flex;align-items:center;gap:12px">
        <span class="font-mono" style="width:80px;flex-shrink:0;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute-2)">${escapeHtml(g.group)}</span>
        <span style="height:1px;flex:1;background:var(--line)"></span>
        <div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px">
          ${g.items.slice(0, 3).map((it) => `<span style="border-radius:6px;border:1px solid ${gi === 0 ? accent + "44" : "var(--color-line)"};padding:4px 8px;font-family:var(--font-mono);font-size:9.5px;color:var(--paper);background:rgba(255,255,255,.02)">${escapeHtml(it)}</span>`).join("")}
        </div>
      </div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${users.map((u) => `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:rgba(10,13,18,.7);border-radius:8px;padding:8px 10px"><span style="height:6px;width:6px;border-radius:999px;background:${accent}"></span><span class="truncate" style="font-size:11.5px;color:var(--mute)">${escapeHtml(u)}</span></div>`).join("")}
    </div>
  </div>`;
}

function projects(pub) {
  const catById = new Map(pub.categories.map((c) => [c.id, c]));
  return `
  <section class="section" id="projects">
    <div class="container">
      ${head("05 — Portfolio", "WHAT I'VE BUILT", "Real problems. Real users. Working software.")}
      <div class="project-list">
        ${pub.projects.map((p, i) => projectCard(p, i, catById.get(p.categoryId)?.title)).join("")}
      </div>
    </div>
  </section>`;
}

function technology(pub) {
  return `
  <section class="section section--tint" id="technology">
    <div class="container">
      ${head("06 — Stack", "BUILT WITH TECHNOLOGY THAT WORKS.", "This stack is generated from the project records themselves — nothing is listed here unless a published project actually uses it.")}
      <div class="tech-grid">
        ${pub.techStack.map((g, gi) => `
          <div class="reveal card card--hover tech-item" style="transition-delay:${gi * 80}ms">
            <div class="tech-item__group"><span class="ico">${icon(gi === 0 ? "code" : gi === 1 ? "database" : "rocket", 17)}</span><h3 class="mono-label" style="color:var(--paper)">${escapeHtml(g.group)}</h3></div>
            <ul style="list-style:none;margin:0;padding:0">
              ${g.items.map((it) => `<li style="border-bottom:1px solid rgba(30,37,48,.6);padding-bottom:12px;margin-bottom:12px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:14px;font-weight:500;color:var(--paper)">${escapeHtml(it.name)}</span><span class="font-mono" style="font-size:10px;color:var(--mute-2);flex-shrink:0">${it.usedIn.length} project${it.usedIn.length > 1 ? "s" : ""}</span></div><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">${it.usedIn.map((n) => `<span style="border:1px solid var(--line);padding:2px 6px;font-family:var(--font-mono);font-size:9.5px;color:var(--mute-2)">${escapeHtml(n)}</span>`).join("")}</div></li>`).join("")}
            </ul>
          </div>`).join("")}
      </div>
    </div>
  </section>`;
}

function engineering(pub) {
  const c = pub.content;
  const challenges = c.challenges.map((ch, i) => `
    <div class="reveal card card--hover challenge-card" style="transition-delay:${i * 60}ms">
      <div class="challenge-card__head"><span class="ico">${icon(["shield", "database", "devices", "users", "bolt", "cbt"][i % 6], 16)}</span><h4>${escapeHtml(ch.title)}</h4></div>
      <div style="flex:1">
        ${chStep("Challenge", "color:#fbbf24", ch.challenge)}
        ${chStep("Approach", "color:#a9bcff", ch.approach)}
        ${chStep("Result", "color:var(--accent-3)", ch.result, true)}
      </div>
    </div>`).join("");
  return `
  <section class="section" id="engineering">
    <div class="container">
      ${head("07 — Process", "HOW I BUILD", "The same seven steps run on every project, from a church cell platform to an examination system.")}
      <div id="processTimeline" class="process"></div>
      <div style="height:1px;background:var(--line);margin:64px 0"></div>
      ${head("08 — Challenges", "TECHNICAL CHALLENGES.", "These are the problems that actually consumed development time. Each one is presented as challenge → approach → result.")}
      <div class="challenge-grid">${challenges}</div>
    </div>
  </section>`;
}

function chStep(label, color, text, last) {
  return `<div class="ch-step" style="color:${color.replace("color:", "")}">
    <span class="bullet" style="background:${color.replace("color:", "")}"></span>
    <div class="lbl">${label}</div>
    <p>${escapeHtml(text)}</p>
  </div>`;
}

function defence(pub) {
  const c = pub.content;
  return `
  <section class="section" id="defence">
    <div class="container">
      ${head("09 — Defence", escapeHtml(c.defence.heading), "Four questions. Four answers. The whole philosophy.", true)}
      <div class="defence-grid">
        ${c.defence.questions.map((q, i) => `
          <div class="reveal card card--hover defence-card" style="transition-delay:${i * 70}ms">
            <span class="big">${escapeHtml(q.no)}</span>
            <div style="position:relative">
              <div class="mono-label" style="color:var(--accent);margin-bottom:12px">${escapeHtml(q.no)} —</div>
              <h3 class="font-display" style="font-size:20px;font-weight:700;letter-spacing:-.01em;color:var(--paper);margin:0">${escapeHtml(q.question)}</h3>
              <p style="margin:16px 0 0;font-size:14.5px;line-height:1.6;color:var(--mute)">${escapeHtml(q.answer)}</p>
            </div>
          </div>`).join("")}
      </div>
      ${chain(c.defence.chain, true)}
    </div>
  </section>`;
}

function finalCta(pub) {
  const c = pub.content;
  return `
  <section class="final-cta">
    <div class="dot-bg" style="position:absolute;inset:0;opacity:.6;-webkit-mask-image:radial-gradient(ellipse at center,black,transparent 75%);mask-image:radial-gradient(ellipse at center,black,transparent 75%);pointer-events:none"></div>
    <div style="position:absolute;bottom:-128px;left:50%;height:288px;width:700px;transform:translateX(-50%);border-radius:999px;background:rgba(77,124,255,.12);filter:blur(120px);pointer-events:none"></div>
    <div class="container" style="position:relative">
      <div class="reveal"><h2><span class="text-gradient">${escapeHtml(c.finalCta.heading)}</span></h2><p style="margin:20px auto 0;max-width:560px;font-size:16px;color:var(--mute)">${escapeHtml(c.finalCta.text)}</p></div>
      <div class="reveal" style="margin-top:40px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px;transition-delay:120ms">
        <button class="btn btn--primary btn--lg" data-scroll="projects">EXPLORE PROJECTS ${icon("arrow", 16)}</button>
        ${pub.platforms.map((p) => `<a class="btn btn--secondary btn--lg" href="${normalizeUrl(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.buttonLabel)} ${icon("external", 14)}</a>`).join("")}
        <button class="btn btn--outline btn--lg" data-scroll="contact">CONTACT GEE</button>
      </div>
    </div>
  </section>`;
}

function contact(pub) {
  const c = pub.contact;
  const channels = [
    { label: "Email", value: c.email, href: c.email ? "mailto:" + c.email : "", icon: "mail" },
    { label: "Phone", value: c.phone, href: c.phone ? "tel:" + c.phone : "", icon: "phone" },
    { label: "WhatsApp", value: c.whatsapp, href: c.whatsapp ? "https://wa.me/" + c.whatsapp.replace(/[^\d]/g, "") : "", icon: "phone" },
    { label: "Telegram", value: c.telegram, href: normalizeUrl(c.telegram), icon: "globe" },
    { label: "GitHub", value: c.github, href: normalizeUrl(c.github), icon: "github" },
    { label: "Instagram", value: c.instagram, href: normalizeUrl(c.instagram), icon: "globe" },
    { label: "TikTok", value: c.tiktok, href: normalizeUrl(c.tiktok), icon: "globe" },
    { label: "YouTube", value: c.youtube, href: normalizeUrl(c.youtube), icon: "globe" },
    ...c.extra.map((e) => ({ label: e.label, value: e.value || e.url, href: normalizeUrl(e.url), icon: "link" })),
  ].filter((x) => x.value);
  return `
  <section class="section" id="contact">
    <div class="container">
      <div class="contact-grid">
        <div>
          ${head("10 — Contact", "LET'S TALK ABOUT THE PROBLEM.")}
          <p class="reveal" style="margin-top:24px;font-size:15px;line-height:1.6;color:var(--mute)">${escapeHtml(c.cta)}</p>
          ${c.location ? `<div class="reveal" style="margin-top:24px;display:inline-flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--ink-900);border-radius:var(--r-md);padding:12px 16px">${icon("globe", 16)}<span style="font-size:13.5px;color:var(--mute)">${escapeHtml(c.location)}</span></div>` : ""}
        </div>
        <div class="contact-channels">
          ${channels.map((ch, i) => `<a class="reveal contact-card" style="transition-delay:${i * 45}ms" href="${escapeHtml(ch.href)}" ${ch.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
            <span class="ico">${icon(ch.icon, 17)}</span>
            <span style="min-width:0"><span class="mono-label" style="display:block">${escapeHtml(ch.label)}</span><span class="truncate" style="display:block;margin-top:2px;font-size:14px;font-weight:500;color:var(--paper)">${escapeHtml(prettyUrl(ch.value))}</span></span>
            <span style="margin-left:auto;color:var(--mute-2)">${icon("arrow", 15)}</span>
          </a>`).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function footer(pub) {
  const c = pub.content;
  const ct = pub.contact;
  const socials = [
    { label: "GitHub", value: ct.github, icon: "github" },
    { label: "YouTube", value: ct.youtube, icon: "globe" },
    { label: "Instagram", value: ct.instagram, icon: "globe" },
    { label: "TikTok", value: ct.tiktok, icon: "globe" },
    { label: "Telegram", value: ct.telegram, icon: "globe" },
    ...ct.extra.map((e) => ({ label: e.label, value: e.url, icon: "link" })),
  ].filter((s) => s.value);
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <div style="display:flex;align-items:center;gap:10px"><span class="brand-mark" style="height:36px;width:36px"><b>G</b><span class="pip"></span></span><span class="font-display" style="font-size:18px;font-weight:700;letter-spacing:.14em;color:var(--paper)">GEE</span></div>
          <p style="margin:16px 0 0;max-width:420px;font-size:14px;line-height:1.6;color:var(--mute)">${escapeHtml(c.footer.description)}</p>
          <p class="font-mono" style="margin:12px 0 0;font-size:12px;color:var(--accent)">${escapeHtml(c.footer.note)}</p>
          <button class="btn btn--primary btn--md" data-open-chat style="margin-top:20px">${icon("mail", 15)} Chat with GEE</button>
        </div>
        <div>
          <h5 class="mono-label" style="margin:0 0 16px">Navigate</h5>
          <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px">
            ${NAV.slice(1, 7).map((n) => `<li><button class="nav-link" style="padding:0" data-scroll="${n.id}">${n.label}</button></li>`).join("")}
          </ul>
        </div>
        <div>
          <h5 class="mono-label" style="margin:0 0 16px">Contact</h5>
          <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px">
            ${ct.email ? `<li><a href="mailto:${escapeHtml(ct.email)}" style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--mute);word-break:break-all">${icon("mail", 14)} ${escapeHtml(ct.email)}</a></li>` : ""}
            ${ct.phone ? `<li><a href="tel:${escapeHtml(ct.phone)}" style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--mute)">${icon("phone", 14)} ${escapeHtml(ct.phone)}</a></li>` : ""}
            ${socials.map((s) => `<li><a href="${normalizeUrl(s.value)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--mute);word-break:break-all">${icon(s.icon, 14)} ${escapeHtml(prettyUrl(s.value))}</a></li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <p style="margin:0;font-size:12.5px;color:var(--mute-2)">© ${new Date().getFullYear()} GEE. Built and maintained by the developer.</p>
        ${ct.location ? `<span style="font-size:12.5px;color:var(--mute-2)">${escapeHtml(ct.location)}</span>` : ""}
      </div>
    </div>
  </footer>`;
}

/* ---------------------------------------------------------- process timeline (interactive) */
function wireProcess(pub) {
  const root = document.getElementById("processTimeline");
  if (!root) return;
  const steps = pub.content.process;
  let active = 0;
  function render() {
    root.innerHTML = `
      <div class="process__nav no-bar">
        ${steps.map((s, i) => `<button class="process-step ${i === active ? "active" : ""}" data-i="${i}">
          <span class="process-step__no">${escapeHtml(s.no)}</span>
          <span><span class="process-step__title" style="display:block">${escapeHtml(s.title)}</span><span class="process-step__summary truncate">${escapeHtml(s.summary)}</span></span>
        </button>`).join("")}
      </div>
      <div class="card process-panel" style="position:relative;overflow:hidden">
        <div class="grid-bg" style="position:absolute;inset:0;opacity:.4;-webkit-mask-image:radial-gradient(ellipse at top right,black,transparent 70%);mask-image:radial-gradient(ellipse at top right,black,transparent 70%);pointer-events:none"></div>
        <div style="position:relative" class="anim-fadeup">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="font-mono" style="font-size:11px;letter-spacing:.22em;color:var(--accent)">${escapeHtml(steps[active].no)}</span>
            <span style="height:1px;flex:1;background:var(--line)"></span>
            <span class="font-mono" style="font-size:11px;color:var(--mute-2)">${active + 1} / ${steps.length}</span>
          </div>
          <h3 class="font-display" style="margin:24px 0 0;font-size:28px;font-weight:700;letter-spacing:-.01em;color:var(--paper)">${escapeHtml(steps[active].title)}</h3>
          <p style="margin:8px 0 0;font-size:15px;font-weight:500;color:#a9bcff">${escapeHtml(steps[active].summary)}</p>
          <p style="margin:20px 0 0;max-width:640px;font-size:15px;line-height:1.6;color:var(--mute)">${escapeHtml(steps[active].detail)}</p>
          <div style="margin-top:32px;display:flex;gap:8px">
            ${steps.map((s, i) => `<button data-i="${i}" aria-label="${escapeHtml(s.title)}" style="height:4px;border-radius:999px;transition:all .2s;border:none;background:${i === active ? "var(--accent)" : "var(--ink-700)"};width:${i === active ? "32px" : "16px"}"></button>`).join("")}
          </div>
        </div>
      </div>`;
    root.querySelectorAll("[data-i]").forEach((b) => {
      b.addEventListener("click", () => { active = parseInt(b.getAttribute("data-i"), 10); render(); });
    });
    // show summary text on desktop via media query already hidden; keep simple
  }
  render();
}

/* ---------------------------------------------------------- case study modal */
function openCaseStudy(projectId) {
  const d = store.getData();
  const p = d.projects.find((x) => x.id === projectId);
  if (!p) return;
  const category = d.categories.find((c) => c.id === p.categoryId);
  const STEPS = [
    { key: "problem", no: "01", label: "PROBLEM" },
    { key: "users", no: "02", label: "USERS" },
    { key: "solution", no: "03", label: "SOLUTION" },
    { key: "features", no: "04", label: "FEATURES" },
    { key: "technology", no: "05", label: "TECHNOLOGY" },
    { key: "challenges", no: "06", label: "CHALLENGES" },
    { key: "result", no: "07", label: "RESULT" },
  ];
  const accent = p.accent || "#4d7cff";
  let step = "problem";
  const m = openModal({
    title: `<div style="display:flex;align-items:center;gap:12px"><span style="display:grid;place-items:center;height:36px;width:36px;border-radius:8px;border:1px solid ${accent}55;background:${accent}1a;color:${accent};font-family:var(--font-display);font-size:11px;font-weight:700;flex-shrink:0">${escapeHtml(p.logo || p.name.slice(0, 2).toUpperCase())}</span><div style="min-width:0"><div class="truncate font-display" style="font-size:18px;font-weight:700;letter-spacing:-.01em;text-transform:uppercase">${escapeHtml(p.name)}</div><div class="truncate" style="font-size:12px;color:var(--mute)">${escapeHtml(p.tagline)}</div></div></div>`,
    size: "xl",
    footer: () => {}, // set below
  });
  const idx = () => STEPS.findIndex((s) => s.key === step);

  function car(label, tone, text) {
    const colors = { amber: "color:#fcd34d;border-color:rgba(251,191,36,.25)", accent: "color:#a9bcff;border-color:rgba(77,124,255,.25)", green: "color:var(--accent-3);border-color:rgba(47,214,180,.25)" };
    return `<div class="cs-car" style="${colors[tone]}"><div class="lbl">${label}</div><p>${escapeHtml(text)}</p></div>`;
  }
  function body() {
    const i = idx();
    if (step === "problem")
      return `<div class="cs-block anim-fadeup"><h4>The problem this platform addresses</h4><p style="font-size:15px;line-height:1.65;color:var(--mute)">${escapeHtml(p.problem)}</p>${category ? `<div style="margin-top:24px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:20px"><div class="mono-label" style="color:var(--accent);margin-bottom:12px">Category context</div><div class="font-display" style="font-weight:600;color:var(--paper);margin-bottom:8px">${escapeHtml(category.title)}</div><p style="font-size:14px;line-height:1.6;color:var(--mute);margin:0">${escapeHtml(category.description)}</p></div>` : ""}</div>`;
    if (step === "users")
      return `<div class="cs-block anim-fadeup"><h4>Who faces it</h4><p style="font-size:15px;line-height:1.65;color:var(--mute);margin-bottom:24px">These are the people the platform was designed around — each one uses it differently.</p><div class="field-grid field-grid--2">${p.users.map((u) => `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:14px 16px"><span style="display:grid;place-items:center;height:36px;width:36px;border-radius:8px;background:rgba(77,124,255,.12);color:var(--accent)">${icon("users", 17)}</span><span style="font-size:14px;font-weight:500;color:var(--paper)">${escapeHtml(u)}</span></div>`).join("")}</div></div>`;
    if (step === "solution")
      return `<div class="cs-block anim-fadeup"><h4>The solution</h4><p style="font-size:15px;line-height:1.65;color:var(--mute)">${escapeHtml(p.solution)}</p></div>`;
    if (step === "features")
      return `<div class="cs-block anim-fadeup"><h4>Implemented features</h4><p style="font-size:15px;line-height:1.65;color:var(--mute);margin-bottom:24px">Everything listed here exists in the deployed application.</p><div style="display:grid;gap:10px;grid-template-columns:repeat(2,1fr)">${p.features.map((f) => `<div style="display:flex;gap:10px;border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:12px 14px"><span style="color:var(--accent-3);margin-top:2px">${icon("check", 14)}</span><span style="font-size:13.5px;line-height:1.4;color:var(--paper)">${escapeHtml(f)}</span></div>`).join("")}</div>`;
    if (step === "technology")
      return `<div class="cs-block anim-fadeup"><h4>The technology</h4><div class="field-grid field-grid--2" style="grid-template-columns:repeat(3,1fr)">${p.tech.map((g) => `<div style="border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:20px"><div class="mono-label" style="color:var(--accent);margin-bottom:14px;display:flex;align-items:center;gap:8px">${icon("layers", 14)} ${escapeHtml(g.group)}</div><ul style="list-style:none;margin:0;padding:0">${g.items.map((it) => `<li style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--paper);margin-bottom:8px"><span style="height:4px;width:4px;border-radius:999px;background:var(--mute-2)"></span>${escapeHtml(it)}</li>`).join("")}</ul></div>`).join("")}</div>${(p.liveUrl || p.githubUrl) ? `<div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:12px">${p.liveUrl ? `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--ink-850);border-radius:8px;padding:10px 14px;font-family:var(--font-mono);font-size:12px;color:var(--mute)">${icon("globe", 14)} ${escapeHtml(prettyUrl(p.liveUrl))}</div>` : ""}${p.githubUrl ? `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--ink-850);border-radius:8px;padding:10px 14px;font-family:var(--font-mono);font-size:12px;color:var(--mute)">${icon("github", 14)} ${escapeHtml(prettyUrl(p.githubUrl))}</div>` : ""}</div>` : ""}</div>`;
    if (step === "challenges")
      return `<div class="cs-block anim-fadeup"><h4>Engineering challenges</h4><div style="display:flex;flex-direction:column;gap:14px">${p.challenges.map((c, ci) => `<div style="border:1px solid var(--line);background:var(--ink-850);border-radius:var(--r-md);padding:20px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><span class="font-mono" style="font-size:11px;color:var(--mute-2)">${String(ci + 1).padStart(2, "0")}</span><h5 class="font-display" style="font-size:16px;font-weight:600;color:var(--paper);margin:0">${escapeHtml(c.title)}</h5></div><div class="cs-3col">${car("Challenge", "amber", c.challenge)}${car("Approach", "accent", c.approach)}${car("Result", "green", c.result)}</div></div>`).join("")}</div></div>`;
    return `<div class="cs-block anim-fadeup"><h4>The result</h4><p style="font-size:15px;line-height:1.65;color:var(--mute)">${escapeHtml(p.result)}</p>${p.liveUrl ? `<div style="margin-top:28px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;border:1px solid rgba(77,124,255,.25);background:rgba(77,124,255,.06);border-radius:var(--r-md);padding:20px"><span class="badge badge--green">${escapeHtml(p.status)}</span><span style="font-size:14px;color:var(--mute)">Verify it yourself — the application is publicly reachable.</span><a class="btn btn--primary btn--sm" href="${normalizeUrl(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(p.name)} ${icon("external", 13)}</a></div>` : ""}</div>`;
  }
  function foot() {
    const i = idx();
    return `<div style="display:flex;flex-direction:column;gap:12px"><div class="font-mono" style="font-size:11px;letter-spacing:.1em;color:var(--mute-2)">${STEPS[i].no} / 07 — ${STEPS[i].label}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">
        <button class="btn btn--secondary btn--sm" data-prev ${i === 0 ? "disabled" : ""}>${icon("chevron", 13)} Previous</button>
        <button class="btn btn--sm" data-next style="background:var(--ink-800);border:1px solid var(--line);color:var(--paper)" ${i === STEPS.length - 1 ? "disabled" : ""}>Next ${icon("chevron", 13)}</button>
        ${p.liveUrl ? `<a class="btn btn--primary btn--sm" href="${normalizeUrl(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Open live app ${icon("external", 13)}</a>` : ""}
      </div></div>`;
  }
  function paint() {
    m.bodyEl.innerHTML = `<div class="cs-tabs">${STEPS.map((s) => `<button class="cs-tab ${s.key === step ? "active" : ""}" data-step="${s.key}"><span class="no">${escapeHtml(s.no)}</span> ${escapeHtml(s.label)}</button>`).join("")}</div>` + body();
    m.footEl.innerHTML = foot();
    m.footEl.style.display = "";
    m.bodyEl.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { step = b.getAttribute("data-step"); paint(); }));
    const prev = m.footEl.querySelector("[data-prev]"); const next = m.footEl.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", () => { const i = idx(); if (i > 0) { step = STEPS[i - 1].key; paint(); } });
    if (next) next.addEventListener("click", () => { const i = idx(); if (i < STEPS.length - 1) { step = STEPS[i + 1].key; paint(); } });
  }
  paint();
}

/* ---------------------------------------------------------- direct chat widget */
function initChat() {
  if (document.getElementById("gee-chat")) return;
  const host = document.createElement("div");
  host.id = "gee-chat";
  document.body.appendChild(host);
  let open = false;
  let nameVal = localStorage.getItem("gee.chat.name") || "";
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function paint() {
    const msgs = store.getMessages();
    const unread = msgs.filter((m) => m.role === "admin" && !m.visitorRead).length;
    if (!open) {
      host.innerHTML = `<button class="chat-fab" id="geeChatFab" aria-label="Open chat">${icon("mail", 22)}${unread ? `<span class="chat-fab__badge">${unread}</span>` : ""}</button>`;
      document.getElementById("geeChatFab").onclick = () => { open = true; store.markVisitorRead(); paint(); };
      return;
    }
    host.innerHTML = `
      <div class="chat-panel anim-scalein">
        <div class="chat-head">
          <div style="display:flex;align-items:center;gap:10px"><span class="chat-avatar">${icon("bolt", 16)}</span><div><div class="chat-title">Chat with GEE</div><div class="chat-sub">${unread ? "You have a new reply" : "Direct line to the team"}</div></div></div>
          <button class="chat-x" id="geeChatClose" aria-label="Close chat">${icon("plus", 16)}</button>
        </div>
        <div class="chat-body scroll-thin" id="geeChatBody"></div>
        <div class="chat-form">
          <input class="input chat-name" id="geeChatName" placeholder="Your name (optional)" value="${escapeHtml(nameVal)}" maxlength="60" />
          <div class="chat-input-row">
            <textarea class="input chat-text" id="geeChatText" rows="1" placeholder="Type a message…"></textarea>
            <button class="btn btn--primary btn--sm" id="geeChatSend">${icon("arrow", 16)}</button>
          </div>
        </div>
      </div>`;
    const body = document.getElementById("geeChatBody");
    body.innerHTML = msgs.length
      ? msgs.map((m) => m.role === "visitor"
        ? `<div class="bubble bubble--me"><div class="bubble__text">${escapeHtml(m.text)}</div><div class="bubble__meta">${escapeHtml(m.name)} · ${fmtTime(m.at)}</div></div>`
        : `<div class="bubble bubble--them"><div class="bubble__name">GEE</div><div class="bubble__text">${escapeHtml(m.text)}</div><div class="bubble__meta">${fmtTime(m.at)}</div></div>`).join("")
      : `<div class="chat-empty">Send a message — it appears directly on the GEE admin dashboard, and any reply shows up here.</div>`;
    body.scrollTop = body.scrollHeight;
    document.getElementById("geeChatClose").onclick = () => { open = false; paint(); };
    const nameInput = document.getElementById("geeChatName");
    nameInput.oninput = () => { nameVal = nameInput.value; localStorage.setItem("gee.chat.name", nameVal); };
    const text = document.getElementById("geeChatText");
    const send = () => { const v = text.value.trim(); if (!v) return; store.sendMessage(v, nameVal || "Visitor"); text.value = ""; paint(); };
    document.getElementById("geeChatSend").onclick = send;
    text.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
    setTimeout(() => text.focus(), 50);
  }

  window.GEE = window.GEE || {};
  window.GEE.openChat = () => { open = true; store.markVisitorRead(); paint(); };
  window.addEventListener("storage", (e) => { if (e.key === "gee.data.v1") paint(); });
  paint();
}

/* ---------------------------------------------------------- mount */
export function mountSite(root) {
  const pub = getPublic();
  root.innerHTML =
    navbar("home") +
    hero(pub) +
    about(pub) +
    problem(pub) +
    audience(pub) +
    projects(pub) +
    technology(pub) +
    engineering(pub) +
    defence(pub) +
    finalCta(pub) +
    contact(pub) +
    footer(pub);

  // reveal observer
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // nav scrolled state
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // scroll spy
  const spy = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) {
      const id = visible[0].target.id;
      root.querySelectorAll(".nav-link, .mobile-link").forEach((l) => {
        l.classList.toggle("active", l.getAttribute("data-scroll") === id);
      });
    }
  }, { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.5] });
  NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) spy.observe(el); });

  // global click delegation
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  root.addEventListener("click", (e) => {
    const scroll = e.target.closest("[data-scroll]");
    if (scroll) { e.preventDefault(); scrollTo(scroll.getAttribute("data-scroll")); mobileMenu.classList.add("hidden"); document.body.style.overflow = ""; return; }
    const cs = e.target.closest("[data-cs]");
    if (cs) { openCaseStudy(cs.getAttribute("data-cs")); return; }
    if (e.target.closest("#burger")) { mobileMenu.classList.toggle("hidden"); return; }
    if (e.target.closest("[data-open-chat]")) { e.preventDefault(); if (window.GEE && window.GEE.openChat) window.GEE.openChat(); return; }
  });

  wireProcess(pub);

  initChat();
}
