/** VQX 0.2 reference codec (Node / browser). Canonical tokens are bytes 0x00–0xFF. */

export const VERSION = 0x02;
export const BEACON = Object.freeze([0xd3, 0xa7, 0x5c, 0xe1, 0x9b, 0x02]);
export const PUA_BASE = 0xe000;

export function bytesToPua(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  return Array.from(b, (x) => String.fromCodePoint(PUA_BASE + x)).join("");
}

export function puaToBytes(text, { strict = true } = {}) {
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp >= PUA_BASE && cp <= PUA_BASE + 255) {
      out.push(cp - PUA_BASE);
      continue;
    }
    if (/\s/.test(ch)) continue;
    if (strict) {
      const err = new Error("VQX_STRICT: non-PUA codepoint in payload");
      err.code = "VQX_NON_PUA";
      throw err;
    }
  }
  return Uint8Array.from(out);
}

export function hexToBytes(hex) {
  const s = hex.replace(/[^0-9a-fA-F]/g, "");
  if (s.length % 2) throw new Error("odd hex length");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join(" ");
}

export function hasBeacon(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (b.length < 6) return false;
  return BEACON.every((v, i) => b[i] === v);
}

export function wrapBootstrap(payload, { version = VERSION, flags = 0 } = {}) {
  const p = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
  const out = new Uint8Array(8 + p.length);
  out.set(BEACON, 0);
  out[6] = version;
  out[7] = flags;
  out.set(p, 8);
  return out;
}

export function stripBootstrap(bytes, { expectVersion = VERSION } = {}) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (!hasBeacon(b)) {
    return { mode: "compact", version: null, flags: null, payload: b };
  }
  if (b.length < 8) {
    const err = new Error("VQX_FRAME: truncated bootstrap");
    err.code = "VQX_TRUNCATED";
    throw err;
  }
  const version = b[6];
  const flags = b[7];
  if (expectVersion != null && version !== expectVersion) {
    const err = new Error("VQX_VERSION: fail closed");
    err.code = "VQX_VERSION";
    err.version = version;
    throw err;
  }
  return { mode: "bootstrap", version, flags, payload: b.slice(8) };
}

export function indexLexicon(lexicon) {
  const byName = new Map();
  const byId = new Map();
  for (const e of lexicon) {
    byName.set(e.human_name, e);
    byId.set(e.id, e);
  }
  return { byName, byId };
}

export function encodeNames(names, lexicon, { bootstrap = false } = {}) {
  const { byName } = indexLexicon(lexicon);
  const ids = [];
  for (const raw of names) {
    const name = String(raw).trim().toUpperCase();
    if (!name) continue;
    const e = byName.get(name);
    if (!e) {
      const err = new Error(`VQX_UNKNOWN_NAME:${name}`);
      err.code = "VQX_UNKNOWN_NAME";
      throw err;
    }
    ids.push(e.id);
  }
  const payload = Uint8Array.from(ids);
  return bootstrap ? wrapBootstrap(payload) : payload;
}

export function decodeIds(bytes, lexicon, { unknown = "fail" } = {}) {
  const { byId } = indexLexicon(lexicon);
  const names = [];
  for (const id of bytes) {
    const e = byId.get(id);
    if (!e) {
      if (unknown === "fail") {
        const err = new Error(`VQX_UNKNOWN_ID:${id}`);
        err.code = "VQX_UNKNOWN_ID";
        throw err;
      }
      names.push(`UNK_${id.toString(16).padStart(2, "0")}`);
      continue;
    }
    names.push(e.human_name);
  }
  return names;
}

export function assertDictHash(actual, expected) {
  if (!expected) return;
  if (String(actual).toLowerCase() !== String(expected).toLowerCase()) {
    const err = new Error("VQX_DICT: fail closed");
    err.code = "VQX_DICT";
    throw err;
  }
}

/** Session-local macros. Never reuse across unrelated peers. */
export class LocalTable {
  constructor() {
    this.slots = new Map();
  }
  define(slot, sequence) {
    if (slot < 0xe0 || slot > 0xff) throw new Error("VQX_LOCAL_SLOT");
    this.slots.set(slot, Uint8Array.from(sequence));
  }
  ref(slot) {
    const s = this.slots.get(slot);
    if (!s) throw new Error("VQX_LOCAL_UNDEF");
    return s;
  }
  clear() {
    this.slots.clear();
  }
  expand(payload) {
    const out = [];
    const b = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
    for (let i = 0; i < b.length; i++) {
      if (b[i] === 0xdc) {
        const slot = b[i + 1];
        const len = b[i + 2];
        const seq = b.slice(i + 3, i + 3 + len);
        this.define(slot, seq);
        i += 2 + len;
        continue;
      }
      if (b[i] === 0xdd) {
        const slot = b[++i];
        out.push(...this.ref(slot));
        continue;
      }
      if (b[i] === 0xde) {
        this.clear();
        continue;
      }
      out.push(b[i]);
    }
    return Uint8Array.from(out);
  }
}

export function parseMessage(bytes, lexicon, opts = {}) {
  const framed = stripBootstrap(bytes, { expectVersion: opts.expectVersion ?? VERSION });
  if (opts.expectedDictHash) assertDictHash(opts.actualDictHash, opts.expectedDictHash);
  const table = opts.localTable || new LocalTable();
  const expanded = table.expand(framed.payload);
  const names = decodeIds(expanded, lexicon);
  return { ...framed, expanded, names, localTable: table };
}
