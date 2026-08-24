/* ============================================================
   GEE — entry point & router (vanilla JS).
   Admin is reachable only by path (/admin) or hash (#admin) —
   never by a button on the public site.
   ============================================================ */
import { mountSite } from "./gee-site.js";
import { mountAdmin } from "./gee-admin.js";

const app = document.getElementById("app");

function isAdminRoute() {
  const path = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  if (path.endsWith("/admin")) return true;
  if (window.location.hash.toLowerCase().includes("admin")) return true;
  return false;
}

function render() {
  const admin = isAdminRoute();
  document.title = admin
    ? "GEE Admin — Content Operations"
    : "GEE — Building Digital Solutions for Real-World Problems";
  app.innerHTML = "";
  document.body.classList.toggle("is-admin", admin);
  window.scrollTo(0, 0);
  if (admin) mountAdmin(app);
  else mountSite(app);
}

window.addEventListener("popstate", render);
window.addEventListener("hashchange", render);
render();
