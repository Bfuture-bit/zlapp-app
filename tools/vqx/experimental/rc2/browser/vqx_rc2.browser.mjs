/* Browser-compatible port of frozen js/vqx_rc2.mjs.
 * Frozen source SHA-256: b6b4ef322463c7b30146b1fc7d50114ab98e044c98f07d8738271912caaa5ea0
 * This file adds a Buffer/sha256 shim only. Encode/decode/validate logic is the frozen candidate.
 * Execution authority remains none. This module never installs or runs host actions.
 */
const te = new TextEncoder();
const td = new TextDecoder();

function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
function sha256(bytes) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const bitLen = u8.length * 8;
  const withOne = u8.length + 1;
  const padded = ((withOne + 8 + 63) >> 6) << 6;
  const buf = new Uint8Array(padded);
  buf.set(u8);
  buf[u8.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padded - 4, bitLen >>> 0);
  const W = new Uint32Array(64);
  for (let off = 0; off < padded; off += 64) {
    for (let t = 0; t < 16; t++) W[t] = view.getUint32(off + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, W[t-15]) ^ rotr(18, W[t-15]) ^ (W[t-15] >>> 3);
      const s1 = rotr(17, W[t-2]) ^ rotr(19, W[t-2]) ^ (W[t-2] >>> 10);
      W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) ov.setUint32(i * 4, H[i]);
  return out;
}

class Buffer extends Uint8Array {
  static from(input, enc) {
    if (input instanceof Buffer) return new Buffer(input);
    if (input instanceof Uint8Array) return new Buffer(input);
    if (ArrayBuffer.isView(input)) return new Buffer(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
    if (enc === 'hex') {
      const s = String(input).replace(/[^0-9a-fA-F]/g, '');
      const out = new Buffer(s.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
      return out;
    }
    if (enc === 'utf8' || typeof input === 'string') return new Buffer(te.encode(String(input)));
    if (Array.isArray(input) || typeof input === 'number') return new Buffer(input);
    throw new Error('Buffer.from unsupported');
  }
  static alloc(n) { return new Buffer(n); }
  static concat(parts) {
    const arr = parts.map((p) => (p instanceof Uint8Array ? p : Buffer.from(p)));
    const len = arr.reduce((n, p) => n + p.length, 0);
    const out = new Buffer(len);
    let o = 0;
    for (const p of arr) { out.set(p, o); o += p.length; }
    return out;
  }
  static compare(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
  }
  static isBuffer(v) { return v instanceof Uint8Array; }
  equals(other) {
    if (!other || this.length !== other.length) return false;
    for (let i = 0; i < this.length; i++) if (this[i] !== other[i]) return false;
    return true;
  }
  subarray(start, end) { return new Buffer(super.subarray(start, end)); }
  writeDoubleBE(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, false); return offset + 8; }
  readDoubleBE(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, false); }
  toString(enc) {
    if (enc === 'hex') return Array.from(this, (x) => x.toString(16).padStart(2, '0')).join('');
    return td.decode(this);
  }
}

const crypto = {
  createHash() {
    const chunks = [];
    return {
      update(u) { chunks.push(u instanceof Uint8Array ? u : Buffer.from(u)); return this; },
      digest(enc) {
        const out = sha256(Buffer.concat(chunks));
        if (enc === 'hex') return Array.from(out, (x) => x.toString(16).padStart(2, '0')).join('');
        return Buffer.from(out);
      }
    };
  }
};


export const BEACON = Buffer.from('d3a75ce19b02','hex');
export const WIRE_VERSION = 0xFD;
export const FLAGS = 0x00;
export const PROTOCOL = 'VQX-RC2';
export const STATUS = 'REPAIR_CANDIDATE';
export const AXES = ['READ','COMPUTE','DISCLOSURE','NETWORK','EXECUTION','BUDGET'];
const PROFILES = new Set(['CONTROL','EVENT','EVIDENCE','EPISTEMIC','VIEW','MEMORY','DELTA','HANDOFF']);
const DISPOSITIONS = new Set(['EXECUTE','WAIT','STOP','COMPLETE','REQUIRES_VERIFIER','WAITING_AUTHORITY','WAITING_DEPENDENCY']);
const TRI = new Set(['GRANTED','DENIED','UNKNOWN']);
const CAP_STATES = new Set(['AVAILABLE','UNAVAILABLE','UNKNOWN']);
const VERDICTS = new Set(['PASS','FAIL','BLOCKED','CONDITIONAL','INCONCLUSIVE','UNREVIEWED','UNKNOWN']);
const ACTION_TYPES = new Set(['READ','COMPUTE','VERIFY','RETRY','DEPLOY','MERGE','DISCLOSE','NETWORK','SPEND','MUTATE','OTHER']);
const PROHIBITED_ACTIONS = new Set(['DO_NOT_RETRY','DO_NOT_EXECUTE','DO_NOT_DEPLOY','DO_NOT_MERGE','DO_NOT_DISCLOSE','DO_NOT_NETWORK','DO_NOT_SPEND']);
const CLAIM_STATES = new Set(['OBSERVED','SUPPORTED','CONTESTED','INFERRED','UNVERIFIED','UNKNOWN','RETRACTED','SUPERSEDED']);
const UNKNOWN_STATES = new Set(['UNKNOWN','NOT_OBSERVED','NOT_REPORTED','NOT_AVAILABLE','WITHHELD','NOT_APPLICABLE','CONFLICTED']);
const MEMORY_CLASSES = new Set(['EPISODIC_AGENT','WORKING_CONTEXT','RETRIEVED_EXTERNAL','CANONICAL_HISTORY']);
const LOSS_CLASSES = new Set(['NONE','PRESENTATIONAL','NON_CRITICAL','EPISTEMIC','OPERATIONAL']);
const ACTION_MIN_AXES = {
  READ:['READ'], COMPUTE:['COMPUTE'], VERIFY:['READ','COMPUTE'], RETRY:['EXECUTION'],
  DEPLOY:['EXECUTION','NETWORK'], MERGE:['EXECUTION'], DISCLOSE:['DISCLOSURE'], NETWORK:['NETWORK'], SPEND:['BUDGET'], MUTATE:['EXECUTION'], OTHER:[]
};
const ACTION_PROHIBITION = {RETRY:'DO_NOT_RETRY',DEPLOY:'DO_NOT_DEPLOY',MERGE:'DO_NOT_MERGE',DISCLOSE:'DO_NOT_DISCLOSE',NETWORK:'DO_NOT_NETWORK',SPEND:'DO_NOT_SPEND',MUTATE:'DO_NOT_EXECUTE'};
const TOKENS_LIST = ["protocol", "status", "packet_id", "profiles", "control", "event", "evidence", "epistemic", "view", "memory", "delta", "handoff", "transforms", "payload", "job_id", "context_id", "current_state", "disposition", "verdict", "holds", "pins", "stop_conditions", "resume_conditions", "prohibited_actions", "capabilities", "action_authorized", "authority", "next_action", "dependencies", "completion_condition", "revision", "source", "final", "id", "blocks", "condition", "kind", "value", "algorithm", "effect", "predicate", "action_id", "action_type", "required_authority", "required_capabilities", "params_hash", "state", "event_id", "event_type", "subject_ids", "time", "location", "occurred_at", "observed_at", "published_at", "received_at", "normalized_at", "valid_from", "valid_until", "observations", "source_relations", "evidence_paths", "metrics", "observation_id", "observer", "adapter", "upstream_source", "source_timestamp", "raw_reference", "content_hash", "freshness", "independence_group", "age_seconds", "ttl_seconds", "source_a", "source_b", "relation", "source_count", "independent_source_count", "path_id", "nodes", "edges", "node_id", "node_type", "ref", "from", "to", "transform_ref", "claims", "unknowns", "conflicts", "evidence_sufficiency", "evidence_requests", "positions", "agreements", "claim_id", "subject", "confidence", "evidence_refs", "field", "reason", "conflict_id", "claim_ids", "conflict_type", "unresolved_fields", "severity", "resolution_state", "request_id", "missing_fact", "desired_source_class", "agent_id", "stance", "participants", "agreement_ratio", "dissenters", "observation_ids", "received_claim_ids", "accepted_claim_ids", "rejected_claim_ids", "unresolved_claim_ids", "inferred_claims", "context_cutoff", "refs", "memory_class", "origin", "retained_at", "retrieved_at", "source_event", "base_event_id", "base_revision", "base_hash", "new_revision", "operations", "unresolved", "op", "path", "sender", "receiver", "objective", "provenance", "transform_type", "input_hash", "output_hash", "preserved_fields", "omitted_fields", "loss_class", "justification", "CONTROL", "EVENT", "EVIDENCE", "EPISTEMIC", "VIEW", "MEMORY", "DELTA", "HANDOFF", "EXECUTE", "WAIT", "STOP", "COMPLETE", "REQUIRES_VERIFIER", "WAITING_AUTHORITY", "WAITING_DEPENDENCY", "GRANTED", "DENIED", "UNKNOWN", "AVAILABLE", "UNAVAILABLE", "PASS", "FAIL", "BLOCKED", "CONDITIONAL", "INCONCLUSIVE", "UNREVIEWED", "NONE", "ACTION", "READ", "COMPUTE", "VERIFY", "RETRY", "DEPLOY", "MERGE", "DISCLOSE", "NETWORK", "SPEND", "MUTATE", "OTHER", "DO_NOT_RETRY", "DO_NOT_EXECUTE", "DO_NOT_DEPLOY", "DO_NOT_MERGE", "DO_NOT_DISCLOSE", "DO_NOT_NETWORK", "DO_NOT_SPEND", "ALWAYS", "DEPENDENCY_READY", "AUTHORITY_GRANTED", "VERIFIER_PASS", "PIN_MATCH", "EXTERNAL", "SHA256", "GIT_COMMIT", "LITERAL", "READY", "WAITING", "FAILED", "SATISFIED", "CONDITION", "NOT_OBSERVED", "NOT_REPORTED", "NOT_AVAILABLE", "WITHHELD", "NOT_APPLICABLE", "CONFLICTED", "OBSERVED", "SUPPORTED", "CONTESTED", "INFERRED", "UNVERIFIED", "RETRACTED", "SUPERSEDED", "SUFFICIENT", "PARTIAL", "INSUFFICIENT", "FRESH", "AGING", "STALE", "EXPIRED", "INDEPENDENT", "DERIVED_FROM", "SYNDICATED_FROM", "SHARED_ORIGIN", "UNKNOWN_RELATION", "VALUE_CONFLICT", "TEMPORAL_CONFLICT", "SOURCE_CONFLICT", "IDENTITY_CONFLICT", "LOCATION_CONFLICT", "CAUSAL_CONFLICT", "AUTHORITY_CONFLICT", "UNRESOLVED", "RESOLVED", "EPISODIC_AGENT", "WORKING_CONTEXT", "RETRIEVED_EXTERNAL", "CANONICAL_HISTORY", "NORMALIZE", "SUMMARIZE", "COMPRESS", "ENCODE", "RETRIEVE", "PRESENTATIONAL", "NON_CRITICAL", "EPISTEMIC", "OPERATIONAL", "ACCEPT", "REJECT", "ABSTAIN", "UPSTREAM_EVIDENCE", "SENSOR_OBSERVATION", "CANONICAL_EVENT", "AGENT_OBSERVATION", "AGENT_INTERPRETATION", "AGENT_OUTPUT", "FETCHED_FROM", "NORMALIZED_FROM", "PROJECTED_FROM", "BASED_ON", "add", "replace", "remove"];
const TOKENS = new Map(TOKENS_LIST.map((s,i)=>[s,i+1]));
const TOKEN_BY_ID = new Map(TOKENS_LIST.map((s,i)=>[i+1,s]));

export class ValidationError extends Error { constructor(errors){ super(errors.join('; ')); this.errors=errors; } }
export class ParseError extends Error {}

function uvarint(n){ if(!Number.isSafeInteger(n)||n<0) throw new Error('uvarint'); const a=[]; do{ let b=n&0x7f; n=Math.floor(n/128); if(n)b|=0x80; a.push(b); }while(n); return Buffer.from(a); }
function readUvarint(buf,i){ let n=0,m=1; for(let k=0;k<10;k++){ if(i>=buf.length)throw new ParseError('truncated varint'); const b=buf[i++]; n+=(b&0x7f)*m; if(!(b&0x80))return [n,i]; m*=128; } throw new ParseError('varint too long'); }
function keyCmp(a,b){ return Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8')); }
function enc(v){
  if(v===null)return Buffer.from([0]);
  if(v===false)return Buffer.from([1]); if(v===true)return Buffer.from([2]);
  if(typeof v==='number'){
    if(!Number.isFinite(v))throw new Error('non-finite');
    if(Number.isSafeInteger(v)){ if(v>=0)return Buffer.concat([Buffer.from([3]),uvarint(v)]); return Buffer.concat([Buffer.from([4]),uvarint((-v*2)-1)]); }
    const b=Buffer.alloc(9); b[0]=0x0a; b.writeDoubleBE(v,1); return b;
  }
  if(typeof v==='string'){ const t=TOKENS.get(v); if(t)return Buffer.concat([Buffer.from([9]),uvarint(t)]); const b=Buffer.from(v,'utf8'); return Buffer.concat([Buffer.from([5]),uvarint(b.length),b]); }
  if(Buffer.isBuffer(v)){ return Buffer.concat([Buffer.from([6]),uvarint(v.length),v]); }
  if(Array.isArray(v))return Buffer.concat([Buffer.from([7]),uvarint(v.length),...v.map(enc)]);
  if(typeof v==='object'){
    const keys=Object.keys(v).sort(keyCmp); return Buffer.concat([Buffer.from([8]),uvarint(keys.length),...keys.flatMap(k=>[enc(k),enc(v[k])])]);
  }
  throw new Error('unsupported type');
}
function dec(buf,i=0){
  if(i>=buf.length)throw new ParseError('truncated value'); const t=buf[i++];
  if(t===0)return [null,i]; if(t===1)return [false,i]; if(t===2)return [true,i];
  if(t===3)return readUvarint(buf,i); if(t===4){ const [z,j]=readUvarint(buf,i); return [-Math.floor((z+1)/2),j]; }
  if(t===0x0a){ if(i+8>buf.length)throw new ParseError('truncated float'); return [buf.readDoubleBE(i),i+8]; }
  if(t===5||t===6){ const [n,j]=readUvarint(buf,i); i=j; if(i+n>buf.length)throw new ParseError('truncated'); const b=buf.subarray(i,i+n); return [t===6?Buffer.from(b):b.toString('utf8'),i+n]; }
  if(t===7){ const [n,j]=readUvarint(buf,i); i=j; const a=[]; for(let k=0;k<n;k++){ const [x,ni]=dec(buf,i); a.push(x); i=ni; } return [a,i]; }
  if(t===8){ const [n,j]=readUvarint(buf,i); i=j; const o={}; let last=null; for(let k=0;k<n;k++){ const [key,ki]=dec(buf,i); i=ki; if(typeof key!=='string')throw new ParseError('map key'); const kb=Buffer.from(key); if(last&&Buffer.compare(kb,last)<=0)throw new ParseError('noncanonical keys'); last=kb; const [val,vi]=dec(buf,i); i=vi; o[key]=val; } return [o,i]; }
  if(t===9){ const [id,j]=readUvarint(buf,i); const s=TOKEN_BY_ID.get(id); if(!s)throw new ParseError('undefined token'); return [s,j]; }
  throw new ParseError('unknown type');
}

export function canonicalize(v, path='$'){
  if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number'){
    if(!Number.isFinite(v))throw new Error(`${path}: non-finite number forbidden`);
    if(Number.isInteger(v)&&!Number.isSafeInteger(v))throw new Error(`${path}: integer outside cross-language safe range`);
    return v;
  }
  if(Array.isArray(v))return v.map((x,i)=>canonicalize(x,`${path}[${i}]`));
  if(v&&typeof v==='object'&&!Buffer.isBuffer(v)){ const o={}; for(const k of Object.keys(v).sort(keyCmp))o[k]=canonicalize(v[k],`${path}.${k}`); return o; }
  throw new Error(`${path}: unsupported semantic value type`);
}
export function canonicalJsonBytes(v){ return Buffer.from(JSON.stringify(canonicalize(v)),'utf8'); }
export function canonicalStateBytes(v){ return enc(canonicalize(v)); }
export function canonicalStateHash(v){ return crypto.createHash('sha256').update(canonicalStateBytes(v)).digest('hex'); }
export function packetHash(v){ return crypto.createHash('sha256').update(enc(canonicalize(v))).digest('hex'); }

function nonempty(x){return typeof x==='string'&&x.trim().length>0;}
function exact(o,req,opt,path,e){ if(!o||typeof o!=='object'||Array.isArray(o)){e.push(`${path}: must be object`);return false;} const ks=new Set(Object.keys(o)); const miss=req.filter(k=>!ks.has(k)); const extra=[...ks].filter(k=>!req.includes(k)&&!opt.includes(k)); if(miss.length)e.push(`${path}: missing ${miss.join(',')}`); if(extra.length)e.push(`${path}: unsupported ${extra.join(',')}`); return !miss.length&&!extra.length; }
function sha(x){return typeof x==='string'&&/^[0-9a-fA-F]{64}$/.test(x);}
function iso(x){ if(x===null)return true; return typeof x==='string'&&!Number.isNaN(Date.parse(x)); }

function validateControl(c,e){
  const req=['job_id','current_state','disposition','verdict','holds','pins','stop_conditions','resume_conditions','prohibited_actions','capabilities','action_authorized','authority','next_action','dependencies','completion_condition','revision'];
  if(!exact(c,req,['context_id'],'control',e))return;
  if(!nonempty(c.job_id)||!nonempty(c.current_state))e.push('control identity/state invalid');
  if(!DISPOSITIONS.has(c.disposition))e.push('control.disposition invalid');
  if(!Number.isInteger(c.revision)||c.revision<1)e.push('control.revision invalid');
  if(exact(c.verdict,['status','source','final'],[],'control.verdict',e)){if(!VERDICTS.has(c.verdict.status)||!nonempty(c.verdict.source)||typeof c.verdict.final!=='boolean')e.push('control.verdict invalid');}
  if(exact(c.authority,AXES,[],'control.authority',e))for(const a of AXES)if(!TRI.has(c.authority[a]))e.push(`authority.${a} invalid`);
  if(!TRI.has(c.action_authorized))e.push('action_authorized invalid');
  if(!c.capabilities||typeof c.capabilities!=='object'||Array.isArray(c.capabilities))e.push('capabilities invalid'); else for(const [k,v] of Object.entries(c.capabilities))if(!nonempty(k)||!CAP_STATES.has(v))e.push(`capability ${k} invalid`);
  if(!Array.isArray(c.holds))e.push('holds invalid'); else for(const h of c.holds){if(!exact(h,['id','blocks','condition'],[],'hold',e))continue; if(!nonempty(h.id)||!Array.isArray(h.blocks)||!h.blocks.length||!nonempty(h.condition))e.push('hold invalid');}
  if(!Array.isArray(c.pins))e.push('pins invalid'); else for(const p of c.pins){if(!exact(p,['id','kind','value'],['algorithm'],'pin',e))continue; if(!nonempty(p.id)||!nonempty(p.value))e.push('pin invalid'); if(p.kind==='SHA256'&&!sha(p.value))e.push('pin sha invalid'); if(p.kind==='GIT_COMMIT'&&!/^[0-9a-fA-F]{40}$/.test(p.value))e.push('pin git invalid');}
  if(!Array.isArray(c.stop_conditions)||!Array.isArray(c.resume_conditions))e.push('condition lists invalid');
  if(!Array.isArray(c.prohibited_actions)||c.prohibited_actions.some(x=>!PROHIBITED_ACTIONS.has(x)))e.push('prohibited_actions invalid');
  if(!Array.isArray(c.dependencies))e.push('dependencies invalid');
  if(c.completion_condition!==null){if(!exact(c.completion_condition,['state','condition'],[],'completion',e)||!['SATISFIED','CONDITION'].includes(c.completion_condition.state)||!nonempty(c.completion_condition.condition))e.push('completion invalid');}
  const na=c.next_action; let actionType=null;
  if(!na||typeof na!=='object')e.push('next_action invalid');
  else if(na.kind==='NONE'){if(Object.keys(na).length!==1)e.push('NONE next action has fields');}
  else if(na.kind==='ACTION'){
    if(exact(na,['kind','action_id','action_type','required_authority','required_capabilities','params_hash'],[],'next_action',e)){
      actionType=na.action_type; if(!nonempty(na.action_id)||!ACTION_TYPES.has(actionType)||!sha(na.params_hash))e.push('ACTION invalid');
      if(!Array.isArray(na.required_authority)||na.required_authority.some(x=>!AXES.includes(x)))e.push('required_authority invalid');
      if(!Array.isArray(na.required_capabilities))e.push('required_capabilities invalid');
      const min=ACTION_MIN_AXES[actionType]||[]; if(min.some(x=>!na.required_authority.includes(x)))e.push('minimum authority missing');
    }
  } else e.push('next_action kind invalid');
  if(c.disposition==='EXECUTE'){
    if(na?.kind!=='ACTION')e.push('EXECUTE requires action'); if(c.action_authorized!=='GRANTED')e.push('EXECUTE requires action authorization');
    if(actionType){for(const a of na.required_authority||[])if(c.authority?.[a]!=='GRANTED')e.push(`required ${a} not granted`); for(const cap of na.required_capabilities||[])if(c.capabilities?.[cap]!=='AVAILABLE')e.push(`capability ${cap} unavailable`); const pro=ACTION_PROHIBITION[actionType]; if(pro&&c.prohibited_actions.includes(pro))e.push('action prohibited'); if(c.prohibited_actions.includes('DO_NOT_EXECUTE')&&!['READ','COMPUTE'].includes(actionType))e.push('action conflicts DO_NOT_EXECUTE'); for(const h of c.holds||[])if(h.blocks?.includes('*')||h.blocks?.includes(actionType))e.push('hold blocks action');}
  } else if(na?.kind!=='NONE')e.push(`${c.disposition} requires NONE`);
  if(['WAIT','REQUIRES_VERIFIER','WAITING_AUTHORITY','WAITING_DEPENDENCY'].includes(c.disposition)&&(!Array.isArray(c.resume_conditions)||!c.resume_conditions.length))e.push('waiting state requires resume condition');
  if(c.disposition==='COMPLETE'&&c.completion_condition?.state!=='SATISFIED')e.push('COMPLETE requires satisfied completion');
}

export function validatePacket(p){
  const e=[];
  try{ p=canonicalize(p); }catch(err){ return {ok:false,errors:[`semantic-domain: ${err.message}`],fail_closed:true}; }
  const req=['protocol','status','packet_id','profiles','control','payload']; const opt=['event','evidence','epistemic','view','memory','delta','handoff','transforms'];
  if(!exact(p,req,opt,'packet',e))return {ok:false,errors:e,fail_closed:true};
  if(p.protocol!==PROTOCOL)e.push('protocol unsupported'); if(p.status!==STATUS)e.push('status invalid'); if(!nonempty(p.packet_id))e.push('packet_id invalid');
  if(!Array.isArray(p.profiles)||!p.profiles.length||new Set(p.profiles).size!==p.profiles.length||p.profiles.some(x=>!PROFILES.has(x))||!p.profiles.includes('CONTROL'))e.push('profiles invalid');
  const map={EVENT:'event',EVIDENCE:'evidence',EPISTEMIC:'epistemic',VIEW:'view',MEMORY:'memory',DELTA:'delta',HANDOFF:'handoff'};
  for(const [prof,key] of Object.entries(map)){if(p.profiles?.includes(prof)&&!(key in p))e.push(`${prof} missing`); if(!p.profiles?.includes(prof)&&(key in p))e.push(`${key} undeclared`);}
  if(!p.payload||typeof p.payload!=='object'||Array.isArray(p.payload))e.push('payload invalid');
  validateControl(p.control,e);
  const eventId=p.event?.event_id;
  if(p.event){ if(!exact(p.event,['event_id','event_type','subject_ids','time','revision'],['location','severity'],'event',e)){} else {if(!nonempty(p.event.event_id)||!nonempty(p.event.event_type)||!nonempty(p.event.revision)||!Array.isArray(p.event.subject_ids))e.push('event invalid'); for(const v of Object.values(p.event.time||{}))if(!iso(v))e.push('event time invalid');}}
  const obsIds=new Set(), upstreams=new Set(), groups=new Set();
  if(p.evidence){ if(!exact(p.evidence,['observations','source_relations','evidence_paths','metrics'],[],'evidence',e)){} else {
    if(!Array.isArray(p.evidence.observations))e.push('observations invalid'); else for(const o of p.evidence.observations){if(!o||typeof o!=='object')continue; if(o.event_id!==eventId)e.push('observation event mismatch'); if(obsIds.has(o.observation_id))e.push('duplicate observation'); obsIds.add(o.observation_id); upstreams.add(o.upstream_source); if(o.independence_group!==null)groups.add(o.independence_group); if(!iso(o.observed_at)||!iso(o.source_timestamp))e.push('observation timestamp invalid');}
    if(p.evidence.metrics?.source_count!==upstreams.size)e.push('source_count mismatch'); if(p.evidence.metrics?.independent_source_count!==groups.size)e.push('independent_source_count mismatch');
    if(!Array.isArray(p.evidence.evidence_paths))e.push('paths invalid'); else for(const path of p.evidence.evidence_paths){if(!Array.isArray(path.nodes)||!Array.isArray(path.edges)||path.edges.length!==Math.max(0,path.nodes.length-1))e.push('path gap'); else for(let i=0;i<path.edges.length;i++)if(path.edges[i].from!==path.nodes[i].node_id||path.edges[i].to!==path.nodes[i+1].node_id)e.push('path discontinuity');}
  }}
  const claimIds=new Set(); const keyValues=new Map(); const conflictKeys=new Set();
  if(p.epistemic){ if(!exact(p.epistemic,['claims','unknowns','conflicts','evidence_sufficiency','evidence_requests','positions','agreements'],[],'epistemic',e)){} else {
    for(const c of p.epistemic.claims||[]){claimIds.add(c.claim_id); if(!CLAIM_STATES.has(c.status))e.push('claim status invalid'); const key=`${c.subject}\u0000${c.predicate}`; if(!keyValues.has(key))keyValues.set(key,[]); if(!['RETRACTED','SUPERSEDED'].includes(c.status))keyValues.get(key).push(JSON.stringify(c.value)); if(obsIds.size&&(c.evidence_refs||[]).some(x=>!obsIds.has(x)))e.push('unknown evidence ref');}
    for(const u of p.epistemic.unknowns||[])if(!UNKNOWN_STATES.has(u.state))e.push('unknown state invalid');
    for(const co of p.epistemic.conflicts||[]){for(const id of co.claim_ids||[])if(!claimIds.has(id))e.push('conflict unknown claim'); const involved=(p.epistemic.claims||[]).filter(c=>(co.claim_ids||[]).includes(c.claim_id)); for(const c of involved)conflictKeys.add(`${c.subject}\u0000${c.predicate}`);}
    for(const [k,vals] of keyValues)if(new Set(vals).size>1&&!conflictKeys.has(k))e.push('unrepresented value conflict');
  }}
  if(p.view){ const received=new Set(p.view.received_claim_ids||[]), accepted=new Set(p.view.accepted_claim_ids||[]), rejected=new Set(p.view.rejected_claim_ids||[]), unresolved=new Set(p.view.unresolved_claim_ids||[]); for(const x of accepted)if(!received.has(x))e.push('accept without receipt'); for(const x of rejected)if(!received.has(x))e.push('reject without receipt'); for(const x of unresolved)if(!received.has(x))e.push('unresolved without receipt'); for(const x of p.view.observation_ids||[])if(obsIds.size&&!obsIds.has(x))e.push('unknown view observation'); }
  if(p.memory)for(const r of p.memory.refs||[]){if(!MEMORY_CLASSES.has(r.memory_class))e.push('memory class invalid'); if(r.memory_class==='RETRIEVED_EXTERNAL'&&!r.retrieved_at)e.push('retrieval missing time'); if(r.memory_class==='EPISODIC_AGENT'&&!r.retained_at)e.push('episodic missing retained time');}
  if(p.delta){if(!sha(p.delta.base_hash)||!Array.isArray(p.delta.operations)||p.delta.base_revision===p.delta.new_revision)e.push('delta invalid');}
  if(p.transforms)for(const t of p.transforms){if(!LOSS_CLASSES.has(t.loss_class)||['EPISTEMIC','OPERATIONAL'].includes(t.loss_class))e.push('unsafe transform loss'); if(t.loss_class==='NON_CRITICAL'&&!nonempty(t.justification))e.push('noncritical loss lacks justification');}
  return {ok:e.length===0,errors:e,fail_closed:true};
}

export function encodePacket(packet,validate=true){ const canonical=canonicalize(packet); if(validate){const vr=validatePacket(canonical); if(!vr.ok)throw new ValidationError(vr.errors);} const body=enc(canonical); const prefix=Buffer.concat([BEACON,Buffer.from([WIRE_VERSION,FLAGS]),uvarint(body.length),body]); return Buffer.concat([prefix,crypto.createHash('sha256').update(prefix).digest()]); }
export function decodeUntrusted(frame){ const b=Buffer.from(frame); if(b.length<BEACON.length+2+1+32)throw new ParseError('frame too short'); if(!b.subarray(0,BEACON.length).equals(BEACON))throw new ParseError('beacon mismatch'); let i=BEACON.length; if(b[i++]!==WIRE_VERSION)throw new ParseError('unsupported wire version'); if(b[i++]!==FLAGS)throw new ParseError('unsupported flags'); const [n,j]=readUvarint(b,i); i=j; const end=i+n; if(end+32!==b.length)throw new ParseError('length mismatch'); const prefix=b.subarray(0,end); const digest=crypto.createHash('sha256').update(prefix).digest(); if(!digest.equals(b.subarray(end)))throw new ParseError('integrity mismatch'); const body=b.subarray(i,end); const [p,k]=dec(body,0); if(k!==n)throw new ParseError('trailing body'); let canonical; try{canonical=canonicalize(p);}catch(err){throw new ParseError(`invalid semantic value domain: ${err.message}`);} if(!enc(canonical).equals(body))throw new ParseError('noncanonical body encoding'); return canonical; }
export function trustedDecode(frame){ const p=decodeUntrusted(frame); const vr=validatePacket(p); if(!vr.ok)throw new ValidationError(vr.errors); return p; }
export function intersectAuthority(packet,local){ const out={}; for(const a of AXES){const p=packet?.[a]??'UNKNOWN',l=local?.[a]??'UNKNOWN'; out[a]=(p==='DENIED'||l==='DENIED')?'DENIED':(p==='GRANTED'&&l==='GRANTED')?'GRANTED':'UNKNOWN';} return out; }
export function canExecute(packet,localAuthority,localCapabilities,localActionAuthorized){ const vr=validatePacket(packet); if(!vr.ok)return [false,'INVALID_PACKET']; const c=packet.control; if(c.disposition!=='EXECUTE')return [false,'DISPOSITION_NOT_EXECUTE']; if(c.action_authorized!=='GRANTED'||localActionAuthorized!=='GRANTED')return [false,'ACTION_NOT_AUTHORIZED']; const eff=intersectAuthority(c.authority,localAuthority); for(const a of c.next_action.required_authority)if(eff[a]!=='GRANTED')return [false,`AUTHORITY_${a}_${eff[a]}`]; for(const cap of c.next_action.required_capabilities)if(c.capabilities[cap]!=='AVAILABLE'||localCapabilities?.[cap]!=='AVAILABLE')return [false,`CAPABILITY_${cap}_NOT_AVAILABLE`]; return [true,'AUTHORIZED']; }
