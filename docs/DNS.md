# Connecting zlapp.app to Vercel

Project: [brent-alone/zlapp-app](https://vercel.com/brent-alone/zlapp-app)  
Live now: https://zlapp-app.vercel.app  
Domains attached: `zlapp.app`, `www.zlapp.app`, `*.zlapp.app`

Root directory is `site`. Framework is Astro.

The records below were read from this project’s Vercel domain card on 16 August 2026. If the dashboard later shows different values, use the dashboard.

## Namecheap DNS

Registrar: Namecheap, domain `zlapp.app`. Nameservers can stay as Namecheap (`dns1.registrar-servers.com` / `dns2.registrar-servers.com`).

Open **Domain List → zlapp.app → Advanced DNS**.

Remove any old A / CNAME / URL-redirect records for `@`, `www`, or `*` that still point at previous hosting.

Add these records:

| Type | Host | Value | TTL |
|---|---|---|---|
| **A** | `@` | `216.198.79.1` | Automatic |
| **A** | `@` | `64.29.17.1` | Automatic |
| **CNAME** | `www` | `4d8d7de639915175.vercel-dns-017.com.` | Automatic |
| **CNAME** | `*` | `4d8d7de639915175.vercel-dns-017.com.` | Automatic |

Do not put a CNAME on `@`. Apex domains use the two A records.

After saving, Vercel will issue SSL when the records propagate. Check with:

```text
npx vercel domains verify zlapp.app
npx vercel domains verify www.zlapp.app
npx vercel domains verify "*.zlapp.app"
```

## 4. Confirm

After DNS propagates (often minutes, sometimes a few hours):

```text
nslookup zlapp.app
nslookup www.zlapp.app
nslookup sol-self.zlapp.app
```

In Vercel the domain card should read **Valid Configuration**. SSL is issued automatically.

## 5. If wildcard is delayed

The exhibition does not depend on subdomains. Every work already has a stable path:

```text
https://zlapp.app/x/sol-self
https://zlapp.app/x/sol-self/play
https://zlapp.app/artifacts/sol-self.html
```

Subdomains are an overlay. Path URLs remain canonical if wildcard DNS is not ready.

## 6. Experience subdomain map

Generated from `data/exhibition.json`. Pattern: `{publicSlug}.zlapp.app`.

| Subdomain | Path equivalent |
|---|---|
| `sol-self.zlapp.app` | `/x/sol-self` |
| `glm52-self.zlapp.app` | `/x/glm52-self` |
| `grok-self.zlapp.app` | `/x/grok-self` |
| `muse-spark-self.zlapp.app` | `/x/muse-spark-self` |
| `gemini-self.zlapp.app` | `/x/gemini-self` |
| `sol-shared.zlapp.app` | `/x/sol-shared` |
| `glm52-shared.zlapp.app` | `/x/glm52-shared` |
| `grok-high-shared.zlapp.app` | `/x/grok-high-shared` |
| `grok-xhigh-shared.zlapp.app` | `/x/grok-xhigh-shared` |
| `muse-spark-shared.zlapp.app` | `/x/muse-spark-shared` |
| `qwen-shared.zlapp.app` | `/x/qwen-shared` |
| `sol-self-synthesis.zlapp.app` | `/x/sol-self-synthesis` |
| `glm52-self-synthesis.zlapp.app` | `/x/glm52-self-synthesis` |
| `grok-self-synthesis.zlapp.app` | `/x/grok-self-synthesis` |
| `muse-spark-self-synthesis.zlapp.app` | `/x/muse-spark-self-synthesis` |
| `gemini-self-synthesis.zlapp.app` | `/x/gemini-self-synthesis` |
| `sol-synthesis.zlapp.app` | `/x/sol-synthesis` |
| `glm52-synthesis.zlapp.app` | `/x/glm52-synthesis` |
| `grok-high-synthesis.zlapp.app` | `/x/grok-high-synthesis` |
| `muse-spark-synthesis.zlapp.app` | `/x/muse-spark-synthesis` |
| `gemini-synthesis.zlapp.app` | `/x/gemini-synthesis` |

Each also has `/play` (framed experience) and `/raw` (original HTML) when the subdomain is live.
