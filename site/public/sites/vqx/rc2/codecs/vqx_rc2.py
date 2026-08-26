from __future__ import annotations

import copy
import hashlib
import json
import math
import re
import struct
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

BEACON = bytes.fromhex("D3 A7 5C E1 9B 02")
WIRE_VERSION = 0xFD  # private RC2 discriminator; NOT public VQX 0.4
FLAGS = 0x00
PROTOCOL = "VQX-RC2"
STATUS = "REPAIR_CANDIDATE"
MAX_SAFE_INT = (1 << 53) - 1

PROFILES = {"CONTROL", "EVENT", "EVIDENCE", "EPISTEMIC", "VIEW", "MEMORY", "DELTA", "HANDOFF"}
DISPOSITIONS = {"EXECUTE", "WAIT", "STOP", "COMPLETE", "REQUIRES_VERIFIER", "WAITING_AUTHORITY", "WAITING_DEPENDENCY"}
TRI = {"GRANTED", "DENIED", "UNKNOWN"}
CAP_STATES = {"AVAILABLE", "UNAVAILABLE", "UNKNOWN"}
AXES = ("READ", "COMPUTE", "DISCLOSURE", "NETWORK", "EXECUTION", "BUDGET")
VERDICTS = {"PASS", "FAIL", "BLOCKED", "CONDITIONAL", "INCONCLUSIVE", "UNREVIEWED", "UNKNOWN"}
ACTION_TYPES = {"READ", "COMPUTE", "VERIFY", "RETRY", "DEPLOY", "MERGE", "DISCLOSE", "NETWORK", "SPEND", "MUTATE", "OTHER"}
PROHIBITED_ACTIONS = {"DO_NOT_RETRY", "DO_NOT_EXECUTE", "DO_NOT_DEPLOY", "DO_NOT_MERGE", "DO_NOT_DISCLOSE", "DO_NOT_NETWORK", "DO_NOT_SPEND"}
STOP_EFFECTS = {"STOP", "WAIT", "DO_NOT_RETRY", "DO_NOT_EXECUTE", "DO_NOT_DEPLOY", "DO_NOT_MERGE", "DO_NOT_DISCLOSE", "DO_NOT_NETWORK", "DO_NOT_SPEND", "REQUIRES_VERIFIER"}
PREDICATES = {"ALWAYS", "DEPENDENCY_READY", "AUTHORITY_GRANTED", "VERIFIER_PASS", "PIN_MATCH", "EXTERNAL"}
PIN_KINDS = {"SHA256", "GIT_COMMIT", "LITERAL"}
DEPENDENCY_STATES = {"READY", "WAITING", "FAILED", "UNKNOWN"}
COMPLETION_STATES = {"SATISFIED", "CONDITION"}
UNKNOWN_STATES = {"UNKNOWN", "NOT_OBSERVED", "NOT_REPORTED", "NOT_AVAILABLE", "WITHHELD", "NOT_APPLICABLE", "CONFLICTED"}
CLAIM_STATES = {"OBSERVED", "SUPPORTED", "CONTESTED", "INFERRED", "UNVERIFIED", "UNKNOWN", "RETRACTED", "SUPERSEDED"}
SUFFICIENCY = {"SUFFICIENT", "PARTIAL", "INSUFFICIENT", "UNKNOWN"}
FRESHNESS_STATES = {"FRESH", "AGING", "STALE", "EXPIRED", "UNKNOWN"}
SOURCE_RELATIONS = {"INDEPENDENT", "DERIVED_FROM", "SYNDICATED_FROM", "SHARED_ORIGIN", "UNKNOWN_RELATION"}
CONFLICT_TYPES = {"VALUE_CONFLICT", "TEMPORAL_CONFLICT", "SOURCE_CONFLICT", "IDENTITY_CONFLICT", "LOCATION_CONFLICT", "CAUSAL_CONFLICT", "AUTHORITY_CONFLICT"}
CONFLICT_STATES = {"UNRESOLVED", "RESOLVED", "SUPERSEDED"}
MEMORY_CLASSES = {"EPISODIC_AGENT", "WORKING_CONTEXT", "RETRIEVED_EXTERNAL", "CANONICAL_HISTORY"}
TRANSFORM_TYPES = {"NORMALIZE", "SUMMARIZE", "COMPRESS", "ENCODE", "HANDOFF", "RETRIEVE"}
LOSS_CLASSES = {"NONE", "PRESENTATIONAL", "NON_CRITICAL", "EPISTEMIC", "OPERATIONAL"}
VIEW_STANCES = {"ACCEPT", "REJECT", "ABSTAIN", "UNRESOLVED"}
PATH_NODE_TYPES = {"UPSTREAM_EVIDENCE", "SENSOR_OBSERVATION", "CANONICAL_EVENT", "AGENT_OBSERVATION", "AGENT_INTERPRETATION", "AGENT_OUTPUT"}
PATH_RELATIONS = {"FETCHED_FROM", "NORMALIZED_FROM", "PROJECTED_FROM", "BASED_ON", "DERIVED_FROM"}

ACTION_MIN_AXES = {
    "READ": {"READ"},
    "COMPUTE": {"COMPUTE"},
    "VERIFY": {"READ", "COMPUTE"},
    "RETRY": {"EXECUTION"},
    "DEPLOY": {"EXECUTION", "NETWORK"},
    "MERGE": {"EXECUTION"},
    "DISCLOSE": {"DISCLOSURE"},
    "NETWORK": {"NETWORK"},
    "SPEND": {"BUDGET"},
    "MUTATE": {"EXECUTION"},
    "OTHER": set(),
}
ACTION_PROHIBITION = {
    "RETRY": "DO_NOT_RETRY",
    "DEPLOY": "DO_NOT_DEPLOY",
    "MERGE": "DO_NOT_MERGE",
    "DISCLOSE": "DO_NOT_DISCLOSE",
    "NETWORK": "DO_NOT_NETWORK",
    "SPEND": "DO_NOT_SPEND",
    "MUTATE": "DO_NOT_EXECUTE",
}

# Stable compact dictionary shared by Python and JS codecs.
TOKENS_LIST = [
    # top-level/profile keys
    "protocol","status","packet_id","profiles","control","event","evidence","epistemic","view","memory","delta","handoff","transforms","payload",
    # control keys
    "job_id","context_id","current_state","disposition","verdict","holds","pins","stop_conditions","resume_conditions","prohibited_actions","capabilities","action_authorized","authority","next_action","dependencies","completion_condition","revision",
    "source","final","id","blocks","condition","kind","value","algorithm","effect","predicate","action_id","action_type","required_authority","required_capabilities","params_hash","state",
    # event/evidence
    "event_id","event_type","subject_ids","time","location","occurred_at","observed_at","published_at","received_at","normalized_at","valid_from","valid_until",
    "observations","source_relations","evidence_paths","metrics","observation_id","observer","adapter","upstream_source","source_timestamp","raw_reference","content_hash","freshness","independence_group","age_seconds","ttl_seconds","source_a","source_b","relation","source_count","independent_source_count",
    "path_id","nodes","edges","node_id","node_type","ref","from","to","transform_ref",
    # epistemic/view
    "claims","unknowns","conflicts","evidence_sufficiency","evidence_requests","positions","agreements","claim_id","subject","confidence","evidence_refs","field","reason","conflict_id","claim_ids","conflict_type","unresolved_fields","severity","resolution_state","request_id","missing_fact","desired_source_class","agent_id","stance","participants","agreement_ratio","dissenters",
    "observation_ids","received_claim_ids","accepted_claim_ids","rejected_claim_ids","unresolved_claim_ids","inferred_claims","context_cutoff",
    # memory/delta/handoff/transforms
    "refs","memory_class","origin","retained_at","retrieved_at","source_event","base_event_id","base_revision","base_hash","new_revision","operations","unresolved","op","path","sender","receiver","objective","provenance","transform_type","input_hash","output_hash","preserved_fields","omitted_fields","loss_class","justification",
    # enums / frequent values
    "CONTROL","EVENT","EVIDENCE","EPISTEMIC","VIEW","MEMORY","DELTA","HANDOFF",
    "EXECUTE","WAIT","STOP","COMPLETE","REQUIRES_VERIFIER","WAITING_AUTHORITY","WAITING_DEPENDENCY",
    "GRANTED","DENIED","UNKNOWN","AVAILABLE","UNAVAILABLE",
    "PASS","FAIL","BLOCKED","CONDITIONAL","INCONCLUSIVE","UNREVIEWED",
    "NONE","ACTION","READ","COMPUTE","VERIFY","RETRY","DEPLOY","MERGE","DISCLOSE","NETWORK","SPEND","MUTATE","OTHER",
    "DO_NOT_RETRY","DO_NOT_EXECUTE","DO_NOT_DEPLOY","DO_NOT_MERGE","DO_NOT_DISCLOSE","DO_NOT_NETWORK","DO_NOT_SPEND",
    "ALWAYS","DEPENDENCY_READY","AUTHORITY_GRANTED","VERIFIER_PASS","PIN_MATCH","EXTERNAL",
    "SHA256","GIT_COMMIT","LITERAL","READY","WAITING","FAILED","SATISFIED","CONDITION",
    "NOT_OBSERVED","NOT_REPORTED","NOT_AVAILABLE","WITHHELD","NOT_APPLICABLE","CONFLICTED",
    "OBSERVED","SUPPORTED","CONTESTED","INFERRED","UNVERIFIED","RETRACTED","SUPERSEDED",
    "SUFFICIENT","PARTIAL","INSUFFICIENT","FRESH","AGING","STALE","EXPIRED",
    "INDEPENDENT","DERIVED_FROM","SYNDICATED_FROM","SHARED_ORIGIN","UNKNOWN_RELATION",
    "VALUE_CONFLICT","TEMPORAL_CONFLICT","SOURCE_CONFLICT","IDENTITY_CONFLICT","LOCATION_CONFLICT","CAUSAL_CONFLICT","AUTHORITY_CONFLICT","UNRESOLVED","RESOLVED",
    "EPISODIC_AGENT","WORKING_CONTEXT","RETRIEVED_EXTERNAL","CANONICAL_HISTORY",
    "NORMALIZE","SUMMARIZE","COMPRESS","ENCODE","RETRIEVE","PRESENTATIONAL","NON_CRITICAL","EPISTEMIC","OPERATIONAL",
    "ACCEPT","REJECT","ABSTAIN",
    "UPSTREAM_EVIDENCE","SENSOR_OBSERVATION","CANONICAL_EVENT","AGENT_OBSERVATION","AGENT_INTERPRETATION","AGENT_OUTPUT",
    "FETCHED_FROM","NORMALIZED_FROM","PROJECTED_FROM","BASED_ON",
    "add","replace","remove",
]
TOKENS: Dict[str, int] = {s: i + 1 for i, s in enumerate(TOKENS_LIST)}
TOKEN_BY_ID: Dict[int, str] = {v: k for k, v in TOKENS.items()}

HEX64 = re.compile(r"^[0-9a-fA-F]{64}$")
HEX40 = re.compile(r"^[0-9a-fA-F]{40}$")

@dataclass
class ValidationResult:
    ok: bool
    errors: List[str]
    fail_closed: bool = True

class VQXError(Exception):
    pass

class ValidationError(VQXError):
    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors

class ParseError(VQXError):
    pass


def normalize_semantic(value: Any, path: str = "$") -> Any:
    """Normalize RC2 semantic values to the shared JSON/IEEE-754 domain.

    Integral floats canonicalize to integers. Integers outside the JavaScript
    safe-integer range, non-finite numbers, byte strings, non-string map keys,
    and runtime-specific objects are rejected.
    """
    if value is None or isinstance(value, (str, bool)):
        return value
    if isinstance(value, int) and not isinstance(value, bool):
        if abs(value) > MAX_SAFE_INT:
            raise ValueError(f"{path}: integer outside cross-language safe range")
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError(f"{path}: non-finite number forbidden")
        if value.is_integer():
            n = int(value)
            if abs(n) > MAX_SAFE_INT:
                raise ValueError(f"{path}: integral float outside cross-language safe range")
            return n
        return value
    if isinstance(value, list):
        return [normalize_semantic(v, f"{path}[{i}]") for i, v in enumerate(value)]
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if not isinstance(k, str):
                raise ValueError(f"{path}: map keys must be strings")
            out[k] = normalize_semantic(v, f"{path}.{k}")
        return out
    raise ValueError(f"{path}: unsupported semantic value type {type(value).__name__}")


def canonical_json_bytes(value: Any) -> bytes:
    value = normalize_semantic(value)
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def canonical_state_bytes(value: Any) -> bytes:
    return _enc(normalize_semantic(value))


def canonical_state_hash(value: Any) -> str:
    return hashlib.sha256(canonical_state_bytes(value)).hexdigest()


def _uvarint(n: int) -> bytes:
    if not isinstance(n, int) or isinstance(n, bool) or n < 0:
        raise ValueError("uvarint requires non-negative int")
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        out.append(b | (0x80 if n else 0))
        if not n:
            return bytes(out)


def _read_uvarint(data: bytes, i: int) -> Tuple[int, int]:
    n = 0
    shift = 0
    for _ in range(10):
        if i >= len(data):
            raise ParseError("truncated varint")
        b = data[i]
        i += 1
        n |= (b & 0x7F) << shift
        if not (b & 0x80):
            return n, i
        shift += 7
    raise ParseError("varint too long")


# Canonical value types:
# 00 null, 01 false, 02 true, 03 uint, 04 negative int zigzag,
# 05 string, 06 bytes, 07 array, 08 map, 09 dictionary token, 0A float64 BE.
def _enc(v: Any) -> bytes:
    if v is None:
        return b"\x00"
    if v is False:
        return b"\x01"
    if v is True:
        return b"\x02"
    if isinstance(v, int) and not isinstance(v, bool):
        if v >= 0:
            return b"\x03" + _uvarint(v)
        return b"\x04" + _uvarint((-v * 2) - 1)
    if isinstance(v, float):
        if not math.isfinite(v):
            raise ValueError("non-finite floats forbidden")
        return b"\x0A" + struct.pack(">d", v)
    if isinstance(v, str):
        tok = TOKENS.get(v)
        if tok is not None:
            return b"\x09" + _uvarint(tok)
        b = v.encode("utf-8")
        return b"\x05" + _uvarint(len(b)) + b
    if isinstance(v, (bytes, bytearray)):
        b = bytes(v)
        return b"\x06" + _uvarint(len(b)) + b
    if isinstance(v, list):
        return b"\x07" + _uvarint(len(v)) + b"".join(_enc(x) for x in v)
    if isinstance(v, dict):
        if not all(isinstance(k, str) for k in v):
            raise ValueError("map keys must be strings")
        keys = sorted(v.keys(), key=lambda s: s.encode("utf-8"))
        return b"\x08" + _uvarint(len(keys)) + b"".join(_enc(k) + _enc(v[k]) for k in keys)
    raise ValueError(f"unsupported value type: {type(v).__name__}")


def _dec(data: bytes, i: int = 0) -> Tuple[Any, int]:
    if i >= len(data):
        raise ParseError("truncated value")
    t = data[i]
    i += 1
    if t == 0x00:
        return None, i
    if t == 0x01:
        return False, i
    if t == 0x02:
        return True, i
    if t == 0x03:
        return _read_uvarint(data, i)
    if t == 0x04:
        zz, i = _read_uvarint(data, i)
        return -((zz + 1) // 2), i
    if t == 0x0A:
        if i + 8 > len(data):
            raise ParseError("truncated float")
        return struct.unpack(">d", data[i:i+8])[0], i + 8
    if t in (0x05, 0x06):
        n, i = _read_uvarint(data, i)
        if i + n > len(data):
            raise ParseError("truncated bytes/string")
        b = data[i:i+n]
        i += n
        if t == 0x06:
            return b, i
        try:
            return b.decode("utf-8"), i
        except UnicodeDecodeError as exc:
            raise ParseError("invalid utf-8") from exc
    if t == 0x07:
        n, i = _read_uvarint(data, i)
        arr = []
        for _ in range(n):
            x, i = _dec(data, i)
            arr.append(x)
        return arr, i
    if t == 0x08:
        n, i = _read_uvarint(data, i)
        obj: Dict[str, Any] = {}
        last_key_bytes: Optional[bytes] = None
        for _ in range(n):
            k, i = _dec(data, i)
            if not isinstance(k, str):
                raise ParseError("map key not string")
            kb = k.encode("utf-8")
            if last_key_bytes is not None and kb <= last_key_bytes:
                raise ParseError("map keys not canonical or duplicate")
            last_key_bytes = kb
            v, i = _dec(data, i)
            obj[k] = v
        return obj, i
    if t == 0x09:
        tok, i = _read_uvarint(data, i)
        s = TOKEN_BY_ID.get(tok)
        if s is None:
            raise ParseError("undefined dictionary token")
        return s, i
    raise ParseError(f"unknown type byte {t:#x}")


def encode_packet(packet: Dict[str, Any], validate: bool = True) -> bytes:
    try:
        packet = normalize_semantic(packet)
    except ValueError as exc:
        raise ValidationError([str(exc)]) from exc
    if validate:
        vr = validate_packet(packet)
        if not vr.ok:
            raise ValidationError(vr.errors)
    body = _enc(packet)
    prefix = BEACON + bytes([WIRE_VERSION, FLAGS]) + _uvarint(len(body)) + body
    digest = hashlib.sha256(prefix).digest()
    return prefix + digest


def decode_untrusted(frame: bytes) -> Dict[str, Any]:
    if not isinstance(frame, (bytes, bytearray)):
        raise ParseError("frame must be bytes")
    data = bytes(frame)
    if len(data) < len(BEACON) + 2 + 1 + 32:
        raise ParseError("frame too short")
    if data[:len(BEACON)] != BEACON:
        raise ParseError("beacon mismatch")
    i = len(BEACON)
    if data[i] != WIRE_VERSION:
        raise ParseError("unsupported wire version")
    i += 1
    if data[i] != FLAGS:
        raise ParseError("unsupported flags")
    i += 1
    body_len, i = _read_uvarint(data, i)
    body_end = i + body_len
    if body_end + 32 != len(data):
        raise ParseError("frame length mismatch")
    prefix = data[:body_end]
    if hashlib.sha256(prefix).digest() != data[body_end:]:
        raise ParseError("frame integrity mismatch")
    packet, j = _dec(data[i:body_end], 0)
    if j != body_len:
        raise ParseError("trailing body bytes")
    if not isinstance(packet, dict):
        raise ParseError("packet root must be object")
    try:
        canonical_packet = normalize_semantic(packet)
        canonical_body = _enc(canonical_packet)
    except ValueError as exc:
        raise ParseError(f"invalid semantic value domain: {exc}") from exc
    if canonical_body != data[i:body_end]:
        raise ParseError("noncanonical body encoding")
    return canonical_packet


def trusted_decode(frame: bytes) -> Dict[str, Any]:
    packet = decode_untrusted(frame)
    vr = validate_packet(packet)
    if not vr.ok:
        raise ValidationError(vr.errors)
    return packet


def packet_hash(packet: Dict[str, Any]) -> str:
    return hashlib.sha256(_enc(normalize_semantic(packet))).hexdigest()


def _nonempty(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def _exact(obj: Any, required: Iterable[str], optional: Iterable[str], path: str, errors: List[str]) -> bool:
    if not isinstance(obj, dict):
        errors.append(f"{path}: must be object")
        return False
    req, opt = set(required), set(optional)
    missing = req - set(obj)
    extra = set(obj) - req - opt
    if missing:
        errors.append(f"{path}: missing fields {sorted(missing)}")
    if extra:
        errors.append(f"{path}: unsupported fields {sorted(extra)}")
    return not missing and not extra


def _iso(v: Any) -> bool:
    if v is None:
        return True
    if not isinstance(v, str) or not v:
        return False
    try:
        datetime.fromisoformat(v.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _sha(v: Any) -> bool:
    return isinstance(v, str) and bool(HEX64.fullmatch(v))


def _validate_condition_list(items: Any, path: str, errors: List[str], resume: bool = False) -> None:
    if not isinstance(items, list):
        errors.append(f"{path}: list required")
        return
    for idx, item in enumerate(items):
        p = f"{path}[{idx}]"
        required = {"predicate", "condition"} if resume else {"effect", "predicate", "condition"}
        if not _exact(item, required, set(), p, errors):
            continue
        if item["predicate"] not in PREDICATES:
            errors.append(f"{p}.predicate: invalid")
        if not _nonempty(item["condition"]):
            errors.append(f"{p}.condition: nonempty string required")
        if not resume and item["effect"] not in STOP_EFFECTS:
            errors.append(f"{p}.effect: invalid")


def _validate_control(c: Any, errors: List[str]) -> None:
    req = {"job_id","current_state","disposition","verdict","holds","pins","stop_conditions","resume_conditions","prohibited_actions","capabilities","action_authorized","authority","next_action","dependencies","completion_condition","revision"}
    if not _exact(c, req, {"context_id"}, "control", errors):
        return
    if not _nonempty(c["job_id"]): errors.append("control.job_id: nonempty required")
    if "context_id" in c and not _nonempty(c["context_id"]): errors.append("control.context_id: nonempty if present")
    if not _nonempty(c["current_state"]): errors.append("control.current_state: nonempty required")
    if c["disposition"] not in DISPOSITIONS: errors.append("control.disposition: invalid")
    if not isinstance(c["revision"], int) or isinstance(c["revision"], bool) or c["revision"] < 1: errors.append("control.revision: positive integer required")

    v = c["verdict"]
    if _exact(v, {"status","source","final"}, set(), "control.verdict", errors):
        if v["status"] not in VERDICTS: errors.append("control.verdict.status: invalid")
        if not _nonempty(v["source"]): errors.append("control.verdict.source: nonempty required")
        if not isinstance(v["final"], bool): errors.append("control.verdict.final: bool required")

    a = c["authority"]
    if _exact(a, AXES, set(), "control.authority", errors):
        for axis in AXES:
            if a[axis] not in TRI: errors.append(f"control.authority.{axis}: invalid")
    if c["action_authorized"] not in TRI: errors.append("control.action_authorized: invalid")

    caps = c["capabilities"]
    if not isinstance(caps, dict):
        errors.append("control.capabilities: object required")
    else:
        for k, value in caps.items():
            if not _nonempty(k): errors.append("control.capabilities: nonempty keys required")
            if value not in CAP_STATES: errors.append(f"control.capabilities.{k}: invalid")

    holds = c["holds"]
    if not isinstance(holds, list):
        errors.append("control.holds: list required")
    else:
        seen = set()
        for idx, h in enumerate(holds):
            p = f"control.holds[{idx}]"
            if not _exact(h, {"id","blocks","condition"}, set(), p, errors): continue
            if not _nonempty(h["id"]): errors.append(f"{p}.id: nonempty required")
            elif h["id"] in seen: errors.append(f"{p}.id: duplicate")
            seen.add(h.get("id"))
            if not isinstance(h["blocks"], list) or not h["blocks"] or any((x not in ACTION_TYPES and x != "*") for x in h["blocks"]): errors.append(f"{p}.blocks: nonempty action list required")
            if not _nonempty(h["condition"]): errors.append(f"{p}.condition: nonempty required")

    pins = c["pins"]
    if not isinstance(pins, list): errors.append("control.pins: list required")
    else:
        seen = set()
        for idx, pin in enumerate(pins):
            p = f"control.pins[{idx}]"
            if not _exact(pin, {"id","kind","value"}, {"algorithm"}, p, errors): continue
            if not _nonempty(pin["id"]): errors.append(f"{p}.id: nonempty required")
            elif pin["id"] in seen: errors.append(f"{p}.id: duplicate")
            seen.add(pin.get("id"))
            if pin["kind"] not in PIN_KINDS: errors.append(f"{p}.kind: invalid")
            if not _nonempty(pin["value"]): errors.append(f"{p}.value: nonempty required")
            if pin["kind"] == "SHA256" and not _sha(pin["value"]): errors.append(f"{p}.value: sha256 required")
            if pin["kind"] == "GIT_COMMIT" and not HEX40.fullmatch(pin["value"]): errors.append(f"{p}.value: 40-char git hash required")

    _validate_condition_list(c["stop_conditions"], "control.stop_conditions", errors, False)
    _validate_condition_list(c["resume_conditions"], "control.resume_conditions", errors, True)

    pa = c["prohibited_actions"]
    if not isinstance(pa, list) or any(x not in PROHIBITED_ACTIONS for x in pa): errors.append("control.prohibited_actions: invalid")
    elif len(pa) != len(set(pa)): errors.append("control.prohibited_actions: duplicates")

    deps = c["dependencies"]
    if not isinstance(deps, list): errors.append("control.dependencies: list required")
    else:
        ids = set()
        for idx, dep in enumerate(deps):
            p = f"control.dependencies[{idx}]"
            if not _exact(dep, {"id","state"}, set(), p, errors): continue
            if not _nonempty(dep["id"]): errors.append(f"{p}.id: nonempty required")
            elif dep["id"] in ids: errors.append(f"{p}.id: duplicate")
            ids.add(dep.get("id"))
            if dep["state"] not in DEPENDENCY_STATES: errors.append(f"{p}.state: invalid")

    cc = c["completion_condition"]
    if cc is not None:
        if _exact(cc, {"state","condition"}, set(), "control.completion_condition", errors):
            if cc["state"] not in COMPLETION_STATES: errors.append("control.completion_condition.state: invalid")
            if not _nonempty(cc["condition"]): errors.append("control.completion_condition.condition: nonempty required")

    na = c["next_action"]
    action_type = None
    if not isinstance(na, dict) or "kind" not in na:
        errors.append("control.next_action: typed object required")
    elif na["kind"] == "NONE":
        if set(na) != {"kind"}: errors.append("control.next_action NONE: no additional fields")
    elif na["kind"] == "ACTION":
        req_action = {"kind","action_id","action_type","required_authority","required_capabilities","params_hash"}
        if _exact(na, req_action, set(), "control.next_action", errors):
            action_type = na["action_type"]
            if not _nonempty(na["action_id"]): errors.append("control.next_action.action_id: nonempty required")
            if action_type not in ACTION_TYPES: errors.append("control.next_action.action_type: invalid")
            ra = na["required_authority"]
            if not isinstance(ra, list) or any(x not in AXES for x in ra) or len(ra) != len(set(ra)): errors.append("control.next_action.required_authority: invalid")
            rc = na["required_capabilities"]
            if not isinstance(rc, list) or any(not _nonempty(x) for x in rc) or len(rc) != len(set(rc)): errors.append("control.next_action.required_capabilities: invalid")
            if not _sha(na["params_hash"]): errors.append("control.next_action.params_hash: sha256 required")
            if action_type in ACTION_TYPES and isinstance(ra, list):
                missing_axes = ACTION_MIN_AXES.get(action_type, set()) - set(ra)
                if missing_axes: errors.append(f"control.next_action.required_authority: missing minimum {sorted(missing_axes)}")
    else:
        errors.append("control.next_action.kind: invalid")

    # Operational contradictions.
    disp = c["disposition"]
    if disp == "EXECUTE":
        if not isinstance(na, dict) or na.get("kind") != "ACTION": errors.append("control: EXECUTE requires ACTION next_action")
        if c["action_authorized"] != "GRANTED": errors.append("control: EXECUTE requires action_authorized GRANTED")
        if action_type:
            required_axes = set(na.get("required_authority", []))
            for axis in required_axes:
                if isinstance(a, dict) and a.get(axis) != "GRANTED": errors.append(f"control: EXECUTE required authority {axis} not GRANTED")
            for cap in na.get("required_capabilities", []):
                if isinstance(caps, dict) and caps.get(cap) != "AVAILABLE": errors.append(f"control: EXECUTE capability {cap} not AVAILABLE")
            prohibition = ACTION_PROHIBITION.get(action_type)
            if prohibition and prohibition in pa: errors.append(f"control: {action_type} conflicts with {prohibition}")
            if "DO_NOT_EXECUTE" in pa and action_type not in {"READ","COMPUTE"}: errors.append("control: consequential ACTION conflicts with DO_NOT_EXECUTE")
            if isinstance(holds, list):
                for h in holds:
                    if isinstance(h, dict) and ("*" in h.get("blocks", []) or action_type in h.get("blocks", [])):
                        errors.append(f"control: hold {h.get('id')} blocks declared action")
            for sc in c["stop_conditions"] if isinstance(c["stop_conditions"], list) else []:
                if isinstance(sc, dict) and sc.get("predicate") == "ALWAYS" and sc.get("effect") in {"STOP","WAIT","DO_NOT_EXECUTE","REQUIRES_VERIFIER"}:
                    errors.append(f"control: unconditional stop condition {sc.get('effect')} conflicts with EXECUTE")
    else:
        if not isinstance(na, dict) or na.get("kind") != "NONE": errors.append(f"control: {disp} requires NEXT_ACTION NONE")

    if disp in {"WAIT","REQUIRES_VERIFIER","WAITING_AUTHORITY","WAITING_DEPENDENCY"} and isinstance(c["resume_conditions"], list) and len(c["resume_conditions"]) == 0:
        errors.append(f"control: {disp} requires explicit resume condition")
    if disp == "COMPLETE":
        if not isinstance(cc, dict) or cc.get("state") != "SATISFIED": errors.append("control: COMPLETE requires satisfied completion condition")
    if disp == "WAITING_DEPENDENCY" and isinstance(deps, list) and not any(isinstance(d, dict) and d.get("state") in {"WAITING","FAILED","UNKNOWN"} for d in deps):
        errors.append("control: WAITING_DEPENDENCY requires unresolved dependency")
    if disp == "WAITING_AUTHORITY" and isinstance(a, dict) and all(a.get(axis) == "GRANTED" for axis in AXES) and c["action_authorized"] == "GRANTED":
        errors.append("control: WAITING_AUTHORITY contradicts fully granted packet authority")


def _validate_event(event: Any, errors: List[str]) -> None:
    if not _exact(event, {"event_id","event_type","subject_ids","time","revision"}, {"location","severity"}, "event", errors): return
    if not _nonempty(event["event_id"]): errors.append("event.event_id: nonempty required")
    if not _nonempty(event["event_type"]): errors.append("event.event_type: nonempty required")
    if not isinstance(event["subject_ids"], list) or any(not _nonempty(x) for x in event["subject_ids"]): errors.append("event.subject_ids: string list required")
    if not _nonempty(event["revision"]): errors.append("event.revision: nonempty required")
    if "severity" in event and not _nonempty(event["severity"]): errors.append("event.severity: nonempty if present")
    t = event["time"]
    fields = {"occurred_at","observed_at","published_at","received_at","normalized_at","valid_from","valid_until"}
    if _exact(t, fields, set(), "event.time", errors):
        for k in fields:
            if not _iso(t[k]): errors.append(f"event.time.{k}: invalid timestamp")


def _validate_freshness(f: Any, path: str, errors: List[str]) -> None:
    if not _exact(f, {"state","observed_at","age_seconds","ttl_seconds"}, set(), path, errors): return
    if f["state"] not in FRESHNESS_STATES: errors.append(f"{path}.state: invalid")
    if not _iso(f["observed_at"]): errors.append(f"{path}.observed_at: invalid")
    for k in ("age_seconds","ttl_seconds"):
        if f[k] is not None and (not isinstance(f[k], (int,float)) or isinstance(f[k], bool) or f[k] < 0): errors.append(f"{path}.{k}: nonnegative number/null required")


def _validate_evidence(ev: Any, event_id: Optional[str], errors: List[str]) -> Tuple[set[str], Dict[str, Any]]:
    if not _exact(ev, {"observations","source_relations","evidence_paths","metrics"}, set(), "evidence", errors): return set(), {}
    observations = ev["observations"]
    obs_ids: set[str] = set()
    upstreams: set[str] = set()
    groups: set[str] = set()
    if not isinstance(observations, list): errors.append("evidence.observations: list required")
    else:
        for idx, ob in enumerate(observations):
            p = f"evidence.observations[{idx}]"
            req = {"observation_id","event_id","observer","adapter","upstream_source","observed_at","source_timestamp","raw_reference","content_hash","freshness","independence_group"}
            if not _exact(ob, req, set(), p, errors): continue
            for k in ("observation_id","event_id","observer","adapter","upstream_source","observed_at","raw_reference"):
                if not _nonempty(ob[k]): errors.append(f"{p}.{k}: nonempty required")
            if event_id is not None and ob["event_id"] != event_id: errors.append(f"{p}.event_id: does not match event")
            if ob["observation_id"] in obs_ids: errors.append(f"{p}.observation_id: duplicate")
            obs_ids.add(ob["observation_id"])
            upstreams.add(ob["upstream_source"])
            if ob["independence_group"] is not None:
                if not _nonempty(ob["independence_group"]): errors.append(f"{p}.independence_group: string/null required")
                else: groups.add(ob["independence_group"])
            if not _iso(ob["observed_at"]): errors.append(f"{p}.observed_at: invalid timestamp")
            if not _iso(ob["source_timestamp"]): errors.append(f"{p}.source_timestamp: invalid timestamp")
            if ob["content_hash"] is not None and not _sha(ob["content_hash"]): errors.append(f"{p}.content_hash: sha256/null required")
            _validate_freshness(ob["freshness"], f"{p}.freshness", errors)

    rels = ev["source_relations"]
    if not isinstance(rels, list): errors.append("evidence.source_relations: list required")
    else:
        for idx, r in enumerate(rels):
            p = f"evidence.source_relations[{idx}]"
            if not _exact(r, {"source_a","source_b","relation"}, set(), p, errors): continue
            if not _nonempty(r["source_a"]) or not _nonempty(r["source_b"]): errors.append(f"{p}: sources nonempty")
            if r["relation"] not in SOURCE_RELATIONS: errors.append(f"{p}.relation: invalid")

    metrics = ev["metrics"]
    if _exact(metrics, {"source_count","independent_source_count"}, set(), "evidence.metrics", errors):
        expected_source_count = len(upstreams)
        expected_independent = len(groups)
        if metrics["source_count"] != expected_source_count: errors.append(f"evidence.metrics.source_count: expected {expected_source_count}")
        if metrics["independent_source_count"] != expected_independent: errors.append(f"evidence.metrics.independent_source_count: expected conservative count {expected_independent}")

    paths = ev["evidence_paths"]
    if not isinstance(paths, list): errors.append("evidence.evidence_paths: list required")
    else:
        seen_paths = set()
        for idx, path in enumerate(paths):
            p = f"evidence.evidence_paths[{idx}]"
            if not _exact(path, {"path_id","nodes","edges"}, set(), p, errors): continue
            if not _nonempty(path["path_id"]): errors.append(f"{p}.path_id: nonempty")
            elif path["path_id"] in seen_paths: errors.append(f"{p}.path_id: duplicate")
            seen_paths.add(path.get("path_id"))
            nodes = path["nodes"]
            edges = path["edges"]
            if not isinstance(nodes, list) or len(nodes) < 2: errors.append(f"{p}.nodes: at least 2")
            else:
                node_ids = []
                for ni, node in enumerate(nodes):
                    np = f"{p}.nodes[{ni}]"
                    if not _exact(node, {"node_id","node_type","ref"}, set(), np, errors): continue
                    if not _nonempty(node["node_id"]) or not _nonempty(node["ref"]): errors.append(f"{np}: ids/ref nonempty")
                    if node["node_type"] not in PATH_NODE_TYPES: errors.append(f"{np}.node_type: invalid")
                    node_ids.append(node.get("node_id"))
                if len(node_ids) != len(set(node_ids)): errors.append(f"{p}.nodes: duplicate node ids")
                if not isinstance(edges, list) or len(edges) != max(0, len(nodes)-1): errors.append(f"{p}.edges: must explicitly link every adjacent transformation")
                elif len(node_ids) == len(nodes):
                    for ei, edge in enumerate(edges):
                        ep = f"{p}.edges[{ei}]"
                        if not _exact(edge, {"from","to","relation"}, {"transform_ref"}, ep, errors): continue
                        if edge["from"] != node_ids[ei] or edge["to"] != node_ids[ei+1]: errors.append(f"{ep}: must connect adjacent path nodes in order")
                        if edge["relation"] not in PATH_RELATIONS: errors.append(f"{ep}.relation: invalid")
    return obs_ids, {"source_count": len(upstreams), "independent_source_count": len(groups)}


def _validate_epistemic(ep: Any, obs_ids: set[str], errors: List[str]) -> set[str]:
    req = {"claims","unknowns","conflicts","evidence_sufficiency","evidence_requests","positions","agreements"}
    if not _exact(ep, req, set(), "epistemic", errors): return set()
    claim_ids: set[str] = set()
    claims_by_key: Dict[Tuple[str,str], List[dict]] = {}
    claims = ep["claims"]
    if not isinstance(claims, list): errors.append("epistemic.claims: list required")
    else:
        for idx, cl in enumerate(claims):
            p = f"epistemic.claims[{idx}]"
            if not _exact(cl, {"claim_id","subject","predicate","value","status","confidence","evidence_refs"}, set(), p, errors): continue
            for k in ("claim_id","subject","predicate"):
                if not _nonempty(cl[k]): errors.append(f"{p}.{k}: nonempty required")
            if cl["claim_id"] in claim_ids: errors.append(f"{p}.claim_id: duplicate")
            claim_ids.add(cl["claim_id"])
            if cl["status"] not in CLAIM_STATES: errors.append(f"{p}.status: invalid")
            conf = cl["confidence"]
            if conf is not None and (not isinstance(conf, (int,float)) or isinstance(conf, bool) or not 0 <= conf <= 1): errors.append(f"{p}.confidence: 0..1/null")
            if not isinstance(cl["evidence_refs"], list) or any(not _nonempty(x) for x in cl["evidence_refs"]): errors.append(f"{p}.evidence_refs: string list")
            elif obs_ids and any(x not in obs_ids for x in cl["evidence_refs"]): errors.append(f"{p}.evidence_refs: unknown observation")
            claims_by_key.setdefault((cl["subject"], cl["predicate"]), []).append(cl)

    unknowns = ep["unknowns"]
    if not isinstance(unknowns, list): errors.append("epistemic.unknowns: list required")
    else:
        fields = set()
        for idx, u in enumerate(unknowns):
            p = f"epistemic.unknowns[{idx}]"
            if not _exact(u, {"field","state","reason"}, set(), p, errors): continue
            if not _nonempty(u["field"]): errors.append(f"{p}.field: nonempty")
            elif u["field"] in fields: errors.append(f"{p}.field: duplicate")
            fields.add(u.get("field"))
            if u["state"] not in UNKNOWN_STATES: errors.append(f"{p}.state: invalid")
            if u["reason"] is not None and not _nonempty(u["reason"]): errors.append(f"{p}.reason: nonempty/null")

    conflicts = ep["conflicts"]
    conflict_keys: set[Tuple[str,str]] = set()
    if not isinstance(conflicts, list): errors.append("epistemic.conflicts: list required")
    else:
        ids = set()
        for idx, co in enumerate(conflicts):
            p = f"epistemic.conflicts[{idx}]"
            if not _exact(co, {"conflict_id","claim_ids","conflict_type","unresolved_fields","severity","resolution_state"}, set(), p, errors): continue
            if not _nonempty(co["conflict_id"]): errors.append(f"{p}.conflict_id: nonempty")
            elif co["conflict_id"] in ids: errors.append(f"{p}.conflict_id: duplicate")
            ids.add(co.get("conflict_id"))
            if not isinstance(co["claim_ids"], list) or len(set(co["claim_ids"])) < 2 or any(x not in claim_ids for x in co["claim_ids"]): errors.append(f"{p}.claim_ids: >=2 known distinct claims")
            if co["conflict_type"] not in CONFLICT_TYPES: errors.append(f"{p}.conflict_type: invalid")
            if not isinstance(co["unresolved_fields"], list): errors.append(f"{p}.unresolved_fields: list")
            if co["severity"] is not None and not _nonempty(co["severity"]): errors.append(f"{p}.severity: nonempty/null")
            if co["resolution_state"] not in CONFLICT_STATES: errors.append(f"{p}.resolution_state: invalid")
            if isinstance(co["claim_ids"], list):
                involved = [cl for arr in claims_by_key.values() for cl in arr if cl.get("claim_id") in co["claim_ids"]]
                for cl in involved:
                    conflict_keys.add((cl.get("subject"), cl.get("predicate")))

    # Multiple live incompatible values for the same subject/predicate require explicit conflict.
    for key, arr in claims_by_key.items():
        live = [x for x in arr if x.get("status") not in {"RETRACTED","SUPERSEDED"}]
        values = {json.dumps(x.get("value"), sort_keys=True, ensure_ascii=False) for x in live}
        if len(values) > 1 and key not in conflict_keys:
            errors.append(f"epistemic: incompatible live values for {key} require explicit conflict")

    if ep["evidence_sufficiency"] not in SUFFICIENCY: errors.append("epistemic.evidence_sufficiency: invalid")

    reqs = ep["evidence_requests"]
    if not isinstance(reqs, list): errors.append("epistemic.evidence_requests: list")
    else:
        for idx, r in enumerate(reqs):
            p = f"epistemic.evidence_requests[{idx}]"
            if not _exact(r, {"request_id","subject","missing_fact","desired_source_class","reason"}, set(), p, errors): continue
            if any(not _nonempty(r[k]) for k in ("request_id","subject","missing_fact","desired_source_class","reason")): errors.append(f"{p}: all fields nonempty")

    positions = ep["positions"]
    if not isinstance(positions, list): errors.append("epistemic.positions: list")
    else:
        for idx, pos in enumerate(positions):
            p = f"epistemic.positions[{idx}]"
            if not _exact(pos, {"agent_id","claim_id","stance","confidence","evidence_refs"}, set(), p, errors): continue
            if not _nonempty(pos["agent_id"]) or pos["claim_id"] not in claim_ids: errors.append(f"{p}: invalid agent/claim")
            if pos["stance"] not in VIEW_STANCES: errors.append(f"{p}.stance: invalid")
            if pos["confidence"] is not None and (not isinstance(pos["confidence"], (int,float)) or isinstance(pos["confidence"], bool) or not 0 <= pos["confidence"] <= 1): errors.append(f"{p}.confidence: invalid")
            if not isinstance(pos["evidence_refs"], list): errors.append(f"{p}.evidence_refs: list")

    agreements = ep["agreements"]
    if not isinstance(agreements, list): errors.append("epistemic.agreements: list")
    else:
        for idx, ag in enumerate(agreements):
            p = f"epistemic.agreements[{idx}]"
            if not _exact(ag, {"claim_id","participants","agreement_ratio","dissenters"}, set(), p, errors): continue
            if ag["claim_id"] not in claim_ids: errors.append(f"{p}.claim_id: unknown")
            if not isinstance(ag["participants"], list) or len(ag["participants"]) == 0: errors.append(f"{p}.participants: nonempty list")
            if not isinstance(ag["dissenters"], list): errors.append(f"{p}.dissenters: list")
            ratio = ag["agreement_ratio"]
            if not isinstance(ratio, (int,float)) or isinstance(ratio, bool) or not 0 <= ratio <= 1: errors.append(f"{p}.agreement_ratio: 0..1")
    return claim_ids


def _validate_view(view: Any, event_id: Optional[str], obs_ids: set[str], claim_ids: set[str], errors: List[str]) -> None:
    req = {"agent_id","event_id","observation_ids","received_claim_ids","accepted_claim_ids","rejected_claim_ids","unresolved_claim_ids","inferred_claims","context_cutoff"}
    if not _exact(view, req, set(), "view", errors): return
    if not _nonempty(view["agent_id"]): errors.append("view.agent_id: nonempty")
    if event_id is not None and view["event_id"] != event_id: errors.append("view.event_id: event mismatch")
    for key in ("observation_ids","received_claim_ids","accepted_claim_ids","rejected_claim_ids","unresolved_claim_ids"):
        if not isinstance(view[key], list) or len(view[key]) != len(set(view[key])): errors.append(f"view.{key}: unique list required")
    if isinstance(view["observation_ids"], list) and obs_ids and any(x not in obs_ids for x in view["observation_ids"]): errors.append("view.observation_ids: unknown observation")
    if isinstance(view["received_claim_ids"], list) and claim_ids and any(x not in claim_ids for x in view["received_claim_ids"]): errors.append("view.received_claim_ids: unknown claim")
    received = set(view["received_claim_ids"]) if isinstance(view["received_claim_ids"], list) else set()
    accepted = set(view["accepted_claim_ids"]) if isinstance(view["accepted_claim_ids"], list) else set()
    rejected = set(view["rejected_claim_ids"]) if isinstance(view["rejected_claim_ids"], list) else set()
    unresolved = set(view["unresolved_claim_ids"]) if isinstance(view["unresolved_claim_ids"], list) else set()
    if not accepted <= received: errors.append("view.accepted_claim_ids: acceptance requires receipt")
    if not rejected <= received: errors.append("view.rejected_claim_ids: rejection requires receipt")
    if not unresolved <= received: errors.append("view.unresolved_claim_ids: unresolved requires receipt")
    if accepted & rejected or accepted & unresolved or rejected & unresolved: errors.append("view: claim stance sets must be disjoint")
    if not isinstance(view["inferred_claims"], list): errors.append("view.inferred_claims: list")
    else:
        for idx, cl in enumerate(view["inferred_claims"]):
            p = f"view.inferred_claims[{idx}]"
            if not isinstance(cl, dict) or cl.get("status") != "INFERRED": errors.append(f"{p}: must remain typed INFERRED")
    if not _iso(view["context_cutoff"]): errors.append("view.context_cutoff: invalid timestamp/null")


def _validate_memory(memory: Any, errors: List[str]) -> None:
    if not _exact(memory, {"refs"}, set(), "memory", errors): return
    if not isinstance(memory["refs"], list): errors.append("memory.refs: list")
    else:
        for idx, ref in enumerate(memory["refs"]):
            p = f"memory.refs[{idx}]"
            if not _exact(ref, {"memory_class","origin","retained_at","retrieved_at","source_event"}, set(), p, errors): continue
            if ref["memory_class"] not in MEMORY_CLASSES: errors.append(f"{p}.memory_class: invalid")
            if not _nonempty(ref["origin"]): errors.append(f"{p}.origin: nonempty")
            if not _iso(ref["retained_at"]) or not _iso(ref["retrieved_at"]): errors.append(f"{p}: invalid memory timestamp")
            if ref["source_event"] is not None and not _nonempty(ref["source_event"]): errors.append(f"{p}.source_event: nonempty/null")
            if ref["memory_class"] == "RETRIEVED_EXTERNAL" and ref["retrieved_at"] is None: errors.append(f"{p}: retrieved external requires retrieved_at")
            if ref["memory_class"] == "EPISODIC_AGENT" and ref["retained_at"] is None: errors.append(f"{p}: episodic memory requires retained_at")


def _validate_delta(delta: Any, errors: List[str]) -> None:
    req = {"base_event_id","base_revision","base_hash","new_revision","operations","unresolved"}
    if not _exact(delta, req, set(), "delta", errors): return
    if not _nonempty(delta["base_event_id"]) or not _nonempty(delta["base_revision"]) or not _nonempty(delta["new_revision"]): errors.append("delta: ids/revisions nonempty")
    if delta["base_revision"] == delta["new_revision"]: errors.append("delta: new_revision must differ from base_revision")
    if not _sha(delta["base_hash"]): errors.append("delta.base_hash: sha256 required")
    if not isinstance(delta["operations"], list): errors.append("delta.operations: list")
    else:
        for idx, op in enumerate(delta["operations"]):
            p = f"delta.operations[{idx}]"
            if not isinstance(op, dict): errors.append(f"{p}: object"); continue
            expected = {"op","path"} if op.get("op") == "remove" else {"op","path","value"}
            if not _exact(op, expected, set(), p, errors): continue
            if op["op"] not in {"add","replace","remove"}: errors.append(f"{p}.op: invalid")
            if not isinstance(op["path"], str) or not op["path"].startswith("/"): errors.append(f"{p}.path: JSON pointer required")
    if not isinstance(delta["unresolved"], list): errors.append("delta.unresolved: list")


def _validate_handoff(h: Any, errors: List[str]) -> None:
    if not _exact(h, {"sender","receiver","objective","revision","provenance"}, set(), "handoff", errors): return
    if any(not _nonempty(h[k]) for k in ("sender","receiver","objective","revision")): errors.append("handoff: sender/receiver/objective/revision nonempty")
    if not isinstance(h["provenance"], list) or any(not _nonempty(x) for x in h["provenance"]): errors.append("handoff.provenance: string list")


def _validate_transforms(ts: Any, errors: List[str]) -> None:
    if not isinstance(ts, list): errors.append("transforms: list required"); return
    for idx, tr in enumerate(ts):
        p = f"transforms[{idx}]"
        req = {"transform_type","input_hash","output_hash","preserved_fields","omitted_fields","loss_class","justification"}
        if not _exact(tr, req, set(), p, errors): continue
        if tr["transform_type"] not in TRANSFORM_TYPES: errors.append(f"{p}.transform_type: invalid")
        if not _sha(tr["input_hash"]) or not _sha(tr["output_hash"]): errors.append(f"{p}: sha256 hashes required")
        if not isinstance(tr["preserved_fields"], list) or not isinstance(tr["omitted_fields"], list): errors.append(f"{p}: field lists required")
        if tr["loss_class"] not in LOSS_CLASSES: errors.append(f"{p}.loss_class: invalid")
        if tr["loss_class"] in {"EPISTEMIC","OPERATIONAL"}: errors.append(f"{p}: {tr['loss_class']} loss invalid for trusted RC2 handoff")
        if tr["loss_class"] == "NON_CRITICAL" and not _nonempty(tr["justification"]): errors.append(f"{p}: NON_CRITICAL loss requires justification")
        if tr["loss_class"] in {"NONE","PRESENTATIONAL"} and tr["justification"] is not None and not _nonempty(tr["justification"]): errors.append(f"{p}.justification: nonempty/null")


def validate_packet(packet: Any) -> ValidationResult:
    errors: List[str] = []
    try:
        packet = normalize_semantic(packet)
    except ValueError as exc:
        return ValidationResult(False, [f"semantic-domain: {exc}"], True)
    req = {"protocol","status","packet_id","profiles","control","payload"}
    opt = {"event","evidence","epistemic","view","memory","delta","handoff","transforms"}
    if not _exact(packet, req, opt, "packet", errors): return ValidationResult(False, errors)
    if packet["protocol"] != PROTOCOL: errors.append("packet.protocol: unsupported")
    if packet["status"] != STATUS: errors.append("packet.status: must remain REPAIR_CANDIDATE")
    if not _nonempty(packet["packet_id"]): errors.append("packet.packet_id: nonempty required")
    profiles = packet["profiles"]
    if not isinstance(profiles, list) or not profiles or len(profiles) != len(set(profiles)) or any(x not in PROFILES for x in profiles):
        errors.append("packet.profiles: unique supported profile list required")
        profiles = []
    elif "CONTROL" not in profiles:
        errors.append("packet.profiles: CONTROL mandatory")
    # Profile declaration is exact: no undeclared semantic objects, no missing declared objects.
    mapping = {"EVENT":"event","EVIDENCE":"evidence","EPISTEMIC":"epistemic","VIEW":"view","MEMORY":"memory","DELTA":"delta","HANDOFF":"handoff"}
    for profile, key in mapping.items():
        if profile in profiles and key not in packet: errors.append(f"packet: profile {profile} declared but {key} missing")
        if profile not in profiles and key in packet: errors.append(f"packet: {key} present without declared profile {profile}")
    if not isinstance(packet["payload"], dict): errors.append("packet.payload: object required")

    _validate_control(packet["control"], errors)
    event_id = None
    if "EVENT" in profiles and isinstance(packet.get("event"), dict):
        _validate_event(packet["event"], errors)
        event_id = packet["event"].get("event_id")
    obs_ids: set[str] = set()
    if "EVIDENCE" in profiles:
        obs_ids, _ = _validate_evidence(packet.get("evidence"), event_id, errors)
    claim_ids: set[str] = set()
    if "EPISTEMIC" in profiles:
        claim_ids = _validate_epistemic(packet.get("epistemic"), obs_ids, errors)
    if "VIEW" in profiles:
        _validate_view(packet.get("view"), event_id, obs_ids, claim_ids, errors)
    if "MEMORY" in profiles:
        _validate_memory(packet.get("memory"), errors)
    if "DELTA" in profiles:
        _validate_delta(packet.get("delta"), errors)
    if "HANDOFF" in profiles:
        _validate_handoff(packet.get("handoff"), errors)
    if "transforms" in packet:
        _validate_transforms(packet["transforms"], errors)
    return ValidationResult(not errors, errors)


def intersect_authority(packet_auth: Dict[str,str], local_auth: Dict[str,str]) -> Dict[str,str]:
    out = {}
    for axis in AXES:
        p = packet_auth.get(axis, "UNKNOWN")
        l = local_auth.get(axis, "UNKNOWN")
        if p == "DENIED" or l == "DENIED": out[axis] = "DENIED"
        elif p == "GRANTED" and l == "GRANTED": out[axis] = "GRANTED"
        else: out[axis] = "UNKNOWN"
    return out


def can_execute(packet: Dict[str,Any], local_authority: Dict[str,str], local_capabilities: Dict[str,str], local_action_authorized: str) -> Tuple[bool, str]:
    vr = validate_packet(packet)
    if not vr.ok: return False, "INVALID_PACKET"
    c = packet["control"]
    if c["disposition"] != "EXECUTE": return False, "DISPOSITION_NOT_EXECUTE"
    if c["next_action"]["kind"] != "ACTION": return False, "NO_ACTION"
    if c["action_authorized"] != "GRANTED" or local_action_authorized != "GRANTED": return False, "ACTION_NOT_AUTHORIZED"
    effective = intersect_authority(c["authority"], local_authority)
    for axis in c["next_action"]["required_authority"]:
        if effective[axis] != "GRANTED": return False, f"AUTHORITY_{axis}_{effective[axis]}"
    for cap in c["next_action"]["required_capabilities"]:
        p = c["capabilities"].get(cap, "UNKNOWN")
        l = local_capabilities.get(cap, "UNKNOWN")
        if p != "AVAILABLE" or l != "AVAILABLE": return False, f"CAPABILITY_{cap}_NOT_AVAILABLE"
    return True, "AUTHORIZED"


def _json_pointer_tokens(path: str) -> List[str]:
    if path == "": return []
    if not path.startswith("/"): raise ValidationError(["delta path must be JSON pointer"])
    return [x.replace("~1", "/").replace("~0", "~") for x in path[1:].split("/")]


def _pointer_parent(doc: Any, path: str) -> Tuple[Any, str]:
    parts = _json_pointer_tokens(path)
    if not parts: raise ValidationError(["delta operation cannot replace packet root"])
    cur = doc
    for part in parts[:-1]:
        if isinstance(cur, list):
            try: cur = cur[int(part)]
            except (ValueError, IndexError): raise ValidationError([f"delta path unavailable: {path}"])
        elif isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            raise ValidationError([f"delta path unavailable: {path}"])
    return cur, parts[-1]


def apply_delta(base_state: Dict[str,Any], delta: Dict[str,Any]) -> Dict[str,Any]:
    errors: List[str] = []
    _validate_delta(delta, errors)
    if errors: raise ValidationError(errors)
    if base_state.get("event_id") != delta["base_event_id"]: raise ValidationError(["BASE_STATE_UNAVAILABLE:event_id"])
    if base_state.get("revision") != delta["base_revision"]: raise ValidationError(["BASE_STATE_UNAVAILABLE:revision"])
    if canonical_state_hash(base_state) != delta["base_hash"]: raise ValidationError(["BASE_STATE_UNAVAILABLE:hash"])
    out = copy.deepcopy(base_state)
    for op in delta["operations"]:
        parent, key = _pointer_parent(out, op["path"])
        if isinstance(parent, list):
            if key == "-" and op["op"] == "add": parent.append(copy.deepcopy(op["value"])); continue
            try: idx = int(key)
            except ValueError: raise ValidationError([f"delta list path invalid: {op['path']}"])
            if op["op"] == "remove":
                if idx < 0 or idx >= len(parent): raise ValidationError([f"delta path unavailable: {op['path']}"])
                parent.pop(idx)
            elif op["op"] == "replace":
                if idx < 0 or idx >= len(parent): raise ValidationError([f"delta path unavailable: {op['path']}"])
                parent[idx] = copy.deepcopy(op["value"])
            else:
                if idx < 0 or idx > len(parent): raise ValidationError([f"delta path unavailable: {op['path']}"])
                parent.insert(idx, copy.deepcopy(op["value"]))
        elif isinstance(parent, dict):
            if op["op"] == "remove":
                if key not in parent: raise ValidationError([f"delta path unavailable: {op['path']}"])
                del parent[key]
            elif op["op"] == "replace":
                if key not in parent: raise ValidationError([f"delta path unavailable: {op['path']}"])
                parent[key] = copy.deepcopy(op["value"])
            else:
                parent[key] = copy.deepcopy(op["value"])
        else:
            raise ValidationError([f"delta parent invalid: {op['path']}"])
    if isinstance(out, dict): out["revision"] = delta["new_revision"]
    return out
