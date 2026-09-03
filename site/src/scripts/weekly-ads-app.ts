type Tab =
  | "overview"
  | "current"
  | "compare"
  | "visual"
  | "history"
  | "sources"
  | "coverage";

const RETAILER_LABEL = {
  HEB: "H-E-B",
  KROGER: "Kroger",
  MARKET_STREET: "Market Street",
} as const;

type RetailerSlug = keyof typeof RETAILER_LABEL;
const RETAILER_SLUGS = Object.keys(RETAILER_LABEL) as RetailerSlug[];

const HISTORY_LIMIT = 25;
const API_MISSING = "Weekly Ads API is not configured (PUBLIC_WEEKLY_ADS_API_URL).";

type WeeklyAdPromotion = {
  id: string;
  fingerprint: string;
  flyer_id: string;
  retailer_slug: string;
  zip_code: string;
  retailer_flyer_id: string;
  stage: string;
  page: number;
  product_name: string;
  product_type: string;
  promotion_text: string;
  promotion_lines: string[];
  unit: string;
  bogo: boolean;
  effective_value: number | null;
  effective_basis: string | null;
  verification_method: string;
  page_membership_method: string;
  page1_image_url: string | null;
  source_url: string | null;
  source_evidence: string[];
  valid_from: string | null;
  valid_to: string | null;
};

type WeeklyAdFlyer = {
  id: string;
  fingerprint: string;
  retailer_slug: string;
  zip_code: string;
  retailer_flyer_id: string;
  valid_from: string | null;
  valid_to: string | null;
  page1_image_url: string | null;
  verification_mode: string | null;
  page_truth_method: string | null;
  status: string;
  promotion_count: number;
  visual_shell: boolean;
  source_url: string | null;
};

type Overview = {
  zips: string[];
  retailers: Record<string, string>;
  zips_scanned: number;
  ads_ingested: number;
  flyers_archived: number;
  current_promotions: number;
  coverage: Record<string, Record<string, string>>;
  source_health: Record<string, { label: string; attempts: number; success: number; fail: number; last: string }>;
  persistence?: {
    label: string;
    backend: string;
    weekly_ad_writes_allowed: boolean;
    ingest_auth_required: boolean;
    ingest_token_configured: boolean;
    browser_ingest_enabled?: boolean;
    runtime?: string;
  };
};

type CompareGroup = { product_type: string; basis: string; offers: WeeklyAdPromotion[] };

type QueryValue = string | number | boolean | undefined;

function resolveApiBase(): string {
  const configured = String(import.meta.env.PUBLIC_WEEKLY_ADS_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  return configured;
}

function asText(value: unknown): string {
  return value == null ? "" : String(value);
}

function statusClass(status: string): string {
  if (status.includes("PROMOS DEGRADED") || status.startsWith("FLYER SAVED")) return "wa-status-warn";
  if (status === "DEGRADED" || status === "SOURCE BLOCKED") return "wa-status-bad";
  if (status === "no flyer" || status === "queued") return "wa-status-idle";
  return "wa-status-ok";
}

function safeHttpUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base || (typeof window !== "undefined" ? window.location.origin : "https://zlapp.app"));
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return null;
  }
  return null;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function promoLines(lines?: string[], fallback?: string): HTMLElement {
  const wrap = el("div", "wa-lines");
  const items = (lines && lines.length ? lines : fallback ? [fallback] : []).map(asText);
  items.forEach((line, idx) => {
    wrap.append(el("div", idx ? "wa-line-n" : "wa-line-0", line));
  });
  return wrap;
}

async function apiFetch(input: string, init?: RequestInit, retries = 1): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (aborted || attempt >= retries) break;
      await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError ?? "Request failed");
  if (/failed to fetch|networkerror|load failed|fetch.*error/i.test(msg)) {
    throw new Error(`Can't reach the Weekly Ads API. Confirm PUBLIC_WEEKLY_ADS_API_URL and CORS.`);
  }
  throw new Error(msg || "Request failed");
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    if (typeof detail === "object" && detail && "message" in detail) {
      throw new Error(String((detail as { message: string }).message));
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQuery(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return qs.toString();
}

function snapshotFocus(root: HTMLElement): { field: string; start: number | null; end: number | null } | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) return null;
  const field = active.getAttribute("data-wa-field");
  if (!field) return null;
  const start =
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionStart : null;
  const end =
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionEnd : null;
  return { field, start, end };
}

function restoreFocus(root: HTMLElement, snap: ReturnType<typeof snapshotFocus>) {
  if (!snap) return;
  const node = root.querySelector(`[data-wa-field="${snap.field}"]`);
  if (!(node instanceof HTMLElement)) return;
  node.focus();
  if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && snap.start != null) {
    try {
      node.setSelectionRange(snap.start, snap.end ?? snap.start);
    } catch {
      /* ignore */
    }
  }
}

function selectControl(
  field: string,
  label: string,
  value: string,
  options: Array<{ value: string; label: string }>,
  onChange: (value: string) => void,
): HTMLLabelElement {
  const wrap = el("label", "wa-label");
  wrap.append(el("span", "wa-field-label", label));
  const select = el("select");
  select.setAttribute("data-wa-field", field);
  for (const opt of options) {
    const option = el("option", undefined, opt.label);
    option.value = opt.value;
    if (opt.value === value) option.selected = true;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value));
  wrap.append(select);
  return wrap;
}

function textControl(
  field: string,
  label: string,
  value: string,
  placeholder: string,
  type: "text" | "date" | "search",
  onInput: (value: string) => void,
): HTMLLabelElement {
  const wrap = el("label", "wa-label");
  wrap.append(el("span", "wa-field-label", label));
  const input = el("input");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.setAttribute("data-wa-field", field);
  input.addEventListener("input", () => onInput(input.value));
  wrap.append(input);
  return wrap;
}

function button(label: string, variant: "primary" | "secondary", onClick: () => void, opts?: { disabled?: boolean; size?: "sm" }): HTMLButtonElement {
  const btn = el("button", `wa-btn ${variant === "primary" ? "wa-btn-primary" : "wa-btn-secondary"}${opts?.size === "sm" ? " wa-btn-sm" : ""}`, label);
  btn.type = "button";
  btn.disabled = Boolean(opts?.disabled);
  btn.addEventListener("click", onClick);
  return btn;
}

export function mountWeeklyAdsApp(target?: HTMLElement | null) {
  const root = target ?? document.getElementById("weekly-ads-root");
  if (!root) return;

  const apiBase = resolveApiBase();

  const state = {
    tab: "overview" as Tab,
    overview: null as Overview | null,
    current: [] as WeeklyAdPromotion[],
    history: [] as WeeklyAdPromotion[],
    historyTotal: 0,
    historyOffset: 0,
    flyers: [] as WeeklyAdFlyer[],
    compare: [] as CompareGroup[],
    error: apiBase ? null : API_MISSING,
    busy: false,
    zip: "",
    retailer: "",
    productType: "",
    query: "",
    historyQuery: "",
    dateFrom: "",
    dateTo: "",
    bogoOnly: false,
    unit: "",
    ingestZip: "75070",
  };

  let seq = 0;

  function productTypes(): string[] {
    const values = new Set<string>();
    for (const row of state.current) if (row.product_type) values.add(row.product_type);
    for (const row of state.history) if (row.product_type) values.add(row.product_type);
    return [...values].sort();
  }

  function ingestLocked(): boolean {
    return Boolean(state.overview?.persistence?.ingest_auth_required);
  }

  function endpoint(path: string, qs?: string): string {
    return `${apiBase}/api/v1/weekly-ads/${path}${qs ? `?${qs}` : ""}`;
  }

  async function weeklyAdsOverview() {
    const res = await apiFetch(endpoint("overview"), undefined, 1);
    return handle<Overview>(res);
  }

  async function weeklyAdsCurrent(params: Record<string, QueryValue>) {
    const res = await apiFetch(endpoint("current", toQuery(params)), undefined, 1);
    return handle<{ results: WeeklyAdPromotion[]; total: number; limit: number; offset: number }>(res);
  }

  async function weeklyAdsHistory(params: Record<string, QueryValue>) {
    const res = await apiFetch(endpoint("history", toQuery(params)), undefined, 1);
    return handle<{ results: WeeklyAdPromotion[]; total: number; limit: number; offset: number }>(res);
  }

  async function weeklyAdsFlyers(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    const res = await apiFetch(endpoint("flyers", qs.toString()), undefined, 1);
    return handle<{ results: WeeklyAdFlyer[] }>(res);
  }

  async function weeklyAdsCompare(zipCode: string, productType?: string, q?: string) {
    const qs = new URLSearchParams({ zip_code: zipCode });
    if (productType) qs.set("product_type", productType);
    if (q) qs.set("q", q);
    const res = await apiFetch(endpoint("compare", qs.toString()), undefined, 1);
    return handle<{ results: CompareGroup[] }>(res);
  }

  async function weeklyAdsIngest(body: { zip_code?: string; retailer?: string; force?: boolean }) {
    const res = await apiFetch(
      endpoint("ingest"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      0,
    );
    return handle<{
      run_id: string;
      flyer_count: number;
      promotion_count: number;
      warning_count: number;
    }>(res);
  }

  async function loadHistory(offset = 0) {
    if (!apiBase) {
      state.error = API_MISSING;
      render();
      return;
    }
    const id = ++seq;
    try {
      const data = await weeklyAdsHistory({
        zip_code: state.zip || undefined,
        retailer: state.retailer || undefined,
        product_type: state.productType || undefined,
        q: state.historyQuery || undefined,
        date_from: state.dateFrom || undefined,
        date_to: state.dateTo || undefined,
        bogo: state.bogoOnly || undefined,
        unit: state.unit || undefined,
        limit: HISTORY_LIMIT,
        offset,
      });
      if (id !== seq) return;
      state.history = data.results || [];
      state.historyTotal = data.total || 0;
      state.historyOffset = offset;
      render();
    } catch (err) {
      if (id !== seq) return;
      state.error = err instanceof Error ? err.message : "Failed to load weekly ads";
      render();
    }
  }

  async function refresh() {
    if (!apiBase) {
      state.error = API_MISSING;
      render();
      return;
    }
    const id = ++seq;
    state.error = null;
    try {
      const targetZip = state.zip || state.ingestZip || "75070";
      const [overview, current, history, flyers, compare] = await Promise.all([
        weeklyAdsOverview(),
        weeklyAdsCurrent({
          zip_code: state.zip || undefined,
          retailer: state.retailer || undefined,
          product_type: state.productType || undefined,
          q: state.query || undefined,
          limit: 100,
          offset: 0,
        }),
        weeklyAdsHistory({
          zip_code: state.zip || undefined,
          retailer: state.retailer || undefined,
          product_type: state.productType || undefined,
          q: state.historyQuery || undefined,
          date_from: state.dateFrom || undefined,
          date_to: state.dateTo || undefined,
          bogo: state.bogoOnly || undefined,
          unit: state.unit || undefined,
          limit: HISTORY_LIMIT,
          offset: 0,
        }),
        weeklyAdsFlyers({ zip_code: state.zip || state.ingestZip || undefined }),
        weeklyAdsCompare(targetZip, state.productType || undefined, state.query || undefined),
      ]);
      if (id !== seq) return;
      state.overview = overview;
      state.current = current.results || [];
      state.history = history.results || [];
      state.historyTotal = history.total || 0;
      state.historyOffset = 0;
      state.flyers = flyers.results || [];
      state.compare = compare.results || [];
    } catch (err) {
      if (id !== seq) return;
      state.error = err instanceof Error ? err.message : "Failed to load weekly ads";
    }
    render();
  }

  async function runIngest(forceAll = false) {
    if (!apiBase || ingestLocked()) return;
    state.busy = true;
    state.error = null;
    render();
    try {
      await weeklyAdsIngest(forceAll ? { force: true } : { zip_code: state.ingestZip });
      state.busy = false;
      await refresh();
    } catch (err) {
      state.busy = false;
      state.error = err instanceof Error ? err.message : "Ingest failed";
      render();
    }
  }

  function filterBar(opts?: { hideRetailer?: boolean; zipValue?: string }): HTMLElement {
    const zips = state.overview?.zips || [];
    const types = productTypes();
    const wrap = el("div", "wa-filters");
    wrap.append(
      selectControl(
        "zip",
        "ZIP",
        opts?.zipValue ?? state.zip,
        [{ value: "", label: "All ZIPs" }, ...zips.map((item) => ({ value: item, label: item }))],
        (value) => {
          state.zip = value;
          void refresh();
        },
      ),
    );
    if (!opts?.hideRetailer) {
      wrap.append(
        selectControl(
          "retailer",
          "Retailer",
          state.retailer,
          [
            { value: "", label: "All retailers" },
            ...RETAILER_SLUGS.map((key) => ({ value: key, label: RETAILER_LABEL[key] })),
          ],
          (value) => {
            state.retailer = value;
            void refresh();
          },
        ),
      );
    }
    wrap.append(
      selectControl(
        "productType",
        "Product type",
        state.productType,
        [{ value: "", label: "All types" }, ...types.map((item) => ({ value: item, label: item }))],
        (value) => {
          state.productType = value;
          void refresh();
        },
      ),
      textControl("query", "Product search", state.query, "ribs, brisket, avocado…", "text", (value) => {
        state.query = value;
        void refresh();
      }),
    );
    return wrap;
  }

  function promoTable(rows: WeeklyAdPromotion[], empty: string, showWeek = false): HTMLElement {
    const wrap = el("div", "wa-table-wrap");
    const table = el("table");
    const thead = el("thead");
    const headRow = el("tr");
    const headers = [
      ...(showWeek ? ["Week"] : []),
      "ZIP",
      "Retailer",
      "Product",
      "Promotion",
      "Verification",
      "Evidence",
    ];
    for (const label of headers) headRow.append(el("th", undefined, label));
    thead.append(headRow);
    table.append(thead);
    const tbody = el("tbody");
    if (!rows.length) {
      const tr = el("tr");
      const td = el("td", "wa-empty", empty);
      td.colSpan = showWeek ? 7 : 6;
      tr.append(td);
      tbody.append(tr);
    } else {
      for (const row of rows) {
        const tr = el("tr");
        if (showWeek) {
          const week = el("td");
          week.append(el("div", "wa-strong", row.valid_from || "—"));
          week.append(el("div", "wa-xs", `to ${row.valid_to || "—"}`));
          tr.append(week);
        }
        const zip = el("td");
        zip.append(el("div", undefined, asText(row.zip_code)));
        zip.append(el("div", "wa-xs", asText(row.retailer_flyer_id)));
        tr.append(zip);
        tr.append(el("td", undefined, RETAILER_LABEL[row.retailer_slug as RetailerSlug] || row.retailer_slug));
        const product = el("td");
        product.append(el("div", "wa-strong", asText(row.product_name)));
        product.append(el("div", "wa-type", asText(row.product_type)));
        tr.append(product);
        const promo = el("td");
        promo.append(promoLines(row.promotion_lines, row.promotion_text));
        if (row.bogo) promo.append(el("span", "wa-bogo", "BOGO/FREE"));
        tr.append(promo);
        const verify = el("td");
        verify.append(el("div", "wa-strong", asText(row.verification_method)));
        verify.append(el("div", "wa-xs", asText(row.page_membership_method)));
        tr.append(verify);
        const evidence = el("td");
        evidence.className = "wa-xs";
        const pageUrl = safeHttpUrl(row.page1_image_url, apiBase);
        if (pageUrl) {
          const a = el("a", "wa-link", "Page 1 image");
          a.href = pageUrl;
          a.target = "_blank";
          a.rel = "noreferrer";
          evidence.append(a);
        }
        const sourceUrl = safeHttpUrl(row.source_url, apiBase);
        if (sourceUrl) {
          const div = el("div");
          const a = el("a", "wa-link", "Source");
          a.href = sourceUrl;
          a.target = "_blank";
          a.rel = "noreferrer";
          div.append(a);
          evidence.append(div);
        }
        tr.append(evidence);
        tbody.append(tr);
      }
    }
    table.append(tbody);
    wrap.append(table);
    return wrap;
  }

  function renderOverview(): HTMLElement {
    const zips = state.overview?.zips || [];
    const wrap = el("div", "wa-stack");
    const stats = el("div", "wa-stats");
    const items: Array<[string, string]> = [
      ["ZIPs in scope", `${state.overview?.zips_scanned || 0}/${zips.length || 18}`],
      ["Flyers archived", String(state.overview?.flyers_archived || 0)],
      ["Ads ingested", String(state.overview?.ads_ingested || 0)],
      ["Current page-1 promotions", String(state.overview?.current_promotions || 0)],
    ];
    for (const [label, value] of items) {
      const card = el("section", "wa-card");
      card.append(el("div", "wa-stat-label", label));
      card.append(el("div", "wa-stat-value", value));
      stats.append(card);
    }
    wrap.append(stats);

    const ingest = el("section", "wa-card");
    const head = el("header", "wa-card-head");
    head.append(el("h2", undefined, "Ingest a market"));
    head.append(
      el(
        "p",
        "wa-card-sub",
        "Server-side fetch. Explicit and auditable — this does not crawl all 18 ZIPs unless you ask.",
      ),
    );
    ingest.append(head);
    if (ingestLocked()) {
      ingest.append(
        el(
          "p",
          "wa-note",
          "Ingest is authorized for founder/service execution only. This browser does not hold the ingest credential.",
        ),
      );
    }
    const row = el("div", "wa-row");
    row.append(
      selectControl(
        "ingestZip",
        "ZIP",
        state.ingestZip,
        (zips.length ? zips : ["75070"]).map((item) => ({ value: item, label: item })),
        (value) => {
          state.ingestZip = value;
          void refresh();
        },
      ),
      button(state.busy ? "Ingesting…" : "Ingest this ZIP", "primary", () => void runIngest(false), {
        disabled: state.busy || ingestLocked(),
      }),
      button("Ingest all 18 ZIPs", "secondary", () => void runIngest(true), {
        disabled: state.busy || ingestLocked(),
      }),
    );
    ingest.append(row);
    wrap.append(ingest);
    return wrap;
  }

  function renderCompare(): HTMLElement {
    const wrap = el("div", "wa-stack");
    wrap.append(filterBar({ hideRetailer: true, zipValue: state.zip || state.ingestZip }));
    if (!state.compare.length) {
      const card = el("section", "wa-card");
      card.append(el("p", "wa-muted", "No same-basis cross-retailer matches for this ZIP yet."));
      wrap.append(card);
      return wrap;
    }
    for (const group of state.compare) {
      const card = el("section", "wa-card");
      const head = el("header", "wa-card-head");
      head.append(el("h2", undefined, `${group.product_type} · ${group.basis}`));
      card.append(head);
      const grid = el("div", "wa-compare-grid");
      for (const key of RETAILER_SLUGS) {
        const offer = group.offers.find((row) => row.retailer_slug === key);
        const cell = el("div", `wa-offer${offer ? "" : " is-empty"}`);
        cell.append(el("div", "wa-strong", RETAILER_LABEL[key]));
        if (offer) {
          cell.append(el("div", undefined, asText(offer.product_name)));
          const promo = el("div");
          promo.style.marginTop = "0.5rem";
          promo.append(promoLines(offer.promotion_lines, offer.promotion_text));
          cell.append(promo);
        } else {
          cell.append(el("p", "wa-muted", "No comparable page-1 offer"));
        }
        grid.append(cell);
      }
      card.append(grid);
      wrap.append(card);
    }
    return wrap;
  }

  function renderVisual(): HTMLElement {
    const zips = state.overview?.zips || [];
    const zipValue = state.zip || state.ingestZip;
    const wrap = el("div", "wa-stack");
    wrap.append(
      selectControl(
        "visualZip",
        "ZIP",
        zipValue,
        (zips.length ? zips : [state.ingestZip]).map((item) => ({ value: item, label: item })),
        (value) => {
          state.zip = value;
          void refresh();
        },
      ),
    );
    const grid = el("div", "wa-flyer-grid");
    for (const key of RETAILER_SLUGS) {
      const flyer = state.flyers.find((row) => row.retailer_slug === key);
      const matched = state.current.filter(
        (row) => row.retailer_slug === key && (!state.zip || row.zip_code === zipValue),
      );
      const card = el("section", "wa-card");
      const head = el("header", "wa-card-head");
      head.append(el("h2", undefined, `${RETAILER_LABEL[key]} · ${zipValue}`));
      card.append(head);
      if (!flyer) {
        card.append(el("p", "wa-muted", "No flyer for this ZIP."));
      } else {
        const body = el("div", "wa-flyer-body");
        const media = el("div");
        const imgUrl = safeHttpUrl(flyer.page1_image_url, apiBase);
        if (imgUrl) {
          const img = el("img", "wa-flyer-img");
          img.src = imgUrl;
          img.alt = `${RETAILER_LABEL[key]} page 1`;
          media.append(img);
        } else {
          media.append(el("p", "wa-muted", "No page image URL."));
        }
        const status =
          flyer.status === "promos_degraded" || flyer.visual_shell
            ? "FLYER SAVED · PROMOS DEGRADED"
            : flyer.verification_mode || flyer.status;
        media.append(el("p", "wa-xs", asText(status)));
        media.append(el("p", "wa-xs", asText(flyer.page_truth_method)));
        body.append(media);
        const list = el("div", "wa-promo-list");
        if (matched.length) {
          for (const row of matched.slice(0, 40)) {
            const item = el("div", "wa-promo-item");
            item.append(el("div", "wa-strong", asText(row.product_name)));
            item.append(promoLines(row.promotion_lines, row.promotion_text));
            list.append(item);
          }
        } else {
          list.append(
            el(
              "p",
              "wa-muted",
              flyer.visual_shell
                ? "Physical flyer is archived. Promotion extraction did not complete, so no rows are invented."
                : "No promotion rows.",
            ),
          );
        }
        body.append(list);
        card.append(body);
      }
      grid.append(card);
    }
    wrap.append(grid);
    return wrap;
  }

  function renderHistory(): HTMLElement {
    const zips = state.overview?.zips || [];
    const wrap = el("div", "wa-stack");
    const filters = el("div", "wa-history-filters");
    filters.append(
      selectControl(
        "zip",
        "ZIP",
        state.zip,
        [{ value: "", label: "All ZIPs" }, ...zips.map((item) => ({ value: item, label: item }))],
        (value) => {
          state.zip = value;
          void refresh();
        },
      ),
      selectControl(
        "retailer",
        "Retailer",
        state.retailer,
        [
          { value: "", label: "All retailers" },
          ...RETAILER_SLUGS.map((key) => ({ value: key, label: RETAILER_LABEL[key] })),
        ],
        (value) => {
          state.retailer = value;
          void refresh();
        },
      ),
      textControl("historyQuery", "Product search", state.historyQuery, "historical product…", "text", (value) => {
        state.historyQuery = value;
        void refresh();
      }),
      textControl("dateFrom", "Valid from", state.dateFrom, "", "date", (value) => {
        state.dateFrom = value;
        void refresh();
      }),
      textControl("dateTo", "Valid to", state.dateTo, "", "date", (value) => {
        state.dateTo = value;
        void refresh();
      }),
      selectControl(
        "unit",
        "Unit",
        state.unit,
        [
          { value: "", label: "Any unit" },
          { value: "LB", label: "LB" },
          { value: "EA", label: "EA" },
          { value: "ITEM", label: "ITEM" },
        ],
        (value) => {
          state.unit = value;
          void refresh();
        },
      ),
    );
    const check = el("label", "wa-check");
    const box = el("input");
    box.type = "checkbox";
    box.checked = state.bogoOnly;
    box.setAttribute("data-wa-field", "bogoOnly");
    box.addEventListener("change", () => {
      state.bogoOnly = box.checked;
      void refresh();
    });
    check.append(box);
    check.append(document.createTextNode("BOGO only"));
    filters.append(check);
    wrap.append(filters);
    wrap.append(
      el(
        "p",
        "wa-page-meta",
        `${state.historyTotal} historical matches · page ${Math.floor(state.historyOffset / HISTORY_LIMIT) + 1}`,
      ),
    );
    wrap.append(promoTable(state.history, "No history matches.", true));
    const actions = el("div", "wa-actions");
    actions.append(
      button(
        "Previous",
        "secondary",
        () => void loadHistory(Math.max(0, state.historyOffset - HISTORY_LIMIT)),
        { disabled: state.historyOffset <= 0, size: "sm" },
      ),
      button("Next", "secondary", () => void loadHistory(state.historyOffset + HISTORY_LIMIT), {
        disabled: state.historyOffset + HISTORY_LIMIT >= state.historyTotal,
        size: "sm",
      }),
    );
    wrap.append(actions);
    return wrap;
  }

  function renderSources(): HTMLElement {
    const wrap = el("div", "wa-health");
    for (const [key, item] of Object.entries(state.overview?.source_health || {})) {
      const card = el("section", "wa-card");
      card.setAttribute("data-source", key);
      const head = el("header", "wa-card-head");
      head.append(el("h2", undefined, asText(item.label)));
      card.append(head);
      card.append(el("p", undefined, asText(item.last)));
      card.append(el("p", "wa-xs", `${item.success}/${item.attempts} successful fetches`));
      wrap.append(card);
    }
    return wrap;
  }

  function renderCoverage(): HTMLElement {
    const zips = state.overview?.zips || [];
    const wrap = el("div", "wa-coverage");
    for (const zip of zips) {
      for (const key of RETAILER_SLUGS) {
        const status = state.overview?.coverage?.[zip]?.[key] || "queued";
        const item = el("div", "wa-cover-item");
        item.append(el("div", "wa-strong", `${zip} · ${RETAILER_LABEL[key]}`));
        item.append(el("div", `wa-xs ${statusClass(status)}`, asText(status)));
        wrap.append(item);
      }
    }
    return wrap;
  }

  function render() {
    const snap = snapshotFocus(root);
    const shell = el("div", "wa wa-stack");
    const intro = el("div");
    intro.append(el("p", "wa-kicker", "Local grocery circulars"));
    intro.append(el("h1", undefined, "Weekly Ads"));
    intro.append(
      el(
        "p",
        "wa-lead",
        "Physical page 1 only. H-E-B uses native FlyerKit when available; Kroger and Market Street use unified page truth. Historical weeks stay in the database.",
      ),
    );
    if (state.overview?.persistence?.label) {
      intro.append(el("p", "wa-persist", state.overview.persistence.label));
    }
    shell.append(intro);

    const tabs = el("div", "wa-tabs");
    const tabItems: Array<{ id: Tab; label: string }> = [
      { id: "overview", label: "Overview" },
      { id: "current", label: "Current weekly ads" },
      { id: "compare", label: "Compare" },
      { id: "visual", label: "Flyer evidence" },
      { id: "history", label: "Historical ads" },
      { id: "sources", label: "Crawler health" },
      { id: "coverage", label: "Coverage" },
    ];
    for (const item of tabItems) {
      const btn = el("button", "wa-tab", item.label);
      btn.type = "button";
      if (state.tab === item.id) btn.setAttribute("aria-current", "page");
      btn.addEventListener("click", () => {
        state.tab = item.id;
        render();
      });
      tabs.append(btn);
    }
    shell.append(tabs);

    if (state.error) shell.append(el("div", "wa-error", state.error));

    if (state.tab === "overview") shell.append(renderOverview());
    if (state.tab === "current") {
      const panel = el("div", "wa-stack");
      panel.append(filterBar());
      panel.append(promoTable(state.current, "No current page-1 promotions for these filters."));
      shell.append(panel);
    }
    if (state.tab === "compare") shell.append(renderCompare());
    if (state.tab === "visual") shell.append(renderVisual());
    if (state.tab === "history") shell.append(renderHistory());
    if (state.tab === "sources") shell.append(renderSources());
    if (state.tab === "coverage") shell.append(renderCoverage());

    root.replaceChildren(shell);
    restoreFocus(root, snap);
  }

  render();
  void refresh();
}
