export const config = {
  matcher: "/",
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname === "brent.zlapp.app") {
    const dest = new URL("/sites/brent/index.html", url.origin);
    return new Response(null, {
      headers: {
        "x-middleware-rewrite": dest.toString(),
      },
    });
  }
}
