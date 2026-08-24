/* ============================================================
   GEE — data layer: seed content, store (localStorage), auth.
   Pure ES module, no framework. Swappable for Firestore.
   ============================================================ */

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------------------------------------------------------- seed content */
const now = Date.now();
export const seed = {
  version: 1,
  activity: [],
  messages: [],
  categories: [
    {
      id: "cat-education", order: 1, enabled: true, title: "Education", icon: "education",
      description: "Schools and learning environments where teaching, assessment and academic records are still handled through disconnected, largely manual processes.",
      users: ["Students", "Teachers", "School administrators", "Parents"],
      problems: ["Fragmented learning systems", "Manual academic processes", "Assessment challenges", "Poor access to resources", "Difficult performance tracking"],
      updatedAt: now,
    },
    {
      id: "cat-church", order: 2, enabled: true, title: "Church", icon: "church",
      description: "Churches and cell-based ministries that rely on scattered chat groups and offline notes to run communication, resources and group life.",
      users: ["Pastors", "Cell leaders", "Members", "Administrators"],
      problems: ["Fragmented communication", "Scattered resources", "Difficult group management", "Limited digital engagement"],
      updatedAt: now,
    },
    {
      id: "cat-community", order: 3, enabled: true, title: "Communities", icon: "community",
      description: "Community groups and organizations that need one organized place for announcements, membership information and coordinated activity.",
      users: ["Community leaders", "Members", "Administrators"],
      problems: ["Poor communication", "Disorganized information", "Difficulty coordinating activities"],
      updatedAt: now,
    },
    {
      id: "cat-cbt", order: 4, enabled: true, title: "CBT / Assessment", icon: "cbt",
      description: "Examination and assessment workflows that depend on paper, manual marking and spreadsheets to manage questions and results.",
      users: ["Schools", "Teachers", "Examination administrators", "Students"],
      problems: ["Manual examinations", "Slow marking", "Question management", "Performance tracking"],
      updatedAt: now,
    },
  ],
  projects: [
    {
      id: "prj-homecell", order: 1, published: true, name: "Home.cell", tagline: "Christian Community Platform",
      categoryId: "cat-church", status: "Live",
      description: "A digital platform designed to bring Christian community interaction, resources, communication and engagement into one organized environment.",
      problem: "Church and cell-group life is spread across several disconnected tools. Announcements live in one chat group, devotionals in another, study material is forwarded as files that get lost in message history, and attendance or group membership is tracked offline. Leaders repeat the same information many times, members miss it, and nothing is searchable later.",
      users: ["Pastors", "Cell leaders", "Members", "Administrators"],
      solution: "Home.cell puts the community feed, cell/group management, group chat, devotionals, Bible resources, events, testimonies and the resource centre inside one authenticated application. Leaders publish once and every member of the right group sees it. Engagement features such as quizzes, leaderboards and Kingdom Coins give members a reason to return, while the administration area lets leaders manage groups and content without touching code.",
      features: ["Community feed", "Cell/group management", "Group chat", "Devotionals", "Bible resources", "Events", "Testimonies", "Quizzes", "Leaderboards", "Kingdom Coins", "Resource center", "Administration"],
      tech: [
        { group: "Frontend", items: ["HTML", "CSS", "JavaScript"] },
        { group: "Backend", items: ["Firebase Authentication", "Firestore", "Realtime Database"] },
        { group: "Deployment", items: ["GitHub", "GitHub Pages"] },
      ],
      challenges: [
        { title: "Authentication & accounts", challenge: "Members needed private accounts so that the feed, chat and coin balances belonged to a real identity rather than an anonymous device.", approach: "Firebase Authentication handles sign-up and sign-in. The user record in Firestore is created on first login and every read/write is keyed to the authenticated UID.", result: "Each member has a persistent identity across devices, and content can be attributed and moderated." },
        { title: "Group chat in real time", challenge: "Cell conversation only works if messages appear immediately for everyone in the group.", approach: "Messages are streamed through Realtime Database / Firestore listeners so the UI subscribes to a group channel and re-renders as documents arrive, instead of polling.", result: "Group chat updates live for members of the same cell without a page refresh." },
        { title: "Roles & administration", challenge: "A member, a cell leader and an administrator must not see or be able to do the same things.", approach: "A role field is stored on each user document. The UI renders admin/leader controls conditionally and database rules validate the role before allowing writes.", result: "Administration screens and publishing actions are only reachable by the accounts entitled to them." },
        { title: "Engagement data (quizzes, leaderboard, coins)", challenge: "Quiz scoring, leaderboards and Kingdom Coins all read from the same activity data and had to stay consistent.", approach: "Scores are written once per attempt to the user document and the leaderboard is derived by ordered queries rather than a separately maintained table.", result: "Leaderboards and coin balances always reflect actual recorded activity — there is no second source of truth." },
      ],
      result: "A member can sign in, read the community feed, join their cell, chat with their group, open devotionals and Bible resources, see upcoming events, post a testimony, take a quiz, earn Kingdom Coins and appear on the leaderboard. Leaders can manage groups and publish content from the administration area. The application is live and open to anyone with the link.",
      liveUrl: "https://danielgiobari644.github.io/homecell",
      githubUrl: "https://github.com/danielgiobari644",
      logo: "HC", thumbnail: "", heroImage: "", screenshots: [], accent: "#8b6cff", updatedAt: now,
    },
    {
      id: "prj-edupreneur", order: 2, published: true, name: "Edupreneur", tagline: "Learning Management / Education Platform",
      categoryId: "cat-education", status: "Live",
      description: "A learning management platform that gives students, teachers and administrators one digital environment for courses, learning resources, assessment and progress.",
      problem: "Learning material, assessment and academic records rarely live in the same place. Notes are shared as loose files, tests are printed and marked by hand, and a student's progress only becomes visible at the end of a term. Teachers spend more time on administration than on teaching, and students have no single place to see what they must learn next.",
      users: ["Students", "Teachers / instructors", "School administrators"],
      solution: "Edupreneur organises learning into courses with structured content, gives instructors tools to publish material and set assessments, and gives students a personal learning space with resources, CBT-style assessment and progress tracking. Marking that used to be manual becomes automatic for objective questions, and results are recorded against the student instead of on paper.",
      features: ["Learning management", "Courses", "Student learning experience", "Teacher / instructor tools", "Assessments", "CBT (computer-based testing)", "Learning resources", "Progress tracking", "Academic records"],
      tech: [
        { group: "Frontend", items: ["HTML", "CSS", "JavaScript"] },
        { group: "Backend", items: ["Firebase Authentication", "Firestore"] },
        { group: "Deployment", items: ["Netlify", "GitHub"] },
      ],
      challenges: [
        { title: "CBT logic", challenge: "An examination is more than a form: questions must be served, answers captured, submission handled once, and results computed reliably.", approach: "Questions are stored as structured records. The client renders one attempt, tracks selected answers in state, submits the attempt as a single write and scores objective questions against the stored answer key.", result: "Students take assessments on screen and receive results from recorded submissions instead of manual marking." },
        { title: "Role management", challenge: "Students, instructors and administrators need very different views of the same course data.", approach: "Role is attached to the account at sign-up/assignment. Navigation, course actions and assessment authoring are gated per role in the UI and validated in the database rules.", result: "One codebase serves three audiences without exposing teacher or admin actions to students." },
        { title: "Database architecture", challenge: "Courses, lessons, resources, assessments, attempts and users are related, and a document database does not join for you.", approach: "Data is modelled as collections with predictable IDs and denormalised summary fields so a student dashboard can be assembled from a small number of queries.", result: "Dashboards load from few reads and progress can be tracked per student per course." },
        { title: "Responsive delivery", challenge: "Most students open the platform on a phone, but assessment interfaces are designed on desktop.", approach: "Layouts are fluid with mobile-first breakpoints; question and course views collapse to single-column with touch-sized controls.", result: "The same platform is usable in a computer lab and on a phone." },
      ],
      result: "Students can access courses and learning resources, take assessments online and follow their own progress. Instructors can publish course material and set assessments. Administrators get academic activity in one system rather than in files and paper. The platform is live at edupreneur.space/z.ai.",
      liveUrl: "https://edupreneur.space/z.ai",
      githubUrl: "", logo: "ED", thumbnail: "", heroImage: "", screenshots: [], accent: "#2fd6b4", updatedAt: now,
    },
  ],
  platforms: [
    { id: "plt-homecell", order: 1, visible: true, name: "Home.cell", category: "Church / Christian Community Platform", url: "https://danielgiobari644.github.io/homecell", description: "Live Christian community platform — feed, cells, chat, devotionals, resources and engagement.", icon: "HC", buttonLabel: "OPEN HOME.CELL", updatedAt: now },
    { id: "plt-edupreneur", order: 2, visible: true, name: "Edupreneur", category: "Education / LMS / School Technology", url: "https://edupreneur.space/z.ai", description: "Live learning management platform — courses, resources, assessment, CBT and progress tracking.", icon: "ED", buttonLabel: "OPEN EDUPRENEUR", updatedAt: now },
  ],
  contact: {
    email: "danielgiobari644@gmail.com", phone: "", whatsapp: "", telegram: "", instagram: "", tiktok: "",
    github: "https://github.com/danielgiobari644", youtube: "", location: "Available for remote work with schools, churches and organizations",
    cta: "Have a problem worth solving? Describe it — the next project usually starts with a conversation.",
    extra: [], updatedAt: now,
  },
  content: {
    hero: {
      label: "GEE / SOFTWARE DEVELOPMENT",
      heading: "I BUILD DIGITAL SOLUTIONS FOR REAL-WORLD PROBLEMS.",
      supporting: "From schools and LMS platforms to churches, communities and CBT systems, GEE transforms real-world problems into practical digital experiences.",
      cta1: "Explore Projects", cta2: "View My Work",
    },
    about: {
      heading: "WHO I AM",
      intro: "I am a software developer. GEE is the brand I build under — a technology practice focused on producing working digital platforms for schools, churches, communities, learning and examination systems.",
      philosophy: "I don't build software simply for the sake of building software. Every project I ship started as a problem somebody actually described to me, not as a design I wanted to try.",
      bullets: [
        "A problem — stated in plain language before any code exists.",
        "The people affected — who they are and how they currently cope.",
        "Their requirements — what the software must genuinely do.",
        "A practical solution — the smallest system that solves it properly.",
        "The technology required to deliver it — chosen to fit, not to impress.",
      ],
      skills: [
        { name: "HTML", note: "Semantic, accessible structure" },
        { name: "CSS", note: "Responsive layout systems" },
        { name: "JavaScript", note: "Application logic & state" },
        { name: "Firebase Authentication", note: "Accounts, sessions, access" },
        { name: "Firestore", note: "Document data modelling" },
        { name: "Realtime Database", note: "Live, streaming data" },
        { name: "Git & GitHub", note: "Version control & delivery" },
        { name: "Netlify / GitHub Pages", note: "Deployment & hosting" },
      ],
    },
    problem: {
      heading: "EVERY PROJECT STARTS WITH A PROBLEM.",
      body: "GEE is not a design studio that decorates ideas. The work begins with a problem statement and ends with software people actually use. A beautiful application that solves nothing is a failed project; a plain application that removes real friction is a successful one. Everything between the problem and the impact is engineering.",
      chain: ["PROBLEM", "PEOPLE", "REQUIREMENTS", "SOLUTION", "DEVELOPMENT", "IMPACT"],
    },
    process: [
      { id: "st-1", no: "01", title: "IDENTIFY", summary: "Understand the problem.", detail: "Write the problem in one sentence without mentioning technology. If it cannot be written that way, it is not understood yet." },
      { id: "st-2", no: "02", title: "RESEARCH", summary: "Understand the users.", detail: "Talk to the people living with the problem — leaders, teachers, students, members — and record how they cope today and what they will not tolerate." },
      { id: "st-3", no: "03", title: "DESIGN", summary: "Design the experience and the architecture.", detail: "Map screens and user journeys, then model the data: collections, documents, relationships and the roles that may read or write them." },
      { id: "st-4", no: "04", title: "DEVELOP", summary: "Build the application.", detail: "Build feature by feature against real data: authentication first, then core flows, then the supporting features around them." },
      { id: "st-5", no: "05", title: "TEST", summary: "Identify and fix issues.", detail: "Test each role separately, on desktop and phone, including the failure paths: wrong password, empty state, lost connection, double submission." },
      { id: "st-6", no: "06", title: "DEPLOY", summary: "Make the solution available.", detail: "Ship to a public URL through GitHub Pages or Netlify so real users can reach it — a project that is not deployed is not finished." },
      { id: "st-7", no: "07", title: "IMPROVE", summary: "Iterate and improve the product.", detail: "Watch how the software is really used, fix what breaks, and add only what users ask for repeatedly." },
    ],
    challenges: [
      { title: "Authentication", challenge: "Users need private accounts, and content must belong to a verified identity — not to a browser.", approach: "Firebase Authentication manages sign-up, sign-in and sessions. A user document is created on first login and every subsequent read and write is scoped to the authenticated UID.", result: "Accounts persist across devices and every action in the application can be attributed to a real user." },
      { title: "Database Architecture", challenge: "Document databases don't join. Poor modelling turns one screen into dozens of reads and makes features slow to build.", approach: "Data is modelled per screen: predictable collection and document IDs, denormalised summary fields for dashboards, and nested collections only where ownership is genuinely hierarchical.", result: "Dashboards and feeds assemble from a small number of queries, and new features reuse the existing shape." },
      { title: "Responsive Design", challenge: "Most users open these platforms on a phone, but complex admin and assessment screens are designed on desktop.", approach: "Mobile-first fluid layouts with a single spacing and type scale. Tables collapse into cards, navigation becomes a drawer, and controls are sized for touch.", result: "The same interface works in a computer lab, on a tablet and on a phone with no horizontal overflow." },
      { title: "Role Management", challenge: "Members, leaders, teachers and administrators need different permissions over the same data.", approach: "A role field on the user document drives conditional rendering in the UI, while database security rules independently validate the role on every write.", result: "Privileged actions are unreachable from the interface and rejected by the backend if attempted directly." },
      { title: "Real-Time Features", challenge: "Group chat and feeds are useless if users must refresh to see new content.", approach: "Screens subscribe to database listeners instead of polling; incoming documents update local state and the UI re-renders only the affected list.", result: "Messages and new posts appear as they are written, for every member of the group." },
      { title: "CBT Logic", challenge: "Examinations must serve questions, capture answers, accept one submission and produce trustworthy results.", approach: "Questions are stored as structured records with an answer key. An attempt is tracked in client state, submitted as a single write, then scored server-side against the key and stored against the student.", result: "Objective assessments are marked automatically and results are traceable back to the recorded submission." },
    ],
    defence: {
      heading: "THE DEFENCE",
      questions: [
        { id: "df-1", no: "01", question: "WHO AM I?", answer: "A software developer building practical digital solutions through GEE — platforms for schools, churches, communities, learning and examinations." },
        { id: "df-2", no: "02", question: "WHAT IS THE PROBLEM?", answer: "Real institutions and communities experience fragmented, inefficient or manual processes: information scattered across chat groups and paper, work repeated by hand, and no reliable record of what happened." },
        { id: "df-3", no: "03", question: "WHO FACES IT?", answer: "Schools, students, teachers, churches, pastors, cell leaders, members, administrators, organizations and communities." },
        { id: "df-4", no: "04", question: "WHAT IS THE SOLUTION?", answer: "Purpose-built digital platforms designed around real user needs, deployed to public URLs and used by the people who described the problem." },
      ],
      chain: ["PROBLEM", "PEOPLE", "SOLUTION", "TECHNOLOGY", "IMPACT"],
    },
    finalCta: { heading: "THE NEXT PROBLEM IS THE NEXT PROJECT.", text: "GEE turns meaningful problems into useful technology." },
    footer: {
      description: "GEE develops practical digital platforms for schools, churches, communities, learning, examination systems and organizations.",
      note: "Building Digital Solutions for Real-World Problems.",
    },
    updatedAt: now,
  },
};

/* ---------------------------------------------------------- store */
const DATA_KEY = "gee.data.v1";
let data = loadData();
const listeners = new Set();

function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.projects)) { if (!Array.isArray(p.messages)) p.messages = []; return p; }
    }
  } catch (e) { /* ignore */ }
  return clone(seed);
}
function persist() {
  try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
}
function emit() { listeners.forEach((fn) => fn(data)); }
function log(action, target) {
  data.activity = [{ id: uid(), at: Date.now(), action, target }, ...data.activity].slice(0, 30);
}
function reorder(list, id, dir) {
  const sorted = [...list].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return list;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  return sorted.map((x, k) => ({ ...x, order: k + 1 }));
}
function mutate(fn) { fn(); persist(); emit(); }

export const getData = () => data;
export const store = {
  getData,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  saveProject(p) {
    mutate(() => {
      const exists = data.projects.some((x) => x.id === p.id);
      if (exists) data.projects = data.projects.map((x) => (x.id === p.id ? { ...p, updatedAt: Date.now() } : x));
      else data.projects = [...data.projects, { ...p, order: data.projects.length + 1, updatedAt: Date.now() }];
      log(exists ? "Updated project" : "Created project", p.name);
    });
  },
  deleteProject(id) {
    mutate(() => {
      const p = data.projects.find((x) => x.id === id);
      data.projects = data.projects.filter((x) => x.id !== id);
      log("Deleted project", p ? p.name : id);
    });
  },
  toggleProjectPublished(id) {
    mutate(() => {
      data.projects = data.projects.map((x) => {
        if (x.id !== id) return x;
        log(x.published ? "Unpublished project" : "Published project", x.name);
        return { ...x, published: !x.published, updatedAt: Date.now() };
      });
    });
  },
  moveProject(id, dir) { mutate(() => { data.projects = reorder(data.projects, id, dir); }); },

  saveCategory(c) {
    mutate(() => {
      const exists = data.categories.some((x) => x.id === c.id);
      if (exists) data.categories = data.categories.map((x) => (x.id === c.id ? { ...c, updatedAt: Date.now() } : x));
      else data.categories = [...data.categories, { ...c, order: data.categories.length + 1, updatedAt: Date.now() }];
      log(exists ? "Updated category" : "Created category", c.title);
    });
  },
  deleteCategory(id) {
    mutate(() => {
      const c = data.categories.find((x) => x.id === id);
      data.categories = data.categories.filter((x) => x.id !== id);
      log("Deleted category", c ? c.title : id);
    });
  },
  toggleCategory(id) {
    mutate(() => { data.categories = data.categories.map((x) => (x.id === id ? { ...x, enabled: !x.enabled, updatedAt: Date.now() } : x)); });
  },
  moveCategory(id, dir) { mutate(() => { data.categories = reorder(data.categories, id, dir); }); },

  savePlatform(p) {
    mutate(() => {
      const exists = data.platforms.some((x) => x.id === p.id);
      if (exists) data.platforms = data.platforms.map((x) => (x.id === p.id ? { ...p, updatedAt: Date.now() } : x));
      else data.platforms = [...data.platforms, { ...p, order: data.platforms.length + 1, updatedAt: Date.now() }];
      log(exists ? "Updated platform" : "Created platform", p.name);
    });
  },
  deletePlatform(id) {
    mutate(() => {
      const p = data.platforms.find((x) => x.id === id);
      data.platforms = data.platforms.filter((x) => x.id !== id);
      log("Deleted platform", p ? p.name : id);
    });
  },
  togglePlatform(id) {
    mutate(() => { data.platforms = data.platforms.map((x) => (x.id === id ? { ...x, visible: !x.visible, updatedAt: Date.now() } : x)); });
  },
  movePlatform(id, dir) { mutate(() => { data.platforms = reorder(data.platforms, id, dir); }); },

  saveContact(c) { mutate(() => { data.contact = { ...c, updatedAt: Date.now() }; log("Updated", "Contact details"); }); },
  saveContent(c) { mutate(() => { data.content = { ...c, updatedAt: Date.now() }; log("Updated", "Website content"); }); },

  /* direct chat: public site visitor <-> admin dashboard */
  getMessages() { if (!Array.isArray(data.messages)) data.messages = []; return data.messages; },
  sendMessage(text, name) {
    mutate(() => {
      if (!Array.isArray(data.messages)) data.messages = [];
      data.messages.push({ id: uid(), role: "visitor", text: String(text).slice(0, 2000), name: (name || "Visitor").slice(0, 60), at: Date.now(), adminRead: false, visitorRead: true });
      log("New message", name || "Visitor");
    });
  },
  replyMessage(text) {
    mutate(() => {
      if (!Array.isArray(data.messages)) data.messages = [];
      data.messages.push({ id: uid(), role: "admin", text: String(text).slice(0, 2000), name: "GEE", at: Date.now(), adminRead: true, visitorRead: false });
    });
  },
  markAdminRead() {
    if (!Array.isArray(data.messages) || !data.messages.some((m) => m.role === "visitor" && !m.adminRead)) return;
    mutate(() => { data.messages.forEach((m) => { if (m.role === "visitor") m.adminRead = true; }); });
  },
  markVisitorRead() {
    if (!Array.isArray(data.messages) || !data.messages.some((m) => m.role === "admin" && !m.visitorRead)) return;
    mutate(() => { data.messages.forEach((m) => { if (m.role === "admin") m.visitorRead = true; }); });
  },
  deleteMessage(id) { mutate(() => { data.messages = data.messages.filter((m) => m.id !== id); }); },
  clearMessages() { mutate(() => { data.messages = []; }); },

  resetAll() { data = clone(seed); persist(); emit(); },
  exportJson() { return JSON.stringify(data, null, 2); },
  importJson(raw) {
    try {
      const p = JSON.parse(raw);
      if (!p.projects || !p.content || !p.contact) return { ok: false, error: "Invalid GEE data file." };
      data = p; persist(); emit();
      return { ok: true };
    } catch (e) { return { ok: false, error: "Could not parse JSON." }; }
  },
};

/** Public-facing derived data. */
export function getPublic() {
  const d = store.getData();
  const projects = d.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
  const categories = d.categories.filter((c) => c.enabled).sort((a, b) => a.order - b.order);
  const platforms = d.platforms.filter((p) => p.visible).sort((a, b) => a.order - b.order);
  const map = new Map();
  for (const p of projects) {
    for (const g of p.tech) {
      if (!map.has(g.group)) map.set(g.group, new Map());
      const inner = map.get(g.group);
      for (const it of g.items) { if (!inner.has(it)) inner.set(it, new Set()); inner.get(it).add(p.name); }
    }
  }
  const techStack = [...map.entries()].map(([group, items]) => ({
    group,
    items: [...items.entries()].map(([name, used]) => ({ name, usedIn: [...used] })),
  }));
  return { projects, categories, platforms, techStack, contact: d.contact, content: d.content };
}

/* ---------------------------------------------------------- auth (PBKDF2) */
const CRED_KEY = "gee.admin.credential.v1";
const SESSION_KEY = "gee.admin.session.v1";
const ITERATIONS = 210000;
const SESSION_TTL = 1000 * 60 * 60 * 8;
const enc = new TextEncoder();

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function randomB64(len = 16) { const a = new Uint8Array(len); crypto.getRandomValues(a); return toB64(a.buffer); }

async function derive(password, saltB64, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations, hash: "SHA-256" },
    key, 256,
  );
  return toB64(bits);
}
function ctEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function getCredential() {
  try { const raw = localStorage.getItem(CRED_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
export function isProvisioned() { return getCredential() !== null; }
export function validatePassword(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

export async function provisionAdmin(email, password) {
  if (isProvisioned()) return { ok: false, error: "An administrator account already exists on this device." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };
  const salt = randomB64(16);
  const hash = await derive(password, salt, ITERATIONS);
  localStorage.setItem(CRED_KEY, JSON.stringify({ email: email.trim().toLowerCase(), salt, hash, iterations: ITERATIONS, createdAt: Date.now(), lastLogin: null }));
  return { ok: true };
}

export async function signIn(email, password) {
  const cred = getCredential();
  if (!cred) return { ok: false, error: "No administrator account has been provisioned." };
  const hash = await derive(password, cred.salt, cred.iterations);
  if (email.trim().toLowerCase() !== cred.email || !ctEqual(hash, cred.hash)) return { ok: false, error: "Invalid credentials." };
  cred.lastLogin = Date.now();
  localStorage.setItem(CRED_KEY, JSON.stringify(cred));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: cred.email, issuedAt: Date.now(), expiresAt: Date.now() + SESSION_TTL, token: randomB64(24) }));
  return { ok: true };
}

export async function changePassword(current, next) {
  const cred = getCredential();
  if (!cred) return { ok: false, error: "No administrator account." };
  const curHash = await derive(current, cred.salt, cred.iterations);
  if (!ctEqual(curHash, cred.hash)) return { ok: false, error: "Current password is incorrect." };
  const pwErr = validatePassword(next);
  if (pwErr) return { ok: false, error: pwErr };
  const salt = randomB64(16);
  const hash = await derive(next, salt, ITERATIONS);
  localStorage.setItem(CRED_KEY, JSON.stringify({ ...cred, salt, hash, iterations: ITERATIONS }));
  return { ok: true };
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch (e) { return null; }
}
export function signOut() { sessionStorage.removeItem(SESSION_KEY); }
