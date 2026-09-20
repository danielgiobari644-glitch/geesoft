============================================================
 GIOBARI DANIEL — PERSONAL PORTFOLIO (HTML + CSS + JS + Firebase)
============================================================

WHAT THIS IS
------------
A complete, production-ready personal portfolio:
public one-page site + case-study views + secure admin dashboard,
all dynamically rendered from Firestore. No frameworks — just
HTML, CSS and vanilla JavaScript, with Firebase via CDN.

FILES (flat — keep them together in one folder)
-----------------------------------------------
index.html          Public portfolio page
style.css           Public styles
script.js           Public application (renders from Firestore)
admin.html          Admin dashboard (login-protected)
admin.css           Admin styles
admin.js            Admin application (auth + CRUD)
firebase-config.js  Firebase initialization (already configured)
sample-data.js      Default content used on first run + seeding
firestore.rules     Firestore security rules (deploy these!)
README.txt          This file

FIRST-RUN SETUP (about 5 minutes)
---------------------------------
1. FIREBASE CONSOLE
   - The Firebase project is already configured in
     firebase-config.js (project: giobari-daniel).
   - In the console: Build -> Firestore Database -> Create database
     (production mode is fine).
   - Build -> Authentication -> Sign-in method -> enable "Email/Password".
   - Authentication -> Users -> Add user: create YOUR admin account
     (email + password). This is the account you sign into /admin with.
   - Firestore -> Rules: replace the rules with the contents of
     firestore.rules (included) and click Publish.

2. PUT THE SITE ONLINE
   The site must be served over HTTP(S) — opening index.html straight
   from disk will not work with Firebase Auth.
   Easiest option (matches the included config):
     - Firebase Hosting:
         npm i -g firebase-tools
         firebase login
         firebase init hosting   (choose existing project "giobari-daniel",
                                  public directory = this folder, no SPA rewrite)
         firebase deploy
     - Or drag the folder into Netlify / Cloudflare Pages / Vercel.

   OPTIONAL: to use the clean URL /admin instead of /admin.html, add a
   rewrite in firebase.json:
     "rewrites": [ { "source": "/admin", "destination": "/admin.html" } ]

3. SIGN IN AND SEED
   - Open /admin.html (or /admin) and sign in with the account from step 1.
   - The dashboard shows a short "Getting started" checklist.
   - Click "Load sample content" to create editable sample projects and
     services, or start adding your own right away.
   - Open Settings and press "Save settings" once — this switches the
     public site from built-in sample mode to your live Firestore data.

HOW THE SITE DECIDES WHAT TO SHOW
---------------------------------
- Until a settings document exists (and content is in Firestore), the
  public site shows clearly marked SAMPLE content so it never looks
  broken. Every sample is tagged "Sample" and fully replaceable.
- After you save settings in the dashboard, the site reads everything
  live from Firestore: projects, services, skills, testimonials,
  contact info, socials, theme, SEO text.

MANAGING CONTENT (no code needed)
---------------------------------
- Projects: add / edit / delete, publish or unpublish, feature,
  reorder, categories, gallery, case-study fields, live + GitHub links.
- Services, Skills, Testimonials: full CRUD with ordering.
- Messages: contact form submissions arrive live; mark read/unread,
  reply by email, delete. The public can never read other messages.
- Settings: name, hero, about, contact details, all social links,
  theme (dark/light + accent color), SEO, footer.
- Images are pasted as externally hosted URLs (Cloudinary, Imgur, your
  hosting, etc). Firebase Storage is intentionally NOT used.

TESTING LOCALLY
---------------
Run a tiny local server from this folder, then open the printed URL:
    python3 -m http.server 8080
    (visit http://localhost:8080 and http://localhost:8080/admin.html)

SECURITY NOTES
--------------
- The admin view is gated by Firebase Authentication in code AND by
  Firestore rules — hiding it with CSS alone would never be enough.
- Keep the admin password private. Only you should have a user account.
- Contact messages are validated on write and readable only when signed in.

CUSTOM DOMAIN / SEO
-------------------
- Replace the canonical URL placeholder in index.html with your real
  domain once you have one, and set your SEO title/description/social
  image in Settings.
