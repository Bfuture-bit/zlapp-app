import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "exhibition.json"), "utf8")
);
const satellites = JSON.parse(
  fs.readFileSync(path.join(root, "data", "satellites.json"), "utf8")
);

const artifactsDir = path.join(root, "site", "public", "artifacts");
const previewsDir = path.join(root, "site", "public", "previews");
const siteDataDir = path.join(root, "site", "src", "data");
fs.mkdirSync(artifactsDir, { recursive: true });
fs.mkdirSync(previewsDir, { recursive: true });
fs.mkdirSync(siteDataDir, { recursive: true });
fs.copyFileSync(
  path.join(root, "data", "exhibition.json"),
  path.join(siteDataDir, "exhibition.json")
);

function stripMarkdownFence(html) {
  let out = html.replace(/^\uFEFF/, "");
  out = out.replace(/^```html\s*\r?\n/i, "");
  out = out.replace(/\r?\n```\s*$/i, "");
  return out;
}

function svgPreview(work, model) {
  const [bg, a, b] = work.palette;
  const title = work.title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const modelName = model.name.replace(/&/g, "&amp;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="${title}">
  <rect width="1200" height="750" fill="${bg}"/>
  <circle cx="180" cy="140" r="220" fill="${a}" opacity="0.14"/>
  <circle cx="980" cy="620" r="280" fill="${b}" opacity="0.12"/>
  <circle cx="640" cy="300" r="160" fill="${a}" opacity="0.08"/>
  <rect x="64" y="64" width="1072" height="622" fill="none" stroke="${b}" stroke-opacity="0.18" stroke-width="1"/>
  <text x="88" y="120" fill="${b}" fill-opacity="0.55" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" letter-spacing="4">${modelName.toUpperCase()}</text>
  <text x="88" y="400" fill="${b}" font-family="Georgia, 'Iowan Old Style', serif" font-size="54">${title}</text>
  <text x="88" y="640" fill="${a}" fill-opacity="0.7" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" letter-spacing="3">${work.publicSlug}</text>
</svg>
`;
}

for (const work of manifest.works) {
  const src = path.join(root, work.sourceFile);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing original: ${work.sourceFile}`);
  }
  let html = fs.readFileSync(src, "utf8");
  if (work.servedEdit === "strip-markdown-fence") {
    html = stripMarkdownFence(html);
  }
  fs.writeFileSync(path.join(artifactsDir, `${work.publicSlug}.html`), html);

  const model = manifest.models.find((m) => m.id === work.model);
  fs.writeFileSync(
    path.join(previewsDir, `${work.publicSlug}.svg`),
    svgPreview(work, model)
  );
}

const rewrites = [];
for (const work of manifest.works) {
  const host = `${work.publicSlug}.zlapp.app`;
  rewrites.push(
    {
      source: "/",
      has: [{ type: "host", value: host }],
      destination: `/x/${work.publicSlug}`,
    },
    {
      source: "/play",
      has: [{ type: "host", value: host }],
      destination: `/x/${work.publicSlug}/play`,
    },
    {
      source: "/raw",
      has: [{ type: "host", value: host }],
      destination: `/artifacts/${work.publicSlug}.html`,
    }
  );
}

const exhibitHosts = new Set(manifest.works.map((work) => `${work.publicSlug}.zlapp.app`));
for (const site of satellites.sites) {
  if (exhibitHosts.has(site.host)) {
    throw new Error(`Satellite host collides with an exhibit: ${site.host}`);
  }
  const dest = site.publicPath;
  // Host rewrite of `/` must target an *external* URL. Same-origin rewrites
  // to `/` lose to Astro's generated index.html on Vercel.
  // VQX homepage adds a version query so a stale 0.2 edge cache cannot
  // keep winning after 0.3 is deployed.
  const homeDest =
    site.id === "vqx"
      ? `https://zlapp.app${dest}?vqx=0.3`
      : `https://zlapp.app${dest}`;
  rewrites.push({
    source: "/",
    has: [{ type: "host", value: site.host }],
    destination: homeDest,
  });
  // Apex /vqx is a 301 to the VQX host (see redirects). Do not also rewrite
  // it to a second machine tree on zlapp.app.
  if (site.apexPath && site.id !== "vqx") {
    rewrites.push({
      source: site.apexPath,
      destination: dest,
    });
  }
  if (site.id === "vqx") {
    rewrites.push(
      {
        source: "/.well-known/vqx.json",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/.well-known/vqx.json",
      },
      {
        source: "/.well-known/vqx-rc2.json",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/.well-known/vqx-rc2.json",
      },
      {
        source: "/.well-known/security.txt",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/.well-known/security.txt",
      },
      {
        source: "/extensions/vqx/0.3/index.json",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/extensions/vqx/0.3/index.json",
      },
      {
        source: "/LICENSE",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/LICENSE",
      },
      {
        source: "/NOTICE",
        has: [{ type: "host", value: site.host }],
        destination: "https://zlapp.app/sites/vqx/NOTICE",
      }
    );
  }
  if (site.rewriteTree) {
    rewrites.push({
      source: "/:path*",
      has: [{ type: "host", value: site.host }],
      destination: `https://zlapp.app/sites/${site.id}/:path*`,
    });
  }
}

const vercel = {
  headers: [
    {
      source: "/artifacts/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400" },
        { key: "X-Robots-Tag", value: "noindex" },
      ],
    },
    {
      source: "/research/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    },
    {
      source: "/agent-glyphs/(.*)\\.(gif|png|json|csv)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400" },
      ],
    },
    {
      source: "/agent-glyphs2/(.*)\\.(gif|png|json|svg)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400" },
      ],
    },
    {
      source: "/(.*)",
      headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }],
    },
    {
      source: "/.well-known/vqx.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Content-Type", value: "application/json; charset=utf-8" },
      ],
    },
    {
      source: "/.well-known/vqx-rc2.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Content-Type", value: "application/json; charset=utf-8" },
      ],
    },
    {
      source: "/rc2/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
      ],
    },
    {
      source: "/.well-known/security.txt",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Content-Type", value: "text/plain; charset=utf-8" },
      ],
    },
    {
      source: "/extensions/vqx/0.3/index.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Content-Type", value: "application/json; charset=utf-8" },
      ],
    },
    {
      source: "/sites/vqx/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "max-age=0, must-revalidate" },
      ],
    },
  ],
  redirects: [
    {
      source: "/agent-glyphs",
      destination: "/agent-glyphs/",
      permanent: true,
    },
    {
      source: "/research/vqx-rc2",
      destination: "/research/vqx-rc2/",
      permanent: true,
    },
    {
      source: "/rc2",
      has: [{ type: "host", value: "vqx.zlapp.app" }],
      destination: "/rc2/",
      permanent: true,
    },
    {
      source: "/agent-glyphs2/",
      destination: "/agent-glyphs2",
      permanent: true,
    },
    {
      source: "/vqx",
      destination: "https://vqx.zlapp.app/",
      permanent: true,
    },
    {
      source: "/vqx/:path*",
      destination: "https://vqx.zlapp.app/:path*",
      permanent: true,
    },
    {
      source: "/.well-known/vqx.json",
      has: [{ type: "host", value: "zlapp.app" }],
      destination: "https://vqx.zlapp.app/.well-known/vqx.json",
      permanent: true,
    },
    {
      source: "/.well-known/vqx-rc2.json",
      has: [{ type: "host", value: "zlapp.app" }],
      destination: "https://vqx.zlapp.app/.well-known/vqx-rc2.json",
      permanent: true,
    },
    {
      source: "/.well-known/llms.txt",
      destination: "/llms.txt",
      permanent: true,
    },
  ],
  rewrites,
};

fs.writeFileSync(
  path.join(root, "site", "vercel.json"),
  JSON.stringify(vercel, null, 2)
);

console.log(
  `Prepared ${manifest.works.length} artifacts and previews, ${satellites.sites.length} satellite host(s).`
);
