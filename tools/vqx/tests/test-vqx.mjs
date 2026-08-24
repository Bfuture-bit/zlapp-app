#!/usr/bin/env node
/** VQX 0.3 JS codec tests. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bytesToPua,puaToBytes,encodeNames,decodeIds,parseMessage,stripBootstrap,LocalTable,wrapBootstrap,BEACON,verifySha256 } from "../codecs/vqx.mjs";
const here=dirname(fileURLToPath(import.meta.url));
function findLexicon(){const env=process.env.VQX_ROOT;const c=[];if(env)c.push(join(env,"lexicon.json"),join(env,"machine","lexicon.json"));c.push(join(here,"..","lexicon.json"),join(here,"..","..","..","site","public","sites","vqx","machine","lexicon.json"));for(const p of c)if(existsSync(p))return {lex:JSON.parse(readFileSync(p,"utf8")),raw:readFileSync(p)};throw new Error("lexicon.json not found");}
const {lex,raw:lexRaw}=findLexicon();
function eq(a,b,m="assert"){const sa=JSON.stringify(a),sb=JSON.stringify(b);if(sa!==sb)throw new Error(`${m}: ${sa} != ${sb}`)}
function expect(code,fn){let got=null;try{fn()}catch(e){got=e.code}if(got!==code)throw new Error(`expected ${code}, got ${got}`)}
for(let i=0;i<256;i++){const b=Uint8Array.from([i]),p=bytesToPua(b);if(puaToBytes(p)[0]!==i||p.codePointAt(0)!==0xe000+i)throw new Error("roundtrip "+i)}
const raw=Uint8Array.from([6,17,32,160]);eq(decodeIds(raw,lex),["REQUEST","PEER","RESPOND","GLYPH_ONLY"]);eq(Array.from(encodeNames(["REQUEST","PEER","RESPOND","GLYPH_ONLY"],lex)),[6,17,32,160]);
const sample=Uint8Array.from([0xd3,0xa7,0x5c,0xe1,0x9b,0x02,0x03,0,6,17,32,160]);const parsed=await parseMessage(sample,lex,{mode:"bootstrap"});eq(parsed.version,3);eq(parsed.names,["REQUEST","PEER","RESPOND","GLYPH_ONLY"]);
expect("VQX_VERSION",()=>stripBootstrap(Uint8Array.from([...BEACON,0x99,0,6]),{mode:"bootstrap"}));expect("VQX_FLAGS",()=>stripBootstrap(Uint8Array.from([...BEACON,3,1,6]),{mode:"bootstrap"}));expect("VQX_BEACON",()=>stripBootstrap(Uint8Array.from([6]),{mode:"bootstrap"}));
const collision=Uint8Array.from([...BEACON,6]);eq(stripBootstrap(collision,{mode:"compact"}).mode,"compact");
await verifySha256(lexRaw, await (async()=>{const {createHash}=await import("node:crypto");return createHash("sha256").update(lexRaw).digest("hex")})());
let digestFailed=false;try{await verifySha256(lexRaw,"00".repeat(32))}catch(e){digestFailed=e.code==="VQX_DIGEST"}if(!digestFailed)throw new Error("digest fail-closed");
const graph=encodeNames(["REQUEST","PEER","RESPOND","GLYPH_ONLY","KEEP_CONTEXT","KEEP_CONSTRAINTS","SEARCH_IF","TOOL_IF","ACCURACY_FIRST","FINAL_ONLY"],lex);const framed=Uint8Array.from([0xdc,0xe0,graph.length,...graph,0xdd,0xe0,0xdd,0xe0,0xdd,0xe0]);const table=new LocalTable();eq(Array.from(table.expand(framed)),[...graph,...graph,...graph]);expect("VQX_TRUNCATED_MACRO",()=>new LocalTable().expand(Uint8Array.from([0xdc])));expect("VQX_TRUNCATED_MACRO",()=>new LocalTable().expand(Uint8Array.from([0xdd])));expect("VQX_LOCAL_UNDEF",()=>new LocalTable().expand(Uint8Array.from([0xdd,0xe0])));expect("VQX_LOCAL_DIRECT",()=>new LocalTable().expand(Uint8Array.from([0xe0])));expect("VQX_LOCAL_CONTENT",()=>new LocalTable().define(0xe0,Uint8Array.from([0xdd])));expect("VQX_EXPANSION_LIMIT",()=>new LocalTable().expand(framed,{maxExpandedSize:4}));
const auth=await parseMessage(encodeNames(["REQUEST","PEER","EXECUTE","TOOL"],lex),lex,{mode:"compact"});eq(auth.authorizationRequired,["EXECUTE"]);expect("VQX_FRAME_SIZE",()=>wrapBootstrap(Uint8Array.from([1,2,3,4,5]),{maxFrameSize:4}));expect("VQX_NON_PUA",()=>puaToBytes("hello",{strict:true}));
const hashed=await parseMessage(encodeNames(["ACK"],lex),lex,{mode:"compact",lexiconBytes:lexRaw,expectedDictHash:await (async()=>{const {createHash}=await import("node:crypto");return createHash("sha256").update(lexRaw).digest("hex")})()});
eq(hashed.names,["ACK"]);
let dictFail=false;try{await parseMessage(encodeNames(["ACK"],lex),lex,{mode:"compact",lexiconBytes:lexRaw,expectedDictHash:"00".repeat(32)})}catch(e){dictFail=e.code==="VQX_DIGEST"}if(!dictFail)throw new Error("parseMessage digest fail-closed");
console.log("js codec tests ok");
