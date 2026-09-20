/* ============================================================
   Giobari Daniel — Portfolio · Shared sample content & defaults
   Used for: (a) first-run fallback rendering when Firestore has
   no settings/content yet, and (b) the "Seed sample content"
   action in the admin dashboard. All sample items are clearly
   marked and fully replaceable from the admin dashboard.
   ============================================================ */

/* Categories that belong to the Visual Design portfolio section */
export const VISUAL_CATEGORIES = ["Graphic Design", "Branding", "Media"];

export const ALL_CATEGORIES = [
  "Software", "Websites", "Web Apps", "Church", "School",
  "Business", "Community", "Graphic Design", "Branding", "Media", "Other"
];

/* ---------- Default settings (used until saved from /admin) ---------- */
export const DEFAULT_SETTINGS = {
  name: "Giobari Daniel",
  title: "Creative Technologist • Software Developer • Web Developer • Digital Designer",
  availability: "",
  heroHeading: "I build software, websites and digital experiences that turn ideas into reality.",
  heroDescription:
    "I create practical digital solutions — websites, software, web applications, graphic announcements and creative digital experiences for people, schools, businesses, churches and organizations.",
  ctaPrimary: "View My Work",
  ctaSecondary: "Start a Project",
  aboutHeading: "I work at the intersection of technology, design and creativity.",
  aboutText:
    "I enjoy taking an idea and turning it into something people can actually use — whether that means building software, developing a website, creating an online platform, designing a church announcement, producing a promotional graphic, or shaping a complete digital experience for an organization.\n\nMy goal is simple: take ideas, solve problems and build things that are useful, functional and visually compelling. I don't only write code — I take ideas from first sketch to finished product, combining technology, design and problem-solving at every step.",
  contactHeading: "Have an idea that needs to become real?",
  contactSub: "Let's build it.",
  contactNote: "Tell me a little about your idea and I'll get back to you.",
  email: "",
  phone: "",
  whatsapp: "",
  socials: { instagram: "", tiktok: "", telegram: "", youtube: "", github: "", linkedin: "", whatsapp: "", x: "" },
  otherLinks: [],
  profileImage: "",
  logoUrl: "",
  faviconUrl: "",
  seoTitle: "Giobari Daniel — Software Developer, Web Developer & Digital Designer",
  seoDescription:
    "I build software, websites and digital experiences that turn ideas into reality — practical digital solutions and visual design for people, schools, businesses, churches and organizations.",
  seoImage: "",
  footerText: "Designed and built by me — technology, design and creativity working together.",
  theme: { mode: "dark", accent: "#E9A23B" }
};

/* Merge stored settings over defaults so missing fields stay sensible */
export function mergeSettings(stored) {
  const s = stored || {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    socials: { ...DEFAULT_SETTINGS.socials, ...(s.socials || {}) },
    otherLinks: Array.isArray(s.otherLinks) ? s.otherLinks : [],
    theme: { ...DEFAULT_SETTINGS.theme, ...(s.theme || {}) }
  };
}

/* =====================================================================
   Hand-drawn SVG cover art (data URIs) for sample projects.
   These look like intentional design mockups instead of fake photos,
   and they keep the sample site lightweight with zero external calls.
   ===================================================================== */
const CV = {
  bg1: "#141724", bg2: "#0A0B0F", panel: "#161A28", bar: "#1C2130",
  ink: "#F2F2EF", muted: "#A0A3B0", accent: "#E9A23B", accent2: "#E97E4C"
};

function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function gridLines(w, h, step) {
  let out = "";
  for (let x = step; x < w; x += step) out += `<line x1='${x}' y1='0' x2='${x}' y2='${h}'/>`;
  for (let y = step; y < h; y += step) out += `<line x1='0' y1='${y}' x2='${w}' y2='${y}'/>`;
  return `<g stroke='rgba(255,255,255,0.045)'>${out}</g>`;
}

function wrap(inner, w, h) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${inner}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function bgDef(w, h, id) {
  return `<defs><linearGradient id='${id}' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='${CV.bg1}'/><stop offset='1' stop-color='${CV.bg2}'/>
  </linearGradient></defs><rect width='${w}' height='${h}' fill='url(#${id})'/>`;
}

/* Browser-window style cover for software / website projects */
export function coverBrowser(o) {
  const w = 1200, h = 800;
  return wrap(`${bgDef(w, h, "b")}
    ${gridLines(w, h, 96)}
    <circle cx='1030' cy='130' r='290' fill='${CV.accent}' fill-opacity='0.07'/>
    <rect x='80' y='140' width='1040' height='580' rx='16' fill='${CV.panel}' stroke='rgba(255,255,255,0.10)'/>
    <path d='M96 156 h1008 a16 16 0 0 1 16 16 v24 h-1040 v-24 a16 16 0 0 1 16-16 z' fill='${CV.bar}'/>
    <circle cx='114' cy='176' r='6' fill='#3A4052'/>
    <circle cx='136' cy='176' r='6' fill='#3A4052'/>
    <circle cx='158' cy='176' r='6' fill='${CV.accent}'/>
    <rect x='700' y='164' width='390' height='25' rx='12.5' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.08)'/>
    <text x='722' y='181' font-family='Courier New, monospace' font-size='13' fill='#8A8D99'>${esc(o.tag || "")}</text>
    <rect x='130' y='290' width='64' height='8' rx='4' fill='${CV.accent}'/>
    <text x='130' y='412' font-family='Arial, Helvetica, sans-serif' font-size='74' font-weight='700' fill='${CV.ink}'>${esc(o.title || "")}</text>
    <text x='130' y='466' font-family='Arial, Helvetica, sans-serif' font-size='28' fill='${CV.muted}'>${esc(o.sub || "")}</text>
    <rect x='130' y='530' width='272' height='140' rx='12' fill='rgba(255,255,255,0.05)'/>
    <rect x='152' y='556' width='96' height='12' rx='6' fill='${CV.accent}' fill-opacity='0.9'/>
    <rect x='152' y='584' width='200' height='10' rx='5' fill='rgba(255,255,255,0.14)'/>
    <rect x='152' y='606' width='160' height='10' rx='5' fill='rgba(255,255,255,0.10)'/>
    <rect x='426' y='530' width='272' height='140' rx='12' fill='rgba(255,255,255,0.04)'/>
    <rect x='448' y='556' width='72' height='12' rx='6' fill='rgba(255,255,255,0.22)'/>
    <rect x='448' y='584' width='210' height='10' rx='5' fill='rgba(255,255,255,0.12)'/>
    <rect x='448' y='606' width='140' height='10' rx='5' fill='rgba(255,255,255,0.09)'/>
    <rect x='722' y='530' width='368' height='140' rx='12' fill='rgba(255,255,255,0.05)'/>
    <rect x='744' y='556' width='120' height='12' rx='6' fill='${CV.accent2}' fill-opacity='0.85'/>
    <rect x='744' y='584' width='240' height='10' rx='5' fill='rgba(255,255,255,0.12)'/>
    <rect x='744' y='606' width='180' height='10' rx='5' fill='rgba(255,255,255,0.09)'/>`, w, h);
}

/* Portrait typographic poster cover for announcement / flyer designs */
export function coverPoster(o) {
  const w = 1200, h = 800, a = o.accent || CV.accent;
  return wrap(`${bgDef(w, h, "p")}
    ${gridLines(w, h, 96)}
    <circle cx='160' cy='660' r='230' fill='${a}' fill-opacity='0.06'/>
    <rect x='365' y='60' width='470' height='680' rx='8' fill='#0D0F16' stroke='rgba(255,255,255,0.14)'/>
    <rect x='590' y='120' width='20' height='88' rx='4' fill='${a}'/>
    <rect x='562' y='146' width='76' height='18' rx='4' fill='${a}'/>
    <text x='600' y='272' text-anchor='middle' font-family='Courier New, monospace' font-size='17' letter-spacing='5' fill='${CV.muted}'>${esc(o.kicker || "")}</text>
    <text x='600' y='404' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='88' font-weight='700' letter-spacing='2' fill='${CV.ink}'>${esc(o.l1 || "")}</text>
    <text x='600' y='496' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='88' font-weight='700' letter-spacing='2' fill='${a}'>${esc(o.l2 || "")}</text>
    <rect x='470' y='546' width='260' height='2' fill='rgba(255,255,255,0.16)'/>
    <text x='600' y='606' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='24' fill='${CV.muted}'>${esc(o.meta || "")}</text>
    <text x='600' y='690' text-anchor='middle' font-family='Courier New, monospace' font-size='14' letter-spacing='4' fill='rgba(255,255,255,0.28)'>${esc(o.foot || "GIOBARI DANIEL — DESIGN")}</text>`, w, h);
}

/* Brand-board style cover for branding projects */
export function coverBrand(o) {
  const w = 1200, h = 800, a = o.accent || CV.accent;
  return wrap(`${bgDef(w, h, "br")}
    ${gridLines(w, h, 96)}
    <circle cx='300' cy='330' r='118' fill='none' stroke='${a}' stroke-width='10'/>
    <g transform='translate(300 330)' stroke='${CV.ink}' stroke-width='7' stroke-linecap='round'>
      <line x1='0' y1='-58' x2='0' y2='58'/><line x1='-58' y1='0' x2='58' y2='0'/>
      <line x1='-41' y1='-41' x2='41' y2='41'/><line x1='41' y1='-41' x2='-41' y2='41'/>
    </g>
    <text x='620' y='380' font-family='Arial, Helvetica, sans-serif' font-size='210' font-weight='700' fill='${CV.ink}'>Aa</text>
    <text x='628' y='448' font-family='Courier New, monospace' font-size='18' letter-spacing='3' fill='${CV.muted}'>TYPE SPECIMEN</text>
    <rect x='620' y='520' width='96' height='96' rx='18' fill='${a}'/>
    <rect x='740' y='520' width='96' height='96' rx='18' fill='${CV.ink}'/>
    <rect x='860' y='520' width='96' height='96' rx='18' fill='#3A4052'/>
    <rect x='980' y='520' width='96' height='96' rx='18' fill='${CV.panel}' stroke='rgba(255,255,255,0.16)'/>
    <text x='130' y='600' font-family='Arial, Helvetica, sans-serif' font-size='40' font-weight='700' fill='${CV.ink}'>${esc(o.title || "")}</text>
    <text x='130' y='644' font-family='Arial, Helvetica, sans-serif' font-size='22' fill='${CV.muted}'>${esc(o.sub || "")}</text>`, w, h);
}

/* Square social-post mockup cover for media / promotional design */
export function coverSocial(o) {
  const w = 1100, h = 1000, a = o.accent || CV.accent;
  return wrap(`${bgDef(w, h, "s")}
    ${gridLines(w, h, 92)}
    <rect x='398' y='70' width='304' height='620' rx='36' fill='#0D0F16' stroke='rgba(255,255,255,0.16)'/>
    <rect x='416' y='88' width='268' height='584' rx='24' fill='${CV.panel}'/>
    <circle cx='456' cy='128' r='16' fill='${a}'/>
    <rect x='482' y='118' width='110' height='9' rx='4.5' fill='rgba(255,255,255,0.25)'/>
    <rect x='482' y='134' width='70' height='7' rx='3.5' fill='rgba(255,255,255,0.12)'/>
    <rect x='432' y='168' width='236' height='220' rx='14' fill='${a}'/>
    <text x='550' y='266' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='34' font-weight='700' fill='#17110A'>${esc(o.headline || "")}</text>
    <rect x='448' y='412' width='180' height='11' rx='5.5' fill='rgba(255,255,255,0.16)'/>
    <rect x='448' y='436' width='140' height='11' rx='5.5' fill='rgba(255,255,255,0.11)'/>
    <rect x='448' y='486' width='76' height='26' rx='13' fill='${CV.accent2}'/>
    <g fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='6'>
      <rect x='432' y='560' width='26' height='26' rx='7'/><rect x='494' y='560' width='26' height='26' rx='7'/><rect x='556' y='560' width='26' height='26' rx='7'/>
    </g>
    <rect x='96' y='150' width='230' height='60' rx='16' fill='${CV.panel}' stroke='rgba(255,255,255,0.14)'/>
    <text x='118' y='187' font-family='Courier New, monospace' font-size='17' letter-spacing='2' fill='${CV.muted}'>FEED POST</text>
    <rect x='120' y='700' width='230' height='60' rx='16' fill='${CV.panel}' stroke='rgba(255,255,255,0.14)'/>
    <text x='142' y='737' font-family='Courier New, monospace' font-size='17' letter-spacing='2' fill='${CV.muted}'>STORY</text>
    <rect x='760' y='240' width='230' height='60' rx='16' fill='${CV.panel}' stroke='rgba(255,255,255,0.14)'/>
    <text x='782' y='277' font-family='Courier New, monospace' font-size='17' letter-spacing='2' fill='${CV.muted}'>${esc(o.tag || "SOCIAL SET")}</text>
    <text x='120' y='918' font-family='Arial, Helvetica, sans-serif' font-size='30' font-weight='700' fill='${CV.ink}'>${esc(o.title || "")}</text>
    <text x='120' y='956' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='${CV.muted}'>${esc(o.sub || "")}</text>`, w, h);
}

/* =====================================================================
   Sample projects (clearly marked). Used for first-run fallback and
   for the admin "Seed sample content" action. Replace with real work.
   ===================================================================== */
const SAMPLE_NOTE = "Sample case study — replace this section with the real story and results from your admin dashboard.";

export const SAMPLE_PROJECTS = [
  {
    id: "home-cell", slug: "home-cell", title: "Home.cell", category: "Web Apps",
    year: "2025", client: "Home.cell Fellowship", sample: true,
    featured: true, published: true, order: 1,
    description: "A fellowship and community platform — members, events, announcements and resources in one simple online home.",
    overview: "Home.cell is a digital home for a fellowship community. I built it so members could find everything about the community in one place — upcoming events, announcements, resources and ways to stay connected — without depending on scattered chat groups.",
    problem: "Community information lived in too many places. Announcements got buried in chat threads, newcomers did not know what was happening, and leaders had no simple way to share updates, events and resources.",
    solution: "I designed a focused platform around three things: clear announcements, an easy event calendar and a simple resource library. No clutter and no friction — just the information the community needs, presented cleanly on any device.",
    whatIBuilt: "I designed and developed the platform from the ground up — the interface, the layout system and the connected admin side leaders use to post announcements and events. I focused on usability, responsiveness and a smooth experience across phones, tablets and laptops.",
    features: "Member-friendly homepage with the latest announcements\nEvent calendar with details and highlights\nResource library for materials and downloads\nSimple admin tools for community leaders\nFast, mobile-first experience",
    designNotes: "I created the visual direction myself — a calm, welcoming layout with clear typography, generous spacing and a structure that makes weekly updates effortless to read.",
    results: SAMPLE_NOTE,
    technologies: ["HTML", "CSS", "JavaScript", "Firebase"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrowser({ title: "Home.cell", sub: "Fellowship and community platform", tag: "homecell · web app" }),
    gallery: [coverBrowser({ title: "Home.cell", sub: "Announcements and events view", tag: "homecell · events" })]
  },
  {
    id: "geedrops", slug: "geedrops", title: "Geedrops", category: "Web Apps",
    year: "2025", client: "", sample: true,
    featured: false, published: true, order: 2,
    description: "A sharing and social platform where people post, discover and share content with a community.",
    overview: "Geedrops is a social sharing platform I built for posting and discovering content. The idea was simple: give people a lightweight space to drop what they are working on, what they love and what they want others to see.",
    problem: "Existing social platforms are heavy, noisy and full of distractions. The community needed something simpler — a place focused purely on sharing and discovering.",
    solution: "A clean, feed-first experience. I kept the interface light and fast: post, browse, react and share, without the noise. The layout puts content first and keeps navigation to a minimum.",
    whatIBuilt: "I built the full front-end experience and connected it to a real-time backend — authentication, posting, feeds and interactions. The whole app is responsive and works smoothly on slow connections.",
    features: "Simple posting flow\nReal-time content feed\nUser accounts and profiles\nReactions and interactions\nMobile-first responsive design",
    designNotes: "I designed a playful but controlled visual language — bold type for content, soft surfaces for reading and just enough color to keep the feed feeling alive.",
    results: SAMPLE_NOTE,
    technologies: ["JavaScript", "Firebase", "HTML", "CSS"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrowser({ title: "Geedrops", sub: "Sharing and social platform", tag: "geedrops · web app" }),
    gallery: [coverBrowser({ title: "Geedrops", sub: "Feed and discovery view", tag: "geedrops · feed" })]
  },
  {
    id: "church-digital-home", slug: "church-digital-home", title: "Church Digital Home", category: "Church",
    year: "2024", client: "", sample: true,
    featured: false, published: true, order: 3,
    description: "A church website and media hub — services, announcements, events and media for the congregation.",
    overview: "A complete online home for a church community. The site welcomes visitors, shares what the church is about, and keeps members informed with announcements, service times, events and media.",
    problem: "The church had no central place online. Visitors could not find service times or contact details, and members relied on word of mouth for events and updates.",
    solution: "I built a welcoming, easy-to-navigate website with a clear structure: welcome, announcements, events, media and contact — content the church team can keep fresh without technical help.",
    whatIBuilt: "I designed and developed the website end to end — the visual identity, the page layouts and the announcement and event sections — and made sure it stays beautiful and readable on every device.",
    features: "Welcome and about pages\nWeekly announcements\nEvent information\nMedia and messages section\nContact and location details",
    designNotes: "Church design should feel warm, not corporate. I used soft color, strong headlines and large readable text to create a calm, inviting feel.",
    results: SAMPLE_NOTE,
    technologies: ["HTML", "CSS", "JavaScript", "Firebase"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrowser({ title: "Church Online", sub: "Church website and media hub", tag: "church · website" }),
    gallery: [coverBrowser({ title: "Church Online", sub: "Announcements page", tag: "church · announcements" })]
  },
  {
    id: "school-portal", slug: "school-portal", title: "School Portal", category: "School",
    year: "2024", client: "", sample: true,
    featured: false, published: true, order: 4,
    description: "A school website and information portal — announcements, academic info and resources for students and parents.",
    overview: "A digital front door for a school. Students and parents get one reliable place for announcements, term dates and important information — instead of chasing notice boards and printouts.",
    problem: "School communication often misses people. Parents asked the same questions repeatedly because information was scattered and hard to find when needed.",
    solution: "A clear, structured portal with prioritized announcements, an academic calendar section and resource pages. I made sure it works well on low-end phones and slow networks, since that is how many parents browse.",
    whatIBuilt: "I designed the information architecture, built the responsive front end and set up the content structure so school updates stay organized and easy to publish.",
    features: "Announcement board\nTerm calendar\nResource downloads\nContact channels\nLightweight, fast pages",
    designNotes: "Simple and trustworthy — a clean layout with strong section hierarchy, so the newest and most important information always comes first.",
    results: SAMPLE_NOTE,
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrowser({ title: "School Portal", sub: "School website and information hub", tag: "school · web app" }),
    gallery: [coverBrowser({ title: "School Portal", sub: "Announcements board", tag: "school · board" })]
  },
  {
    id: "business-website", slug: "business-website", title: "Business Website", category: "Business",
    year: "2024", client: "", sample: true,
    featured: false, published: true, order: 5,
    description: "A modern business website with a strong first impression, clear services and a simple contact flow.",
    overview: "A website for a business that needed to look credible online and turn visitors into enquiries — a professional home to point every customer to.",
    problem: "The business relied only on referrals and social media. There was no professional place online that explained what they do and made contacting them easy.",
    solution: "A focused site experience: who they are, what they offer, proof of work and an easy way to reach them — nothing more, nothing buried.",
    whatIBuilt: "I handled everything — structure, content layout, visual design and development — and optimized the pages for quick loading and comfortable mobile browsing.",
    features: "Hero and services presentation\nPortfolio highlights\nTestimonial-ready sections\nSimple contact form\nSEO-friendly structure",
    designNotes: "Confident and minimal — generous whitespace, one accent color and clear calls to action, so the business feels established and easy to trust.",
    results: SAMPLE_NOTE,
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrowser({ title: "Studio Site", sub: "Modern business website", tag: "business · website" }),
    gallery: [coverBrowser({ title: "Studio Site", sub: "Services and contact pages", tag: "business · pages" })]
  },
  {
    id: "sunday-service-series", slug: "sunday-service-series", title: "Sunday Service Series", category: "Graphic Design",
    year: "2025", client: "", sample: true,
    featured: true, published: true, order: 6,
    description: "A weekly church announcement design series — bold, warm and instantly readable.",
    overview: "A recurring set of announcement graphics for weekly church services — designed to be readable at a glance on phones and clear on projectors.",
    problem: "Church announcements often feel rushed and cluttered. They needed designs that feel welcoming and stay legible even on the smallest screens.",
    solution: "A consistent template system: strong typography, generous spacing and a warm accent palette, with clear room for the essentials — what, when and where.",
    whatIBuilt: "I designed the full series — layouts, typography and color system — as ready-to-post graphics for social media and screens.",
    features: "Weekly service announcements\nSpecial event editions\nSocial-media-ready sizes\nProjector-friendly contrast",
    designNotes: "I built the series around a typographic grid — one hero line, one supporting line, one call to action. Every week stays fresh but recognizably part of the same family.",
    results: SAMPLE_NOTE,
    technologies: ["Graphic Design", "Church Media"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverPoster({ kicker: "YOU ARE INVITED", l1: "SUNDAY", l2: "SERVICE", meta: "EVERY WEEK · 10:00 AM" }),
    gallery: [
      coverPoster({ kicker: "YOU ARE INVITED", l1: "SUNDAY", l2: "SERVICE", meta: "EVERY WEEK · 10:00 AM", accent: "#E97E4C" }),
      coverPoster({ kicker: "SPECIAL EDITION", l1: "THANKS", l2: "GIVING", meta: "A NIGHT OF GRATITUDE", accent: "#7FB069" })
    ]
  },
  {
    id: "event-flyer-pack", slug: "event-flyer-pack", title: "Event Flyer Pack", category: "Graphic Design",
    year: "2025", client: "", sample: true,
    featured: false, published: true, order: 7,
    description: "Promotional flyers for events — bold type, strong hierarchy, built for sharing.",
    overview: "A pack of promotional designs for community events — made to be shared on WhatsApp and Instagram and clear enough to print.",
    problem: "Event promotions often miss the basics: date, time and venue get lost in decoration, and people scroll past.",
    solution: "Designs with an unmissable information hierarchy — the essentials first, atmosphere second, everything within one glance.",
    whatIBuilt: "I designed the flyer set across sizes and formats — square posts, story versions and print-ready layouts — all from one consistent visual system.",
    features: "Main event flyer\nStory-size versions\nWhatsApp-friendly exports\nPrint-ready layout",
    designNotes: "I used oversized display type and tight spacing to create energy, with a restrained palette so the event details always lead.",
    results: SAMPLE_NOTE,
    technologies: ["Graphic Design", "Promotion"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverPoster({ kicker: "COMMUNITY EVENT", l1: "YOUTH", l2: "NIGHT", meta: "MUSIC · GAMES · FRIENDS", accent: "#E9A23B" }),
    gallery: [coverPoster({ kicker: "COMMUNITY EVENT", l1: "YOUTH", l2: "NIGHT", meta: "MUSIC · GAMES · FRIENDS", accent: "#6FA8DC" })]
  },
  {
    id: "brand-starter-kit", slug: "brand-starter-kit", title: "Brand Starter Kit", category: "Branding",
    year: "2025", client: "", sample: true,
    featured: false, published: true, order: 8,
    description: "A compact brand identity kit — logo direction, palette and typography system.",
    overview: "A starter identity for a brand that needed to look consistent everywhere online — one kit that makes every post, banner and document feel related.",
    problem: "The brand used different colors, fonts and styles on every platform, so nothing felt connected and nothing was memorable.",
    solution: "One kit: a simple mark, a disciplined color palette and a type pairing, plus practical templates for posts and banners.",
    whatIBuilt: "I designed the identity elements and assembled them into a practical kit — easy to apply, hard to break.",
    features: "Logo direction\nColor palette\nTypography pairing\nSocial templates\nBanner layouts",
    designNotes: "I kept the identity flexible enough for social media but strict enough to stay recognizable at a glance.",
    results: SAMPLE_NOTE,
    technologies: ["Branding", "Design"],
    liveUrl: "", githubUrl: "",
    thumbnail: coverBrand({ title: "Brand Kit", sub: "Logo, palette and type system" }),
    gallery: [coverBrand({ title: "Brand Kit", sub: "Mark, palette and type", accent: "#E97E4C" })]
  }
];

export const SAMPLE_SERVICES = [
  { id: "software-development", title: "Software Development", icon: "code", order: 1, published: true,
    description: "I build custom digital solutions around specific needs, workflows and ideas." },
  { id: "website-development", title: "Website Development", icon: "globe", order: 2, published: true,
    description: "I create modern, responsive websites for businesses, organizations, churches, schools and individuals." },
  { id: "web-applications", title: "Web Applications", icon: "layers", order: 3, published: true,
    description: "I build interactive platforms, dashboards, portals, community systems and custom web applications." },
  { id: "graphic-media-design", title: "Graphic & Media Design", icon: "pen", order: 4, published: true,
    description: "I create professional announcements, event graphics, social media visuals, church media, promotional designs and other digital graphics." },
  { id: "digital-branding", title: "Digital Branding", icon: "award", order: 5, published: true,
    description: "I create logos, visual identity materials, banners, promotional designs and digital brand assets." },
  { id: "custom-solutions", title: "Custom Digital Solutions", icon: "spark", order: 6, published: true,
    description: "I turn specific problems and ideas into practical, technology-driven solutions." }
];

export const SAMPLE_SKILLS = [
  { id: "html", name: "HTML", category: "Development", order: 1, published: true },
  { id: "css", name: "CSS", category: "Development", order: 2, published: true },
  { id: "javascript", name: "JavaScript", category: "Development", order: 3, published: true },
  { id: "firebase", name: "Firebase", category: "Development", order: 4, published: true },
  { id: "web-development", name: "Web Development", category: "Development", order: 5, published: true },
  { id: "web-apps", name: "Web Applications", category: "Product", order: 6, published: true },
  { id: "software-dev", name: "Software Development", category: "Product", order: 7, published: true },
  { id: "responsive", name: "Responsive Design", category: "Product", order: 8, published: true },
  { id: "uiux", name: "UI/UX", category: "Product", order: 9, published: true },
  { id: "graphic-design", name: "Graphic Design", category: "Design", order: 10, published: true },
  { id: "digital-branding", name: "Digital Branding", category: "Design", order: 11, published: true },
  { id: "creative-direction", name: "Creative Direction", category: "Design", order: 12, published: true }
];

/* No sample testimonials — I never invent client quotes. Add real ones
   from the admin dashboard and this section will appear automatically. */
export const SAMPLE_TESTIMONIALS = [];

