#!/usr/bin/env python3
"""GeeSoft local dev server.

Serves the flat project and maps the clean path /admin -> admin.html,
matching the rewrite used in production (Firebase Hosting / Vercel / Apache).

    python3 serve.py            # http://localhost:8080
    python3 serve.py 3000       # custom port
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0].rstrip("/")
        if path == "/admin":
            self.path = "/admin.html"
        return super().do_GET()

    def end_headers(self):
        if self.path.startswith("/admin"):
            self.send_header("X-Robots-Tag", "noindex, nofollow, noarchive")
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"GeeSoft  →  http://localhost:{port}/        (public site)")
    print(f"Console  →  http://localhost:{port}/admin   (private)")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
