/** SPDX-License-Identifier: Apache-2.0
 * VQX 0.3 reference codec (Node / browser).
 * Pure codec: no network access, tool execution, process creation, installation,
 * or authorization decisions. Canonical semantic tokens are bytes 0x00-0xFF.
 */

export const VERSION = 0x03;
export const BEACON = Object.freeze([0xd3, 0xa7, 0x5c, 0xe1, 0x9b, 0x02]);
export const PUA_BASE = 0xe000;
export const SUPPORTED_FLAGS_MASK = 0x00;
export const DEFAULT_MAX_FRAME_SIZE = 65535;
export const DEFAULT_MAX_EXPANDED_SIZE = 65535;
const LOCAL_DEFINE = 0xdc;
const LOCAL_REF = 0xdd;
const LOCAL_CLEAR = 0xde;
const LOCAL_MIN = 0xe0;
const LOCAL_MAX = 0xff;

function fail(code, message) {
  const err = new Error(message);
  err.code = code;
  throw err;
}

export async function sha256Hex(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", b);
    return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(b).digest("hex");
}

export async function verifySha256(bytes, expected) {
  const actual = await sha256Hex(bytes);
  if (actual.toLowerCase() !== String(expected).trim().toLowerCase()) {
    fail("VQX_DIGEST", "VQX_DIGEST: SHA-256 mismatch; fail closed");
  }
  return actual;
}

export function bytesToPua(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  return Array.from(b, x => String.fromCodePoint(PUA_BASE + x)).join("");
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
    if (strict) fail("VQX_NON_PUA", "VQX_STRICT: non-PUA codepoint in payload");
  }
  return Uint8Array.from(out);
}

export function hexToBytes(hex) {
  const s = String(hex).replace(/[^0-9a-fA-F]/g, "");
  if (s.length % 2) fail("VQX_HEX", "odd hex length");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes) {
  return Array.from(bytes, x => x.toString(16).padStart(2, "0")).join(" ");
}

export function hasBeacon(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  return b.length >= BEACON.length && BEACON.every((v, i) => b[i] === v);
}

export function wrapBootstrap(payload, { version = VERSION, flags = 0, maxFrameSize = DEFAULT_MAX_FRAME_SIZE } = {}) {
  const p = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
  if (p.length > maxFrameSize) fail("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: payload exceeds configured maximum");
  if (flags & ~SUPPORTED_FLAGS_MASK) fail("VQX_FLAGS", "VQX_FLAGS: unsupported flags; fail closed");
  if (!Number.isInteger(version) || version < 0 || version > 255) fail("VQX_VERSION", "VQX_VERSION: invalid version byte");
  const out = new Uint8Array(8 + p.length);
  out.set(BEACON, 0);
  out[6] = version;
  out[7] = flags;
  out.set(p, 8);
  return out;
}

export function stripBootstrap(bytes, {
  expectVersion = VERSION,
  mode = "auto",
  allowedFlagsMask = SUPPORTED_FLAGS_MASK,
  maxFrameSize = DEFAULT_MAX_FRAME_SIZE,
} = {}) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (!["auto", "bootstrap", "compact"].includes(mode)) fail("VQX_MODE", "VQX_MODE: expected auto, bootstrap, or compact");
  if (mode === "compact") {
    if (b.length > maxFrameSize) fail("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: compact payload exceeds configured maximum");
    return { mode: "compact", version: null, flags: null, payload: b };
  }
  const beacon = hasBeacon(b);
  if (mode === "bootstrap" && !beacon) fail("VQX_BEACON", "VQX_BEACON: required bootstrap beacon missing");
  if (mode === "auto" && !beacon) {
    if (b.length > maxFrameSize) fail("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: compact payload exceeds configured maximum");
    return { mode: "compact", version: null, flags: null, payload: b };
  }
  if (b.length < 8) fail("VQX_TRUNCATED", "VQX_FRAME: truncated bootstrap");
  const version = b[6];
  const flags = b[7];
  const payload = b.slice(8);
  if (payload.length > maxFrameSize) fail("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: bootstrap payload exceeds configured maximum");
  if (expectVersion != null && version !== expectVersion) fail("VQX_VERSION", "VQX_VERSION: incompatible version; fail closed");
  if (flags & ~allowedFlagsMask) fail("VQX_FLAGS", "VQX_FLAGS: unsupported flags; fail closed");
  return { mode: "bootstrap", version, flags, payload };
}

export function validateLexicon(lexicon) {
  if (!Array.isArray(lexicon) || lexicon.length !== 256) fail("VQX_LEXICON", "VQX_LEXICON: expected exactly 256 entries");
  const ids = lexicon.map(e => e?.id).sort((a,b) => a-b);
  if (ids.some((v,i) => v !== i)) fail("VQX_LEXICON", "VQX_LEXICON: byte IDs must be unique 0..255");
  const names = lexicon.map(e => e?.human_name);
  if (names.some(n => typeof n !== "string" || !n) || new Set(names).size !== 256) {
    fail("VQX_LEXICON", "VQX_LEXICON: human names must be unique non-empty strings");
  }
}

export function indexLexicon(lexicon) {
  validateLexicon(lexicon);
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
    if (!e) fail("VQX_UNKNOWN_NAME", `VQX_UNKNOWN_NAME:${name}`);
    ids.push(e.id);
  }
  const payload = Uint8Array.from(ids);
  return bootstrap ? wrapBootstrap(payload) : payload;
}

export function decodeEntries(bytes, lexicon, { allowLocalSlots = false } = {}) {
  const { byId } = indexLexicon(lexicon);
  const out = [];
  for (const id of bytes) {
    if (id >= LOCAL_MIN && id <= LOCAL_MAX && !allowLocalSlots) {
      fail("VQX_LOCAL_DIRECT", `VQX_LOCAL_DIRECT:${id}: local slots must be expanded through REF_LOCAL`);
    }
    const e = byId.get(id);
    if (!e) fail("VQX_UNKNOWN_ID", `VQX_UNKNOWN_ID:${id}`);
    out.push(e);
  }
  return out;
}

export function decodeIds(bytes, lexicon, opts = {}) {
  return decodeEntries(bytes, lexicon, opts).map(e => e.human_name);
}

export class LocalTable {
  constructor() { this.slots = new Map(); }
  define(slot, sequence) {
    if (slot < LOCAL_MIN || slot > LOCAL_MAX) fail("VQX_LOCAL_SLOT", "VQX_LOCAL_SLOT: invalid local slot");
    const seq = sequence instanceof Uint8Array ? sequence : Uint8Array.from(sequence);
    if (!seq.length) fail("VQX_LOCAL_EMPTY", "VQX_LOCAL_EMPTY: local macro sequence must not be empty");
    if (Array.from(seq).some(x => x >= LOCAL_DEFINE)) fail("VQX_LOCAL_CONTENT", "VQX_LOCAL_CONTENT: macro definitions cannot contain control/local bytes DC-FF");
    this.slots.set(slot, Uint8Array.from(seq));
  }
  ref(slot) {
    const s = this.slots.get(slot);
    if (!s) fail("VQX_LOCAL_UNDEF", "VQX_LOCAL_UNDEF: undefined local slot");
    return s;
  }
  clear() { this.slots.clear(); }
  async tableHash() {
    const bytes = [];
    for (const slot of [...this.slots.keys()].sort((a,b) => a-b)) {
      const seq = this.slots.get(slot);
      bytes.push(slot, seq.length, ...seq);
    }
    return sha256Hex(Uint8Array.from(bytes));
  }
  expand(payload, { maxExpandedSize = DEFAULT_MAX_EXPANDED_SIZE } = {}) {
    const out = [];
    const b = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
    let i = 0;
    while (i < b.length) {
      const op = b[i];
      if (op === LOCAL_DEFINE) {
        if (i + 3 > b.length) fail("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: DEFINE_LOCAL header truncated");
        const slot = b[i + 1];
        const len = b[i + 2];
        if (!len) fail("VQX_LOCAL_EMPTY", "VQX_LOCAL_EMPTY: zero-length macro definition");
        const end = i + 3 + len;
        if (end > b.length) fail("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: DEFINE_LOCAL body truncated");
        this.define(slot, b.slice(i + 3, end));
        i = end;
        continue;
      }
      if (op === LOCAL_REF) {
        if (i + 2 > b.length) fail("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: REF_LOCAL truncated");
        out.push(...this.ref(b[i + 1]));
        i += 2;
      } else if (op === LOCAL_CLEAR) {
        this.clear();
        i += 1;
      } else if (op >= LOCAL_MIN && op <= LOCAL_MAX) {
        fail("VQX_LOCAL_DIRECT", `VQX_LOCAL_DIRECT:${op}: local slot used without REF_LOCAL`);
      } else {
        out.push(op);
        i += 1;
      }
      if (out.length > maxExpandedSize) fail("VQX_EXPANSION_LIMIT", "VQX_EXPANSION_LIMIT: local macro expansion exceeds configured maximum");
    }
    return Uint8Array.from(out);
  }
}

export async function parseMessage(bytes, lexicon, opts = {}) {
  if (opts.expectedDictHash != null) {
    if (opts.lexiconBytes == null) fail("VQX_DICT_REQUIRED", "VQX_DICT_REQUIRED: raw lexicon bytes required for digest verification");
    await verifySha256(opts.lexiconBytes, opts.expectedDictHash);
  }
  const framed = stripBootstrap(bytes, {
    expectVersion: opts.expectVersion ?? VERSION,
    mode: opts.mode ?? "auto",
    maxFrameSize: opts.maxFrameSize ?? DEFAULT_MAX_FRAME_SIZE,
  });
  const table = opts.localTable || new LocalTable();
  const expanded = table.expand(framed.payload, { maxExpandedSize: opts.maxExpandedSize ?? DEFAULT_MAX_EXPANDED_SIZE });
  const entries = decodeEntries(expanded, lexicon);
  const names = entries.map(e => e.human_name);
  const authorizationRequired = entries.filter(e => e?.machine_semantics?.auth_required === true || e?.machine_semantics?.auth_required === true).map(e => e.human_name);
  return { ...framed, expanded, names, entries, authorizationRequired, localTable: table };
}
