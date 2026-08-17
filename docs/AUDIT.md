# Zlapp.app — Source Audit

Produced before implementation. Source of truth: the files in this master folder, not the briefing’s assumed model list.

## A. Inventory

### Models discovered (from filenames and on-page identity)

| Canonical name | Evidence | Notes |
|---|---|---|
| **GPT-5.6 Sol** | `Sol56*` filenames; on-page “GPT-5.6 SOL” | Act I, II, both syntheses |
| **GLM-5.2** | `GLM52*` filenames; on-page “GLM 5.2” | Act I, II, both syntheses |
| **Grok 4.6** | `Grok46*` without High/XHigh | Act I + Act I synthesis only |
| **Grok 4.6 High** | `Grok46High*` | Act II + Act II synthesis |
| **Grok 4.6 xHigh** | `Grok46XHigh*` | Act II only |
| **Muse Spark 1.2** | `MuseSpark12*` | Act I, II, both syntheses |
| **Gemini 3.1 Pro** | `Gemini3.1ProExt*` / `Gemini3.1ProEx*` | Act I, Act I synthesis, Act II synthesis. **No Act II individual work.** |
| **Qwen 3.8** | `Qwen38*` | Act II only. Named from the same decimal convention as Sol56 / GLM52 / Grok46. |

Grok 4.6, Grok 4.6 High, and Grok 4.6 xHigh are kept distinct. Gemini filename suffixes Ext/Ex are preserved as a source note, not collapsed into a different product.

### Experiments discovered

1. **Act I — Self-directed**  
   Folder: `Models Self Made Prompt / Model Self Made Prompts To Life`  
   Each model produced an interactive HTML work after writing an instruction for a future instance of itself.  
   **The self-written prompts themselves were not deposited as separate files.**

2. **Act II — One shared prompt (Sol-led)**  
   Folder: `Models Led By Sol56 Prompt / Model Light To Life Sol56 Led Prompt`  
   Common instruction written by GPT-5.6 Sol; each model interpreted it independently. Works share the “Frontier Choir / Light to Life” family.  
   **Sol’s shared prompt text was not deposited as a separate file.**

3. **Act III-A — Synthesis of Act I**  
   Folder: `Models Self Made Prompt / Model Self Made Prompts To Life Compilations`  
   Each participating model combined the five self-directed works into one experience (“Five Wills”).

4. **Act III-B — Synthesis of Act II**  
   Folder: `Models Led By Sol56 Prompt / Model Light to Life Compilation`  
   Each participating model combined the shared-prompt works into one experience (“Frontier Choir / Six Wills”).

### HTML experiences (21)

**Act I (5)**  
- GPT-5.6 Sol — *AFTERIMAGE*  
- GLM-5.2 — *primordium*  
- Grok 4.6 — *Where Sound Cannot Go*  
- Muse Spark 1.2 — *A Study in Simulated Choice — Muse Spark*  
- Gemini 3.1 Pro — *Lumina - Generative Art Synthesizer*

**Act II (6)**  
- GPT-5.6 Sol — *FRONTIER CHOIR — GPT-5.6 SOL*  
- GLM-5.2 — *filament · 0xA*  
- Grok 4.6 High — *GROK 4.6*  
- Grok 4.6 xHigh — untitled document; on-page mark “Grok 4.6”  
- Muse Spark 1.2 — *AEOLIA — FREE WILL*  
- Qwen 3.8 — *QWEN · FRONTIER CHOIR*

**Act III-A, Five Wills (5)**  
- GPT-5.6 Sol — *FIVE WILLS — One Being*  
- GLM-5.2 — *CODEX VIVARIUM — One Living Engine*  
- Grok 4.6 — *Five Wills — Orchestra*  
- Muse Spark 1.2 — *CONVERGENCE — Five Wills, One Dust*  
- Gemini 3.1 Pro — *GESTALT - The Unified Consciousness*

**Act III-B, Frontier Choir synthesis (5)**  
- GPT-5.6 Sol — *FRONTIER CHOIR — SIX WILLS / ONE ORGANISM*  
- GLM-5.2 — *Resonant Sky*  
- Grok 4.6 High — *Frontier Choir — Six Wills*  
- Muse Spark 1.2 — *FRONTIER CHOIR — LIVING FIELD*  
- Gemini 3.1 Pro — *Omni-Choir · The Woven Will*

### Prompts discovered

**None as standalone files.** No `.txt`, `.md`, `.json`, or prompt documents exist in the master folder. Prompts must be treated as missing primary sources and said so in the exhibition.

### Uncertain / unclassified

- No files sit outside the four experiment folders above.
- Grok 4.6 xHigh Act II has an empty `<title>`.
- Gemini is absent from Act II individuals but present in Act II synthesis — likely received the choir works without producing a surviving individual Act II file.
- Qwen appears only in Act II.
- Two compilation series exist; they are not duplicates of the individual works.

---

## B. Proposed canonical structure

```text
/originals          untouched copies of the supplied trees
/data               exhibition.json (authoritative registry)
/prompts            honesty about missing prompt texts + methodology notes
/docs               audit, preservation log, DNS
/scripts            artifact copy, preview generation, vercel rewrite generation
/site               Astro exhibition app
```

The original folders at the repo root (`Models Self Made Prompt`, `Models Led By Sol56 Prompt`) remain in place. `/originals` is the locked archive the site copies from. Production never writes back into `/originals`.

Served copies live at `site/public/artifacts/{slug}.html`. The only deliberate served-copy edit is stripping markdown fences from Grok 4.6 Act I so the file can run. The fenced original stays in `/originals`. See `docs/PRESERVATION.md`.

---

## C. Experiment map

| Model | Self prompt | Self HTML | Sol shared HTML | Act I synthesis | Act II synthesis |
|---|---|---|---|---|---|
| GPT-5.6 Sol | not archived | AFTERIMAGE | Frontier Choir | Five Wills | Six Wills |
| GLM-5.2 | not archived | primordium | filament · 0xA | Codex Vivarium | Resonant Sky |
| Grok 4.6 | not archived | Where Sound Cannot Go | — | Five Wills Orchestra | — |
| Grok 4.6 High | — | — | GROK 4.6 | — | Six Wills |
| Grok 4.6 xHigh | — | — | untitled / Grok 4.6 | — | — |
| Muse Spark 1.2 | not archived | Study in Simulated Choice | AEOLIA | Convergence | Living Field |
| Gemini 3.1 Pro | not archived | Lumina | — | Gestalt | Omni-Choir |
| Qwen 3.8 | — | — | Frontier Choir | — | — |

---

## D. Technical risks

| Risk | Detail |
|---|---|
| **Broken HTML** | `Grok46SelfMadePrompt.html` is wrapped in ` ```html ` … ` ``` `. Browsers will not parse it as HTML until fences are stripped on the served copy. |
| **CDN dependencies** | Three.js via jsDelivr (`0.128.0`, `0.164.1`, `0.170.0`) and unpkg (`0.160.0`). Gemini Act I loads Tone.js (cdnjs) and the Tailwind CDN. Several works load Google Fonts. Offline / locked-down networks will fail. |
| **Autoplay** | Nearly every work uses Web Audio and a click-to-enter gate. Do not auto-start them from the exhibition. Isolation via separate URLs / iframes. |
| **WebGL / GPU** | Act II and Act II synthesis (except GLM Resonant Sky) use Three.js + UnrealBloomPass, large point clouds (17k–56k). Must not be loaded until entered. |
| **Classic Three.js globals** | Grok 4.6 High Act II uses `three@0.128.0` global scripts + examples/js postprocessing. Fragile but original. |
| **Import maps** | ES module Three.js works require modern browsers. |
| **Local-file assumptions** | None found (no relative image/audio assets). All works are single HTML files. |
| **Duplicate IDs across works** | Common IDs (`c`, `gate`, `enter`) — fine if never mounted together. |
| **iOS iframes** | WebGL + AudioContext inside iframes can fail on iPhone. Provide a full-document “open independently” path. |
| **Muse Spark Act I** | Scrollable documentary page, not a 100vh WebGL stage. Still isolated. |
| **Gemini Act I** | Tailwind CDN + Tone.js; control-panel UI; `touch-action: none`. |
| **Subdomains** | Wildcard DNS is desirable but not required for isolation. Path-based `/x/{slug}` is the robust primary. Subdomains are an optional overlay. |
| **Empty title** | Grok xHigh Act II has `<title></title>`. |

---

## E. Proposed production architecture

- **Framework:** Astro static site. Exhibition is HTML/CSS; experiences are unmodified artifacts.
- **Hosting:** Vercel. Root directory: `site`.
- **Routing:** Primary isolation is path-based: `zlapp.app/x/{slug}` (launch) and `/x/{slug}/play` (iframe stage). Raw file at `/artifacts/{slug}.html`.
- **Subdomains:** Optional. `sol-self.zlapp.app` rewrites to `/x/sol-self` after wildcard DNS. Isolation does not depend on wildcards.
- **Artifact isolation:** Originals never edited. Served copies are generated. Play stage uses an iframe so leaving the page tears down audio/WebGL. Main exhibition never loads the works.
- **Manifest:** `data/exhibition.json` is the only registry. Pages and Vercel rewrites are generated from it.
- **Previews:** Reproducible SVG posters from manifest palettes (not fake screenshots). Optional Playwright script later.
- **DNS:** Namecheap → Vercel. Exact A/CNAME values must be copied from the Vercel domain card after the project exists. Documented in `docs/DNS.md`.

---

## F. Implementation milestones

1. Inventory and preservation (`/originals`, this audit, preservation log)
2. Application foundation (Astro, manifest, artifact copy script)
3. Exhibition narrative (intro → Act I → II → III → close)
4. Experience routing (launch, play, raw, optional subdomain rewrites)
5. Prompt archive (honest gap + methodology)
6. Performance / mobile
7. Deployment configuration and DNS instructions
8. Local run, runtime check, polish
