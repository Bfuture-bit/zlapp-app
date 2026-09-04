export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

const UNLISTED_HOST = "nb-fait8h6d3a.zlapp.app";
const UNLISTED_PREFIX = "/sites/nb-fait8h6d3a";

function unlistedPath(pathname) {
  return pathname === UNLISTED_PREFIX || pathname.startsWith(`${UNLISTED_PREFIX}/`);
}

function notFound() {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/.well-known/acme-challenge")) {
    return;
  }
  if (url.hostname === UNLISTED_HOST) {
    if (unlistedPath(url.pathname)) {
      return;
    }
    let p = url.pathname || "/";
    if (p === "/" || p === "") p = "/index.html";
    else if (p.endsWith("/")) p += "index.html";
    const dest = new URL(UNLISTED_PREFIX + p, url.origin);
    dest.search = url.search;
    return new Response(null, {
      headers: { "x-middleware-rewrite": dest.toString() },
    });
  }
  if (unlistedPath(url.pathname)) {
    return notFound();
  }
  if (url.hostname === "brent.zlapp.app") {
    if (url.pathname === "/" || url.pathname === "") {
      const dest = new URL("/sites/brent/index.html", url.origin);
      return new Response(null, {
        headers: { "x-middleware-rewrite": dest.toString() },
      });
    }
    return;
  }
  if (url.hostname === "vqx.zlapp.app") {
    if (url.pathname.startsWith("/sites/vqx")) return;
    let p = url.pathname || "/";
    const extensionlessFiles = new Set(["/LICENSE", "/NOTICE"]);
    if (p === "/extensions/vqx/0.3" || p === "/extensions/vqx/0.3/") {
      p = "/extensions/vqx/0.3/index.json";
    } else if (extensionlessFiles.has(p)) {
      // Serve the file; do not treat LICENSE/NOTICE as directories.
    } else if (p === "/") p = "/index.html";
    else if (p.endsWith("/")) p += "index.html";
    else if (!p.split("/").pop().includes(".")) p += "/index.html";
    const dest = new URL("/sites/vqx" + p, url.origin);
    dest.search = url.search;
    return new Response(null, {
      headers: { "x-middleware-rewrite": dest.toString() },
    });
  }
}
