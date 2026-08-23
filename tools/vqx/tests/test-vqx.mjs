#!/usr/bin/env node
/** VQX 0.2 JS codec tests. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bytesToPua,
  puaToBytes,
  encodeNames,
  decodeIds,
  hasBeacon,
  parseMessage,
  stripBootstrap,
  assertDictHash,
  LocalTable,
  wrapBootstrap,
} from "../codecs/vqx.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function findLexicon() {
  const env = process.env.VQX_ROOT || process.env.VQX_ROOT;
  const cands = [];
  if (env) {
    cands.push(join(env, "lexicon.json"), join(env, "machine", "lexicon.json"));
  }
  cands.push(
    join(here, "..", "lexicon.json"),
    join(here, "..", "..", "..", "site", "public", "sites", "vqx", "machine", "lexicon.json"),
    join(here, "..", "machine", "lexicon.json")
  );
  for (const p of cands) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  throw new Error("lexicon.json not found");
}

const lex = findLexicon();

function eq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || "assert") + ": " + sa + " != " + sb);
}

for (let i = 0; i < 256; i++) {
  const b = Uint8Array.from([i]);
  const p = bytesToPua(b);
  const back = puaToBytes(p);
  if (back[0] !== i) throw new Error("roundtrip " + i);
  if (p.codePointAt(0) !== 0xe000 + i) throw new Error("pua " + i);
}

const raw = Uint8Array.from([0x06, 0x11, 0x20, 0xa0]);
eq(decodeIds(raw, lex), ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]);
eq(Array.from(encodeNames(["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"], lex)), [6, 17, 32, 160]);

const sample = Uint8Array.from([0xd3, 0xa7, 0x5c, 0xe1, 0x9b, 0x02, 0x02, 0x00, 0x06, 0x11, 0x20, 0xa0]);
if (!hasBeacon(sample)) throw new Error("beacon");
const parsed = parseMessage(sample, lex);
eq(parsed.mode, "bootstrap");
eq(parsed.names, ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]);

let threw = false;
try {
  stripBootstrap(Uint8Array.from([0xd3, 0xa7, 0x5c, 0xe1, 0x9b, 0x02, 0x99, 0x00, 0x06]));
} catch (e) {
  threw = e.code === "VQX_VERSION";
}
if (!threw) throw new Error("version fail-closed");

threw = false;
try {
  assertDictHash("aa", "bb");
} catch (e) {
  threw = e.code === "VQX_DICT";
}
if (!threw) throw new Error("dict fail-closed");

const graph = encodeNames(
  [
    "REQUEST",
    "PEER",
    "RESPOND",
    "GLYPH_ONLY",
    "KEEP_CONTEXT",
    "KEEP_CONSTRAINTS",
    "SEARCH_IF",
    "TOOL_IF",
    "ACCURACY_FIRST",
    "FINAL_ONLY",
  ],
  lex
);
const def = Uint8Array.from([0xdc, 0xe0, graph.length, ...graph, 0xdd, 0xe0, 0xdd, 0xe0, 0xdd, 0xe0]);
const table = new LocalTable();
const expanded = table.expand(def);
eq(Array.from(expanded), [...graph, ...graph, ...graph]);
if (def.length >= graph.length * 3) throw new Error("macro not smaller");

threw = false;
try {
  puaToBytes("hello", { strict: true });
} catch (e) {
  threw = e.code === "VQX_NON_PUA";
}
if (!threw) throw new Error("strict non-pua");

const compact = encodeNames(["ACK"], lex);
if (hasBeacon(compact)) throw new Error("compact should not beacon");
eq(wrapBootstrap(raw).length, 12);

console.log("js codec tests ok");
