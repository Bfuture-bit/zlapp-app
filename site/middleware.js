export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/.well-known/acme-challenge")) {
    return;
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
    if (p === "/rc2") {
      return Response.redirect(new URL("/rc2/", url), 308);
    }
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
