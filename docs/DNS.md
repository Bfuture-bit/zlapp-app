# Connecting zlapp.app to Vercel

Do not enter DNS values from memory. After the project is created, Vercel shows the exact records on the domain card. Copy those.

## 1. Deploy the site

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In Vercel: **Add New Project** → import the repo.
3. Set **Root Directory** to `site`.
4. Framework preset should detect Astro. Build command is `npm run build`. Output directory is `dist`.
5. Deploy once so the project exists.

## 2. Add domains in Vercel

In the project: **Settings → Domains**. Add, in this order:

1. `zlapp.app`
2. `www.zlapp.app` (Vercel will offer to redirect www ↔ apex; keep **apex `zlapp.app` as the primary**)
3. `*.zlapp.app` (wildcard, for experience subdomains such as `sol-self.zlapp.app`)

When you add each domain, Vercel displays the records it wants. **Those dashboard values override anything written below.**

## 3. Namecheap DNS

Registrar: Namecheap, domain `zlapp.app`.

Open **Domain List → zlapp.app → Advanced DNS**.

Remove any old A / CNAME / URL-redirect records that still point at previous hosting. Leave Namecheap nameservers unless you are deliberately moving DNS.

Then add what Vercel’s domain card shows. Typical shape (verify before saving):

| Type | Host | Value | TTL |
|---|---|---|---|
| **A** | `@` | The IPv4 on the Vercel domain card for `zlapp.app`. Often `76.76.21.21`, but use the card. | Automatic |
| **CNAME** | `www` | The CNAME target on the Vercel card for `www.zlapp.app`. Often a `*.vercel-dns.com` host, not a generic guess. | Automatic |
| **CNAME** | `*` | The CNAME target Vercel shows after you add `*.zlapp.app`. | Automatic |

Notes:

- Apex domains cannot use a CNAME. That is why `@` is an A record.
- The wildcard CNAME is what makes `sol-self.zlapp.app`, `glm52-shared.zlapp.app`, and the rest resolve.
- If Vercel also shows an **AAAA** record, add it exactly as shown.
- If the domain card asks for a **TXT** verification record first, add that and wait until the domain shows as verified.

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
