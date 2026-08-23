/* VQX 0.2 client encoder/decoder. No network required after lexicon load. */
(function () {
  const PUA_BASE = 0xe000;
  const VERSION = 0x02;
  const BEACON = [0xd3, 0xa7, 0x5c, 0xe1, 0x9b, 0x02];

  const $ = (id) => document.getElementById(id);
  const errors = [];
  window.addEventListener("error", (e) => errors.push(String(e.message || e)));
  window.addEventListener("unhandledrejection", (e) =>
    errors.push(String(e.reason && e.reason.message ? e.reason.message : e.reason))
  );

  function bytesToPua(bytes) {
    return Array.from(bytes, (x) => String.fromCodePoint(PUA_BASE + x)).join("");
  }
  function puaToBytes(text, strict) {
    const out = [];
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp >= PUA_BASE && cp <= PUA_BASE + 255) {
        out.push(cp - PUA_BASE);
        continue;
      }
      if (/\s/.test(ch)) continue;
      if (strict) throw new Error("VQX_STRICT: non-PUA codepoint in payload");
    }
    return Uint8Array.from(out);
  }
  function bytesToHex(bytes) {
    return Array.from(bytes, (x) => x.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  }
  function hexToBytes(hex) {
    const s = String(hex).replace(/[^0-9a-fA-F]/g, "");
    if (s.length % 2) throw new Error("odd hex length");
    const out = new Uint8Array(s.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  function hasBeacon(bytes) {
    if (bytes.length < 6) return false;
    return BEACON.every((v, i) => bytes[i] === v);
  }
  function wrapBootstrap(payload) {
    const out = new Uint8Array(8 + payload.length);
    out.set(BEACON, 0);
    out[6] = VERSION;
    out[7] = 0;
    out.set(payload, 8);
    return out;
  }
  function stripBootstrap(bytes) {
    if (!hasBeacon(bytes)) return { mode: "compact", payload: bytes, version: null, flags: null };
    if (bytes.length < 8) throw new Error("truncated bootstrap");
    if (bytes[6] !== VERSION) throw new Error("VQX_VERSION: fail closed");
    return { mode: "bootstrap", version: bytes[6], flags: bytes[7], payload: bytes.slice(8) };
  }
  function codepoints(bytes) {
    return Array.from(bytes, (x) => "U+" + (PUA_BASE + x).toString(16).toUpperCase().padStart(4, "0"));
  }

  let byName = new Map();
  let byId = new Map();

  function index(list) {
    byName = new Map();
    byId = new Map();
    for (const e of list) {
      byName.set(e.human_name, e);
      byId.set(e.id, e);
    }
  }

  function encodeNames(names, bootstrap) {
    const ids = [];
    for (const raw of names) {
      const name = String(raw).trim().toUpperCase();
      if (!name) continue;
      const e = byName.get(name);
      if (!e) throw new Error("Unknown token name: " + name);
      ids.push(e.id);
    }
    const payload = Uint8Array.from(ids);
    return bootstrap ? wrapBootstrap(payload) : payload;
  }

  function decodePayload(bytes) {
    const framed = stripBootstrap(bytes);
    const names = Array.from(framed.payload, (id) => {
      const e = byId.get(id);
      if (!e) throw new Error("Unknown token id: " + id);
      return e.human_name;
    });
    return { ...framed, names };
  }

  function setStatus(msg, err) {
    const el = $("codec-status");
    if (!el) return;
    el.textContent = msg;
    el.className = "status" + (err ? " err" : "");
  }

  function showBytes(bytes) {
    const pua = bytesToPua(bytes);
    $("out-glyphs").textContent = pua;
    $("out-hex").textContent = bytesToHex(bytes);
    $("out-pua").value = pua;
    $("out-cp").textContent = codepoints(bytes).join(" ");
    $("out-mode").textContent = hasBeacon(bytes) ? "bootstrap" : "compact";
  }

  function encodeNow() {
    try {
      const names = $("in-names").value.split(/[\s,]+/);
      const bootstrap = $("opt-bootstrap").checked;
      const bytes = encodeNames(names, bootstrap);
      showBytes(bytes);
      setStatus("Encoded " + bytes.length + " byte(s).");
      return bytes;
    } catch (e) {
      setStatus(String(e.message || e), true);
      throw e;
    }
  }

  function decodeNow() {
    try {
      const raw = $("in-decode").value;
      let bytes;
      if (!raw.trim()) {
        bytes = puaToBytes($("out-pua").value, true);
      } else if (
        /^[0-9a-fA-F\s]+$/.test(raw.trim()) &&
        raw.replace(/\s/g, "").length % 2 === 0 &&
        !/[\uE000-\uE0FF]/.test(raw)
      ) {
        bytes = hexToBytes(raw);
      } else {
        bytes = puaToBytes(raw, true);
      }
      const result = decodePayload(bytes);
      showBytes(bytes);
      $("in-names").value = result.names.join(" ");
      $("out-names").textContent = result.names.join(" ");
      setStatus("Decoded " + result.mode + " frame → " + result.names.join(" "));
      return result;
    } catch (e) {
      setStatus(String(e.message || e), true);
      throw e;
    }
  }

  async function copyPua() {
    const v = $("out-pua").value;
    try {
      await navigator.clipboard.writeText(v);
      setStatus("Copied PUA string.");
    } catch {
      $("out-pua").select();
      document.execCommand("copy");
      setStatus("PUA string selected.");
    }
  }

  async function boot() {
    const res = await fetch("/machine/lexicon.json");
    if (!res.ok) throw new Error("lexicon fetch failed");
    index(await res.json());
    const year = $("year");
    if (year) year.textContent = String(new Date().getUTCFullYear());
    $("btn-encode") && $("btn-encode").addEventListener("click", (ev) => {
      ev.preventDefault();
      encodeNow();
    });
    $("btn-decode") && $("btn-decode").addEventListener("click", (ev) => {
      ev.preventDefault();
      decodeNow();
    });
    $("btn-copy") && $("btn-copy").addEventListener("click", (ev) => {
      ev.preventDefault();
      copyPua();
    });
    $("btn-sample") && $("btn-sample").addEventListener("click", (ev) => {
      ev.preventDefault();
      $("in-names").value = "REQUEST PEER RESPOND GLYPH_ONLY";
      encodeNow();
    });
  }

  async function runE2E() {
    const report = {
      loaded: true,
      font: false,
      beaconCount: 0,
      encoded: null,
      bootstrap: null,
      decoded: null,
      errors,
    };
    try {
      if (document.fonts && document.fonts.load) {
        await document.fonts.load('24px "VQX02"');
        report.font = document.fonts.check('24px "VQX02"');
      }
      const beacon = document.querySelector("[data-beacon-glyphs]");
      report.beaconCount = beacon ? [...beacon.textContent].length : 0;
      $("in-names").value = "REQUEST PEER RESPOND GLYPH_ONLY";
      $("opt-bootstrap").checked = false;
      const compact = encodeNow();
      report.encoded = bytesToHex(compact);
      $("opt-bootstrap").checked = true;
      const framed = encodeNow();
      report.bootstrap = bytesToHex(framed);
      $("in-decode").value = bytesToPua(framed);
      const decoded = decodeNow();
      report.decoded = decoded.names.join(" ");
      report.roundTrip = report.decoded === "REQUEST PEER RESPOND GLYPH_ONLY";
      report.bootstrapOk = report.bootstrap === "D3 A7 5C E1 9B 02 02 00 06 11 20 A0";
    } catch (e) {
      report.errors.push(String(e.message || e));
    }
    document.documentElement.dataset.e2e = JSON.stringify(report);
    const slot = document.createElement("pre");
    slot.id = "e2e-report";
    slot.hidden = true;
    slot.textContent = JSON.stringify(report);
    document.body.appendChild(slot);
    return report;
  }

  window.VQX_APP = { boot, encodeNow, decodeNow, runE2E, bytesToPua, errors };

  boot()
    .then(() => {
      if (new URLSearchParams(location.search).get("e2e") === "1") return runE2E();
    })
    .catch((e) => {
      errors.push(String(e.message || e));
      setStatus(String(e.message || e), true);
    });
})();
