export function initGlyphs2Gallery() {
  const root = document.querySelector("[data-g2-gallery]");
  if (!root || !(root instanceof HTMLElement)) return;

  const cards = [...root.querySelectorAll("[data-g2-card]")];
  const search = root.querySelector('input[type="search"]');
  const countEl = root.querySelector("[data-g2-count]");
  const emptyEl = root.querySelector("[data-g2-empty]");
  const dialog = document.querySelector("[data-g2-dialog]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    q: "",
    cat: "all",
    type: "all",
  };

  function abs(path) {
    if (!path) return "";
    return new URL(path, window.location.origin).href;
  }

  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    let n = 0;
    for (const card of cards) {
      if (!(card instanceof HTMLElement)) continue;
      const hay = `${card.dataset.id} ${card.dataset.emoji} ${card.dataset.meaning} ${card.dataset.cat}`.toLowerCase();
      const catOk = state.cat === "all" || card.dataset.cat === state.cat;
      const typeOk =
        state.type === "all" ||
        (state.type === "animated" && card.dataset.animated === "1") ||
        (state.type === "static" && card.dataset.animated !== "1");
      const qOk = !q || hay.includes(q);
      const show = catOk && typeOk && qOk;
      card.hidden = !show;
      if (show) n++;
    }
    if (countEl) countEl.textContent = `${n} shown`;
    if (emptyEl instanceof HTMLElement) emptyEl.hidden = n !== 0;
  }

  function setPressed(group, attr, value) {
    for (const btn of root.querySelectorAll(`[${attr}]`)) {
      if (btn instanceof HTMLButtonElement) {
        btn.setAttribute("aria-pressed", btn.getAttribute(attr) === value ? "true" : "false");
      }
    }
  }

  function previewImg(card) {
    return card.querySelector(".g2-preview img");
  }

  function setPreview(card, animated) {
    const img = previewImg(card);
    if (!(img instanceof HTMLImageElement)) return;
    const next = animated && card.dataset.gif ? card.dataset.gif : card.dataset.svg;
    if (img.getAttribute("src") === next) return;
    img.loading = animated ? "lazy" : img.loading;
    img.src = next;
    img.parentElement?.classList.toggle("is-animated", Boolean(animated && card.dataset.gif));
    const toggle = card.querySelector("[data-g2-toggle]");
    if (toggle instanceof HTMLButtonElement) {
      toggle.setAttribute("aria-pressed", animated ? "true" : "false");
    }
  }

  if (search instanceof HTMLInputElement) {
    search.addEventListener("input", () => {
      state.q = search.value;
      applyFilters();
    });
  }

  root.addEventListener("click", (event) => {
    const t = event.target;
    if (!(t instanceof Element)) return;
    const catBtn = t.closest("[data-cat]");
    if (catBtn instanceof HTMLButtonElement) {
      state.cat = catBtn.getAttribute("data-cat") || "all";
      setPressed(root, "data-cat", state.cat);
      applyFilters();
      return;
    }
    const typeBtn = t.closest("[data-type]");
    if (typeBtn instanceof HTMLButtonElement) {
      state.type = typeBtn.getAttribute("data-type") || "all";
      setPressed(root, "data-type", state.type);
      applyFilters();
      return;
    }
    const copyBtn = t.closest("[data-g2-copy]");
    if (copyBtn instanceof HTMLButtonElement) {
      const card = copyBtn.closest("[data-g2-card]") || dialog;
      if (!(card instanceof HTMLElement)) return;
      const kind = copyBtn.getAttribute("data-g2-copy");
      let value = "";
      if (kind === "name") value = card.dataset.emoji || "";
      if (kind === "asset" || kind === "svg") value = abs(card.dataset.svg || "");
      if (kind === "gif") value = abs(card.dataset.gif || "");
      if (value) {
        navigator.clipboard?.writeText(value).then(() => {
          copyBtn.dataset.copied = "1";
          copyBtn.textContent = "Copied";
          setTimeout(() => {
            copyBtn.dataset.copied = "0";
            if (kind === "name") copyBtn.textContent = "Copy Name";
            if (kind === "asset") copyBtn.textContent = "Copy Asset URL";
            if (kind === "svg") copyBtn.textContent = "Copy SVG URL";
            if (kind === "gif") copyBtn.textContent = "Copy GIF URL";
          }, 1200);
        });
      }
      event.preventDefault();
      return;
    }
    const toggle = t.closest("[data-g2-toggle]");
    if (toggle instanceof HTMLButtonElement) {
      const card = toggle.closest("[data-g2-card]");
      if (card instanceof HTMLElement) {
        const on = toggle.getAttribute("aria-pressed") !== "true";
        card.dataset.force = on ? "gif" : "svg";
        setPreview(card, on);
      }
      event.preventDefault();
      return;
    }
    const open = t.closest("[data-g2-open]");
    if (open && dialog instanceof HTMLDialogElement) {
      const card = open.closest("[data-g2-card]");
      if (card instanceof HTMLElement) openDialog(card);
    }
  });

  function openDialog(card) {
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.dataset.emoji = card.dataset.emoji || "";
    dialog.dataset.svg = card.dataset.svg || "";
    dialog.dataset.gif = card.dataset.gif || "";
    const token = dialog.querySelector("[data-g2-dialog-token]");
    const cat = dialog.querySelector("[data-g2-dialog-cat]");
    const mean = dialog.querySelector("[data-g2-dialog-mean]");
    const preview = dialog.querySelector("[data-g2-dialog-preview]");
    const svgA = dialog.querySelector("[data-g2-dialog-svg]");
    const gifA = dialog.querySelector("[data-g2-dialog-gif]");
    const code = dialog.querySelector("[data-g2-dialog-code]");
    if (token) token.textContent = card.dataset.emoji || "";
    if (cat) cat.textContent = card.dataset.cat || "";
    if (mean) mean.textContent = card.dataset.meaning || "";
    if (preview) {
      const src = !reduce && card.dataset.gif ? card.dataset.gif : card.dataset.svg;
      preview.innerHTML = `<img src="${src}" alt="${card.dataset.emoji}" width="256" height="256">`;
    }
    if (svgA instanceof HTMLAnchorElement) {
      svgA.href = card.dataset.svg || "#";
      svgA.textContent = card.dataset.svg || "SVG";
    }
    if (gifA instanceof HTMLAnchorElement) {
      const has = Boolean(card.dataset.gif);
      gifA.hidden = !has;
      gifA.href = card.dataset.gif || "#";
      gifA.textContent = card.dataset.gif || "GIF";
    }
    if (code) {
      code.textContent = `<AgentGlyph2 id="${card.dataset.id}"${card.dataset.gif ? " animated" : ""} />`;
    }
    const gifCopy = dialog.querySelector('[data-g2-copy="gif"]');
    if (gifCopy instanceof HTMLButtonElement) gifCopy.hidden = !card.dataset.gif;
    dialog.showModal();
  }

  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = entry.target;
          if (!(card instanceof HTMLElement)) continue;
          if (!entry.isIntersecting) continue;
          if (card.dataset.animated !== "1") continue;
          if (card.dataset.force === "svg") continue;
          setPreview(card, true);
        }
      },
      { rootMargin: "80px" }
    );
    for (const card of cards) io.observe(card);
  }

  applyFilters();
}

initGlyphs2Gallery();
