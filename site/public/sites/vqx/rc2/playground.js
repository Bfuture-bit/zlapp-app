/* VQX RC2 playground. Decode/validate/encode only. Execution authority is none. */
import {
  encodePacket,
  decodeUntrusted,
  trustedDecode,
  validatePacket,
  packetHash,
  canExecute,
  AXES,
  BEACON,
  WIRE_VERSION,
} from "./codecs/vqx_rc2.browser.mjs";

const $ = (id) => document.getElementById(id);
const EXAMPLES = {
  "stop-denied": new URL("./examples/stop-denied.json", import.meta.url).href,
  "wait-resume": new URL("./examples/wait-resume.json", import.meta.url).href,
  complete: new URL("./examples/complete.json", import.meta.url).href,
  "execute-read": new URL("./examples/execute-read.json", import.meta.url).href,
  "invalid-execute-without-action": new URL("./examples/invalid-execute-without-action.json", import.meta.url).href,
};
const NONCANONICAL_FRAME = new URL("./evidence/NONCANONICAL_NUMERIC_FRAME.json", import.meta.url).href;
const PUA_BASE = 0xe000;

function bytesToHex(bytes) {
  return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const s = String(hex).replace(/[^0-9a-fA-F]/g, "");
  if (s.length % 2) throw new Error("odd hex length");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function bytesToPua(bytes) {
  return Array.from(bytes, (x) => String.fromCodePoint(PUA_BASE + x)).join("");
}
function puaToBytes(text) {
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp >= PUA_BASE && cp <= PUA_BASE + 255) out.push(cp - PUA_BASE);
  }
  return Uint8Array.from(out);
}
function parseFrame(raw) {
  const s = String(raw).trim();
  if (!s) throw new Error("empty frame");
  if (/^[0-9a-fA-F\s]+$/.test(s) && s.replace(/\s/g, "").length >= 16) return hexToBytes(s);
  const pua = puaToBytes(s);
  if (pua.length) return pua;
  throw new Error("frame must be hex or PUA bytes");
}
function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}
function setStatus(ok, msg) {
  const el = $("pg-status");
  el.className = "status" + (ok ? "" : " err");
  el.textContent = msg;
}
function showPacket(packet) {
  $("out-json").textContent = pretty(packet);
  const c = packet.control || {};
  $("out-disposition").textContent = c.disposition || "—";
  $("out-next").textContent = c.next_action ? pretty(c.next_action) : "—";
  $("out-authz").textContent = c.action_authorized || "—";
}
function showFrame(bytes) {
  $("out-hex").textContent = bytesToHex(bytes);
  $("out-pua").value = bytesToPua(bytes);
  $("in-frame").value = bytesToHex(bytes);
}

async function loadExample(id) {
  const url = EXAMPLES[id];
  const packet = await fetch(url).then((r) => {
    if (!r.ok) throw new Error("example retrieve failed");
    return r.json();
  });
  $("in-json").value = pretty(packet);
  return packet;
}

function localAuthorityFromForm() {
  const out = {};
  for (const axis of AXES) {
    const el = $("local-" + axis.toLowerCase());
    out[axis] = el ? el.value : "DENIED";
  }
  return out;
}

$("btn-load").addEventListener("click", async () => {
  try {
    const packet = await loadExample($("example-id").value);
    setStatus(true, "Loaded example " + packet.packet_id);
    showPacket(packet);
  } catch (err) {
    setStatus(false, String(err.message || err));
  }
});

$("btn-validate").addEventListener("click", () => {
  try {
    const packet = JSON.parse($("in-json").value);
    const vr = validatePacket(packet);
    showPacket(packet);
    if (!vr.ok) {
      setStatus(false, "FAIL closed: " + vr.errors.join("; "));
      return;
    }
    setStatus(true, "PASS validate_packet · packet_hash " + packetHash(packet));
  } catch (err) {
    setStatus(false, String(err.message || err));
  }
});

$("btn-encode").addEventListener("click", () => {
  try {
    const packet = JSON.parse($("in-json").value);
    const frame = encodePacket(packet, true);
    showPacket(packet);
    showFrame(frame);
    setStatus(true, "Encoded " + frame.length + " bytes · packet_hash " + packetHash(packet) + " · wire 0x" + WIRE_VERSION.toString(16).toUpperCase());
  } catch (err) {
    setStatus(false, String(err.message || err));
  }
});

$("btn-decode").addEventListener("click", () => {
  try {
    const frame = parseFrame($("in-frame").value);
    const untrusted = decodeUntrusted(frame);
    const vr = validatePacket(untrusted);
    showFrame(frame);
    showPacket(untrusted);
    $("in-json").value = pretty(untrusted);
    if (!vr.ok) {
      setStatus(false, "Integrity parse OK, semantic FAIL closed: " + vr.errors.join("; "));
      return;
    }
    trustedDecode(frame);
    setStatus(true, "trusted_decode PASS · packet_hash " + packetHash(untrusted));
  } catch (err) {
    setStatus(false, "FAIL closed: " + String(err.message || err));
  }
});

$("btn-check").addEventListener("click", () => {
  try {
    const packet = JSON.parse($("in-json").value);
    const local = localAuthorityFromForm();
    const localCap = {};
    for (const cap of Object.keys(packet.control?.capabilities || {})) {
      localCap[cap] = $("local-cap-grant").checked ? "AVAILABLE" : "UNAVAILABLE";
    }
    const localAction = $("local-action").value;
    const [ok, reason] = canExecute(packet, local, localCap, localAction);
    $("out-check").textContent = pretty({
      ok,
      reason,
      note: "Authorization check only. This page does not execute, install, disclose, or call tools.",
      local_authority: local,
      local_action_authorized: localAction,
      beacon_prefix: bytesToHex(BEACON),
    });
    setStatus(true, ok ? "Check result AUTHORIZED (still untrusted intent)" : "Check result DENIED: " + reason);
  } catch (err) {
    setStatus(false, String(err.message || err));
  }
});

$("btn-noncanonical").addEventListener("click", async () => {
  try {
    const ev = await fetch(NONCANONICAL_FRAME).then((r) => r.json());
    $("in-frame").value = ev.frame_hex;
    setStatus(true, "Loaded frozen noncanonical numeric frame. Decode should fail closed.");
  } catch (err) {
    setStatus(false, String(err.message || err));
  }
});

loadExample("stop-denied").then((packet) => {
  showPacket(packet);
  setStatus(true, "Ready. STOP example loaded. Public VQX 0.3 is unchanged.");
}).catch((err) => setStatus(false, String(err.message || err)));
