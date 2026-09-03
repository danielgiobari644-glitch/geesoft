# GeeSoft — Portfolio + Admin Console

Pure HTML, CSS and vanilla JavaScript. Firebase (Auth + Firestore) v12.18.0, loaded as ES modules from the CDN. No frameworks, no build step.

Completely flat — every file sits in the project root, no subfolders.

```
index.html          Public site — Hero, Introduction, Skills, Projects, Contact
styles.css          Public styles (fully responsive, 380px → 1650px+)
app.js              Public logic — live Firestore content, nav, reveals, project modal
content.js          Content schema + fallback copy (no fake projects/skills/contacts)
firebase.js         Shared Firebase init (your geesoft10 project)
admin.html          Private console (login + dashboard)
admin.css
admin.js
geesoft-logo.png    Official logo (unmodified)
favicon.png         Favicon derived from the logo mark
firestore.rules     Security rules — public read, admin-only write
```

## Run locally
Must be served over http (ES modules + Firebase):

```bash
python3 -m http.server 8080
```

- Public site: `http://localhost:8080/`
- Admin console: `http://localhost:8080/admin.html`  ← not linked anywhere on the public site

## One-time Firebase setup (required before login works)

1. Firebase console → project **geesoft10** → **Authentication → Sign-in method → Email/Password → Enable**.
2. **Authentication → Users → Add user** → your admin email + a strong password.
3. Copy that user's **UID**.
4. **Firestore Database** → create database (production mode) → add collection `admins` → document ID = the UID → field `role: "owner"`.
5. **Firestore → Rules** → paste the contents of `firestore.rules` → **Publish**.
6. **Authentication → Settings → Authorized domains** → add your deployment domain.

The admin password only ever exists inside Firebase Authentication. It is not in this repo, not in Firestore, and not in any client document.

## Firestore data model

```
content/settings      brandName, tagline, logoUrl, siteTitle, metaDescription,
                      footerText, copyright, builtBy, nav* labels
content/hero          eyebrow, headlineLine1/2, supporting, CTA text+links,
                      capabilities[], scrollLabel
content/intro         eyebrow, heading, lead, brand/person/value blocks, services[], cta
content/skillsMeta    eyebrow, heading, description
content/projectsMeta  eyebrow, heading, description, emptyText, defaultCtaText
content/contact       eyebrow, heading, description, email, phone, location,
                      availability, ctaText, formHeading, formNote, formEnabled, socials[]

skills/{id}    name, category, description, level, icon, iconText, order
projects/{id}  name, category, description, longDescription, technologies[],
               thumbnail, images[], projectUrl, githubUrl, ctaText,
               featured, published, order
```

Public pages subscribe with `onSnapshot`, so anything saved in the console appears on the live site immediately — no refresh, no redeploy.

## Admin console

Sections: Overview · Hero · Introduction · Skills · Projects · Contact · Site Settings · Account & Security.

- Full CRUD + arrow reordering for skills and projects.
- Project thumbnails and gallery images by **image URL** with a live preview (Firebase Storage is not used).
- Account & Security: change login email (`verifyBeforeUpdateEmail`), change password (`updatePassword`), both with real `reauthenticateWithCredential` re-auth, plus sign out and password-reset email.

## Notes

- No content is invented: contact details, socials, skills and projects start empty and are entered by you in the console.
- The contact form opens the visitor's mail client addressed to the email you configure — no third-party form service.
- Accessibility: skip link, semantic landmarks, visible focus rings, keyboard-trapped modal, aria-live status, `prefers-reduced-motion` respected.
- SEO: title, meta description, Open Graph + Twitter cards, favicon, single `h1`, ordered headings.
