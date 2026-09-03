// GeeSoft — content schema + fallback defaults.
// These are ONLY used before/until the administrator saves content in Firestore.
// No fake projects, skills, testimonials, stats or contact details are defined here.

export const DEFAULTS = {
  settings: {
    siteTitle: "GeeSoft — Software, Websites & Custom Web Applications",
    metaDescription:
      "GeeSoft, founded by Giobari Daniel, builds software, websites, custom web applications and responsive digital experiences. Smart solutions. Real impact.",
    brandName: "GeeSoft",
    tagline: "Build • Create • Empower",
    logoUrl: "geesoft-logo.png",
    footerText: "GeeSoft — Smart Solutions. Real Impact.",
    copyright: "© " + new Date().getFullYear() + " GeeSoft. All rights reserved.",
    builtBy: "Designed & built by Giobari Daniel",
    navHome: "Home",
    navIntro: "Introduction",
    navSkills: "Skills",
    navProjects: "Projects",
    navContact: "Contact"
  },

  hero: {
    eyebrow: "GeeSoft — Giobari Daniel",
    headlineLine1: "Smart Solutions.",
    headlineLine2: "Real Impact.",
    supporting:
      "GeeSoft designs and engineers software, websites and custom web applications — fast, responsive and built to a professional standard.",
    primaryCtaText: "View My Work",
    primaryCtaLink: "#projects",
    secondaryCtaText: "Let's Work Together",
    secondaryCtaLink: "#contact",
    capabilities: [
      "Web Development",
      "Image Editing",
      "Web App Creation",
      "Easy Backend Services"
    ],
    scrollLabel: "Scroll to explore"
  },

  intro: {
    eyebrow: "Introduction",
    heading: "The brand, and the developer behind it.",
    lead:
      "GeeSoft is a technology studio focused on building clean, dependable digital products. Every project is designed, built and delivered with the same standard of care.",
    brandHeading: "GeeSoft",
    brandText:
      "GeeSoft builds software, websites, custom web applications, professional portfolio websites and responsive web experiences — practical products that solve real problems and look genuinely premium.",
    personHeading: "Giobari Daniel",
    personText:
      "Founder and developer of GeeSoft. Giobari Daniel works end-to-end: interface design, front-end engineering and backend integration, turning an idea into a working product that people can actually use.",
    valueHeading: "The value I provide",
    valueText:
      "Clear communication, thoughtful design, maintainable code and a finished product that performs well on every screen size.",
    services: [
      "Software",
      "Websites",
      "Custom Web Applications",
      "Portfolio Websites",
      "Responsive Websites",
      "Custom Digital Solutions"
    ],
    ctaText: "Start a project",
    ctaLink: "#contact"
  },

  skillsMeta: {
    eyebrow: "Skills",
    heading: "Capabilities I bring to every build.",
    description:
      "A focused technical toolkit covering interface, engineering and delivery."
  },

  projectsMeta: {
    eyebrow: "Featured Projects",
    heading: "Selected work.",
    description:
      "Real projects built by GeeSoft. Open a project to read the full case study.",
    emptyText:
      "Featured projects are being prepared and will appear here shortly.",
    defaultCtaText: "View Project"
  },

  contact: {
    eyebrow: "Contact",
    heading: "Let's Build Something Great",
    description:
      "Tell me what you want to build. I'll reply with a clear plan, a timeline and an honest recommendation.",
    email: "",
    phone: "",
    location: "",
    availability: "",
    ctaText: "Send an email",
    formEnabled: true,
    formHeading: "Send a message",
    formNote: "I typically reply within one business day.",
    socials: [] // [{label, url}]
  }
};

// Deep-ish merge: Firestore value wins when present and non-empty.
export function merge(defaults, remote) {
  const out = Array.isArray(defaults) ? [...defaults] : { ...defaults };
  if (!remote || typeof remote !== "object") return out;
  for (const k of Object.keys(remote)) {
    const v = remote[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) out[k] = v;
    else if (typeof v === "object") out[k] = merge(defaults[k] || {}, v);
    else if (v !== "" || typeof defaults[k] === "undefined") out[k] = v;
    else out[k] = v; // allow admin to intentionally blank a field
  }
  return out;
}
