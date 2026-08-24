/*
 * GEE build — dependency-free (plain Node, no Vite, no bundler, no TypeScript).
 *
 * The site is authored as small ES modules for clarity. This script produces a
 * single, self-contained dist/index.html by:
 *   1. concatenating the scripts in dependency order,
 *   2. stripping ES module `import` / `export` syntax so they execute as one
 *      classic <script>,
 *   3. resolving the two cross-file identifier collisions (clone, NAV) so the
 *      combined script never redeclares them,
 *   4. inlining the local stylesheet.
 */
const fs = require("fs");
const path = require("path");

const ORDER = ["gee-data.js", "gee-ui.js", "gee-site.js", "gee-admin.js", "gee-app.js"];

function stripModule(src, file) {
  let s = src;
  s = s.replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*/g, ""); // drop imports
  s = s.replace(/\bexport\s+(async\s+)?/g, "$1"); // drop the export keyword
  if (file === "gee-admin.js") {
    // the only two names also declared in other files — rename to avoid redeclaration
    s = s.replace(/\bclone\b/g, "cloneObj").replace(/\bNAV\b/g, "ADMIN_NAV");
  }
  return s;
}

const js = ORDER.map((f) => stripModule(fs.readFileSync(f, "utf8"), f)).join("\n;\n");

let html = fs.readFileSync("index.html", "utf8");

// inline local stylesheets; leave external (fonts) untouched
html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/g, (m) => {
  const href = (m.match(/href=["']([^"']+)["']/) || [])[1];
  if (!href || /^https?:\/\//.test(href) || !fs.existsSync(href)) return m;
  return "<style>\n" + fs.readFileSync(href, "utf8") + "\n</style>";
});

// inline the (first) local <script src> as the whole bundle; drop the rest
let injected = false;
html = html.replace(/<script[^>]*\ssrc=["']([^"']+)["'][^>]*><\/script>/g, (m, src) => {
  if (/^https?:\/\//.test(src) || !fs.existsSync(src)) return m;
  if (!injected) { injected = true; return "<script>\n" + js + "\n</script>"; }
  return "";
});

fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync(path.join("dist", "index.html"), html);
console.log("Built dist/index.html (" + Math.round(html.length / 1024) + " KB)");
