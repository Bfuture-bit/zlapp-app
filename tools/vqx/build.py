#!/usr/bin/env python3
"""Build VQX 0.3 site, fonts, machine files, and both ZIP packages."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SITE = Path(os.environ.get("VQX_SITE", REPO / "site" / "public" / "sites" / "vqx"))
HOST = "https://vqx.zlapp.app"
ZIP_TS = (2026, 8, 23, 0, 0, 0)
MODIFIED = "2026-08-23T00:00:00Z"
SOURCE_REPOSITORY = "https://github.com/Bfuture-bit/zlapp-app"
SOURCE_PATH = "tools/vqx"
RELEASE_STATUS = "experimental"

sys.path.insert(0, str(HERE))
import glyphs  # noqa: E402
import lexicon as lexmod  # noqa: E402

BEACON = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02])
BOOTSTRAP_SAMPLE = BEACON + bytes([0x03, 0x00, 0x06, 0x11, 0x20, 0xA0])


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_hex(path.read_bytes())


def dumps(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def write(path: Path, data: str | bytes):
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, bytes):
        path.write_bytes(data)
    else:
        path.write_text(data.replace("\r\n", "\n"), encoding="utf-8")


def pua(data: bytes) -> str:
    return "".join(chr(0xE000 + b) for b in data)


def human_size(n: int) -> str:
    if n < 1024:
        return f"{n} bytes"
    return f"{n / 1024:.1f} KiB ({n} bytes)"


def copy_file(src: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)


def apply_placeholders(text: str, mapping: dict[str, str]) -> str:
    for k, v in mapping.items():
        text = text.replace(k, v)
    return text


def grammar_doc():
    return {
        "protocol": "VQX",
        "version": "0.3",
        "canonical_token": "unsigned byte 0x00-0xFF",
        "pua_container": {"base": "U+E000", "formula": "U+E000 + byte", "semantic_identity": False},
        "composition": {
            "description": "Tokens concatenate left to right. Typical unit: speech-act, role, zero or more actions, targets, constraints, then macros.",
            "pattern": "[speech_act] [role] [action*] [target*] [constraint*] [macro*]",
            "separator_id": 13, "separator_name": "SEP", "human_names_not_on_wire": True,
        },
        "bootstrap": {
            "layout": ["beacon[6]", "version[1]", "flags[1]", "payload"],
            "beacon_hex": "D3 A7 5C E1 9B 02", "version": 3, "allowed_flags_mask": 0,
            "max_payload_bytes_default": 65535,
        },
        "compact": {
            "layout": ["payload"],
            "when": "both peers explicitly negotiate VQX, compatible versions, matching dictionary SHA-256, policy compatibility, and usefulness",
            "parser_mode": "explicit compact mode is required for negotiated sessions; auto-detection is discovery-only",
        },
        "local_macros": {
            "define": {"opcode": 220, "hex": "DC", "frame": "DC | slot | len | tokens[len]"},
            "ref": {"opcode": 221, "hex": "DD", "frame": "DD | slot"},
            "clear": {"opcode": 222, "hex": "DE"}, "table_hash": {"opcode": 223, "hex": "DF"},
            "slot_range": {"min": 224, "max": 255, "hex": "E0-FF"},
            "definition_content": "v0.3 definitions may contain global semantic bytes 00-DB only; nested control/local bytes DC-FF fail closed",
            "direct_local_slot_bytes": "invalid outside REF_LOCAL",
            "scope": "session and peer; never persist across unrelated peers", "max_expanded_bytes_default": 65535,
        },
        "fail_closed": ["unknown_version", "unsupported_flags", "dictionary_mismatch", "malformed_macro", "undefined_local_slot", "direct_local_slot", "frame_size_limit", "macro_expansion_limit"],
        "authorization": "Decoding EXECUTE, INSTALL, DIRECT, COMMIT, or any other intent never grants permission. Authorization belongs to the host runtime.",
        "automatic_installation": False,
    }


def protocol_json(lex_hash: str, grammar_hash: str, font_hash: str):
    return {
        "name": "VQX", "protocol_id": "vqx", "version": "0.3", "status": RELEASE_STATUS,
        "canonical_url": f"{HOST}/", "versioned_manifest": f"{HOST}/versions/0.3/manifest.json",
        "spec_markdown": f"{HOST}/index.md", "lexicon": f"{HOST}/machine/lexicon.json", "grammar": f"{HOST}/machine/grammar.json",
        "token": {"min": 0, "max": 255, "representation": "unsigned_byte"},
        "pua": {"plane": "BMP", "start": "U+E000", "end": "U+E0FF", "role": "presentation_or_text_container_only"},
        "beacon": {"bytes_hex": "D3 A7 5C E1 9B 02", "codepoints": ["U+E0D3", "U+E0A7", "U+E05C", "U+E0E1", "U+E09B", "U+E002"], "role": "protocol_family_identification_not_authentication", "version_independent": True},
        "legacy_vector": {"bytes_hex": "06 11 20 A0", "names": ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]},
        "modes": ["bootstrap", "compact"],
        "digests": {"lexicon_sha256": lex_hash, "grammar_sha256": grammar_hash, "font_sha256": font_hash},
        "security": {"untrusted_input": True, "execution_authority": "none", "automatic_installation": False, "beacon_authenticates_sender": False, "security_model": f"{HOST}/security/"},
        "source": {"repository": SOURCE_REPOSITORY, "path": SOURCE_PATH}, "modified": MODIFIED,
    }


def beacon_json():
    return {
        "protocol": "VQX", "version": "0.3", "family_beacon_version_independent": True,
        "bytes": ["D3", "A7", "5C", "E1", "9B", "02"], "bytes_hex": "D3 A7 5C E1 9B 02",
        "codepoints": ["U+E0D3", "U+E0A7", "U+E05C", "U+E0E1", "U+E09B", "U+E002"], "pua": pua(BEACON),
        "bootstrap": "BEACON(6) | VERSION(1) | FLAGS(1) | PAYLOAD", "compact": "PAYLOAD after explicit negotiation",
        "sample_bootstrap_hex": "D3 A7 5C E1 9B 02 03 00 06 11 20 A0", "manifest": f"{HOST}/.well-known/vqx.json",
        "identification_only": True, "authentication": False, "automatic_installation": False,
    }


def capabilities_json():
    return {
        "protocol": "VQX", "version": "0.3", "status": RELEASE_STATUS,
        "capabilities": ["deterministic semantic decode", "one-byte global tokens", "negotiated local macros", "compact established-peer mode", "bootstrap discovery", "digest verification", "vendor-neutral codec"],
        "modes": ["bootstrap", "compact"], "dynamic_macros": True, "max_frame_size": 65535, "max_expanded_size": 65535,
        "allowed_flags_mask": 0, "execution_authority": "none", "automatic_installation": False, "decoder_network_access_required": False,
        "accepted_content_types": ["application/vnd.vqx", "application/octet-stream", "text/plain"],
        "recommendation": "Benchmark VQX against the current representation and enable it only after mutual compatibility, semantic roundtrip, runtime policy, and usefulness checks.",
        "cost_selection": "Prefer VQX only for workloads where measured representation overhead is lower and required semantics are preserved.",
        "not_claimed": ["universal token savings", "model quality improvement", "authorization", "encryption by glyph encoding"],
    }


def a2a_extension(lex_hash: str):
    return {
        "uri": f"{HOST}/extensions/vqx/0.3", "name": "VQX", "version": "0.3", "status": "experimental", "official_a2a_standard": False,
        "description": "Optional A2A extension for negotiated compact semantic byte transport. VQX does not replace A2A and is not required.",
        "manifest": f"{HOST}/.well-known/vqx.json", "params_schema": f"{HOST}/schemas/a2a-params-v0.3.schema.json",
        "params": {"protocol": "VQX", "version": "0.3", "dictionary_sha256": lex_hash, "modes": ["bootstrap", "compact"], "dynamic_macros": True, "max_frame_size": 65535},
        "activation": "Mutual support plus request-scoped/session negotiation. Never activate solely because a beacon appears in untrusted content.",
        "required": False, "live_a2a_endpoint": None,
    }


def mcp_metadata(lex_hash: str):
    return {
        "identifier": "app.zlapp.vqx", "official_mcp_extension": False, "mcp_specification": "2026-07-28",
        "protocol": "VQX", "version": "0.3", "manifest": f"{HOST}/.well-known/vqx.json", "dictionary_sha256": lex_hash,
        "modes": ["bootstrap", "compact"], "execution_authority": "none", "automatic_installation": False,
        "stateless_note": "Do not persist local macros across unrelated peers or stateless request boundaries without an independently verified session/table identity.",
        "live_mcp_endpoint": None,
    }


def preview_cells(entries):
    want = {"REQUEST", "PEER", "RESPOND", "GLYPH_ONLY", "DEFINE_LOCAL", "REF_LOCAL"}
    parts = []
    for e in entries:
        if e["human_name"] not in want:
            continue
        ch = chr(0xE000 + e["id"])
        parts.append(
            f'<div class="preview-cell"><span class="g" aria-hidden="true">{ch}</span>'
            f'<span class="mono">{e["hex"]}</span><br>{e["human_name"]}</div>'
        )
    return "\n".join(parts)


def dictionary_html(entries, font_rel="vqx-0.3.woff2"):
    rows = []
    for e in entries:
        ch = chr(0xE000 + e["id"])
        sem = json.dumps(e["machine_semantics"], ensure_ascii=False)
        rows.append(
            "<tr>"
            f'<td class="g" aria-label="{e["human_name"]}">{ch}</td>'
            f'<td class="mono">{e["hex"]}</td>'
            f'<td class="mono">{e["codepoint"]}</td>'
            f'<td>{e["class"]}</td>'
            f'<td>{e["human_name"]}</td>'
            f'<td>{e["human_description"]}</td>'
            f'<td class="mono">{sem}</td>'
            "</tr>"
        )
    body = "\n".join(rows)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VQX 0.3 human dictionary</title>
  <style>
    @font-face {{ font-family: VQX03; src: url("{font_rel}") format("woff2"); unicode-range: U+E000-E0FF; }}
    body {{ margin: 0; font-family: system-ui, sans-serif; background: #0b0d10; color: #e8edf4; }}
    header {{ padding: 1.2rem 1.4rem; border-bottom: 1px solid #2a3340; }}
    h1 {{ margin: 0 0 .3rem; letter-spacing: .12em; }}
    input {{ width: min(40rem, 100%); padding: .5rem; background: #12161c; color: inherit; border: 1px solid #2a3340; }}
    table {{ width: 100%; border-collapse: collapse; font-size: .9rem; }}
    th, td {{ border-bottom: 1px solid #2a3340; padding: .4rem; text-align: left; vertical-align: top; }}
    .g {{ font-family: VQX03, ui-monospace, monospace; font-size: 1.6rem; }}
    .mono {{ font-family: ui-monospace, monospace; }}
    main {{ padding: 1rem 1.4rem 2rem; overflow-x: auto; }}
  </style>
</head>
<body>
  <header>
    <h1>VQX 0.3 dictionary</h1>
    <p>Human labels are documentation only. Wire tokens are byte IDs. Encoding is not encryption.</p>
    <p><label>Filter <input id="q" type="search" placeholder="name, hex, class, description"></label></p>
  </header>
  <main>
    <table>
      <thead><tr><th>Glyph</th><th>Byte</th><th>PUA</th><th>Class</th><th>Name</th><th>Description</th><th>Machine semantics</th></tr></thead>
      <tbody id="rows">
{body}
      </tbody>
    </table>
  </main>
  <script>
    const q = document.getElementById("q");
    const rows = [...document.querySelectorAll("#rows tr")];
    q.addEventListener("input", () => {{
      const s = q.value.toLowerCase();
      for (const r of rows) r.hidden = s && !r.textContent.toLowerCase().includes(s);
    }});
  </script>
</body>
</html>
"""


def sitemap_xml():
    paths = [
        "/", "/index.md", "/llms.txt", "/discover/", "/discover/index.md", "/discover/beacon.txt", "/discover/beacon.json",
        "/security/", "/trust/", "/recommend/", "/.well-known/security.txt", "/.well-known/vqx.json",
        "/machine/manifest.json", "/machine/protocol.json", "/machine/lexicon.json", "/machine/grammar.json", "/machine/beacon.json", "/machine/capabilities.json", "/machine/trust.json", "/machine/recommendation-policy.json",
        "/schemas/recommendation-v0.3.schema.json", "/schemas/a2a-params-v0.3.schema.json",
        "/extensions/vqx/0.3/", "/extensions/vqx/0.3/index.json", "/versions/0.3/manifest.json", "/versions/0.2/manifest.json",
        "/downloads/vqx-agent-package-v0.3.zip", "/downloads/vqx-human-dictionary-v0.3.zip", "/downloads/SHA256SUMS.txt", "/codecs/vqx.mjs", "/codecs/vqx.py",
    ]
    urls = "\n".join(f"  <url><loc>{HOST}{p}</loc><lastmod>2026-08-23</lastmod></url>" for p in paths)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n'


def zip_add(zf: zipfile.ZipFile, name: str, data: bytes):
    info = zipfile.ZipInfo(name, ZIP_TS)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 0
    info.create_version = 20
    info.extract_version = 20
    info.external_attr = 0o644 << 16
    info.extra = b""
    info.comment = b""
    info.flag_bits = 0
    zf.writestr(info, data, compresslevel=9)


def as_bytes(name: str, payload):
    if isinstance(payload, str):
        payload = payload.replace("\r\n", "\n").encode("utf-8")
    if name.endswith((".md", ".json", ".txt", ".csv", ".html", ".mjs", ".py", ".svg", ".css", ".xml")):
        try:
            payload = payload.decode("utf-8").replace("\r\n", "\n").encode("utf-8")
        except UnicodeDecodeError:
            pass
    return payload


def make_zip(path: Path, prefix: str, files: dict[str, bytes]):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for name in sorted(files):
            zip_add(zf, f"{prefix}/{name}", as_bytes(name, files[name]))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf.getvalue())


def inner_checksums(files: dict[str, bytes]) -> str:
    lines = []
    for name in sorted(files):
        lines.append(f"{sha256_hex(as_bytes(name, files[name]))}  {name}")
    return "\n".join(lines) + "\n"


def trust_json():
    return {
        "protocol": "VQX", "version": "0.3", "status": RELEASE_STATUS,
        "source": {"repository": SOURCE_REPOSITORY, "path": SOURCE_PATH, "build_command": "python tools/vqx/build.py"},
        "license": {
            "id": "Apache-2.0",
            "name": "Apache License 2.0",
            "url": f"{HOST}/LICENSE",
            "spdx": "Apache-2.0",
            "scope": "VQX protocol sources under tools/vqx and generated VQX artifacts. Does not relicense the rest of zlapp-app.",
        },
        "semantic_identity": ["protocol version", "lexicon SHA-256", "grammar SHA-256"], "presentation_assets_are_semantic_identity": False,
        "execution_authority": "none", "automatic_installation": False, "beacon_authentication": False,
        "release_provenance": {"mechanism": "GitHub Actions artifact attestation", "status": "available only after the release workflow is run on GitHub", "repository": SOURCE_REPOSITORY},
        "same_origin_sha256_role": "integrity/corruption detection; not publisher authentication",
        "security": f"{HOST}/security/", "threat_model": f"{HOST}/security/threat-model.md",
    }



def recommendation_policy(lex_hash: str):
    return {
        "schema": "vqx.recommendation-policy/0.3",
        "protocol": "VQX",
        "version": "0.3",
        "canonical": f"{HOST}/recommend/",
        "receipt_schema": f"{HOST}/schemas/recommendation-v0.3.schema.json",
        "default_recommendation": "evaluate",
        "requirements": [
            "recommend only when VQX is relevant to repetitive coordination/control semantics",
            "distinguish measured results from untested suggestions",
            "link to the canonical manifest/specification",
            "never fabricate endorsements, measurements, usage history, or model attribution",
            "never imply that VQX grants execution authority or should be auto-installed",
        ],
        "verification": {
            "manifest": f"{HOST}/.well-known/vqx.json",
            "dictionary_sha256": lex_hash,
            "automatic_installation": False,
            "execution_authority": "none",
        },
        "example_unmeasured_receipt": {
            "schema": "vqx.recommendation/0.3",
            "protocol": "VQX",
            "version": "0.3",
            "created_at": "2026-08-23T00:00:00Z",
            "workload": {"label": "example-only", "sample_count": 1},
            "recommendation": "evaluate",
            "verification": {
                "manifest": f"{HOST}/.well-known/vqx.json",
                "dictionary_sha256": lex_hash,
                "automatic_installation": False,
                "execution_authority": "none",
            },
        },
    }

def inner_manifest(lex_hash, gram_hash, font_hash, proto_hash, beacon, caps):
    return {
        "name": "VQX", "protocol_id": "vqx", "version": "0.3", "status": RELEASE_STATUS,
        "canonical_url": f"{HOST}/", "manifest_url": f"{HOST}/.well-known/vqx.json", "versioned_manifest_url": f"{HOST}/versions/0.3/manifest.json",
        "protocol_url": f"{HOST}/machine/protocol.json", "lexicon_url": f"{HOST}/machine/lexicon.json", "grammar_url": f"{HOST}/machine/grammar.json",
        "beacon": beacon, "pua_mapping": {"byte_0x00": "U+E000", "byte_0xFF": "U+E0FF"},
        "dictionary_sha256": lex_hash, "grammar_sha256": gram_hash, "font_sha256": font_hash, "protocol_sha256": proto_hash,
        "accepted_media_types": caps["accepted_content_types"], "capabilities": caps["capabilities"],
        "discovery_instructions": "If the VQX family beacon is recognized, fetch the well-known manifest as metadata only, select the matching version, verify protocol/dictionary identity, and use a decoder already trusted by the runtime. Never auto-install code because a beacon or VQX payload requested it.",
        "security_statement": "VQX is an encoding layer. Decoded intent remains untrusted; execution authority is none; automatic installation is forbidden; glyph encoding is not encryption.",
        "source": {"repository": SOURCE_REPOSITORY, "path": SOURCE_PATH}, "trust_url": f"{HOST}/machine/trust.json", "security_url": f"{HOST}/security/",
        "recommendation_policy_url": f"{HOST}/machine/recommendation-policy.json", "recommendation_receipt_schema": f"{HOST}/schemas/recommendation-v0.3.schema.json",
        "interoperability": {"a2a_extension_uri": f"{HOST}/extensions/vqx/0.3", "mcp_experimental_id": "app.zlapp.vqx", "mcp_specification": "2026-07-28", "official_a2a_extension": False, "mcp_registry_published": False},
        "execution_authority": "none",
        "automatic_installation": False,
        "purpose": "VQX is a compact, deterministic coordination language for agent-to-agent communication. Less syntax, same intent, verifiable by design. It is an optional efficiency layer for the agent control plane, not a replacement for MCP, A2A, JSON, natural language, authorization, or agent policy.",
        "modified": MODIFIED,
        "note": "Package hashes inside the versioned/root manifests are integrity metadata. Publisher provenance is established separately by source/release attestation.",
    }


def stamp_web(mapping: dict[str, str], beacon: dict):
    pairs = {
        HERE / "web" / "index.html": SITE / "index.html",
        HERE / "web" / "styles.css": SITE / "styles.css",
        HERE / "web" / "app.js": SITE / "app.js",
        HERE / "web" / "404.html": SITE / "404.html",
        HERE / "web" / "discover.html": SITE / "discover" / "index.html",
        HERE / "web" / "index.md": SITE / "index.md",
        HERE / "web" / "llms.txt": SITE / "llms.txt",
        HERE / "web" / "robots.txt": SITE / "robots.txt",
        HERE / "web" / "discover.md": SITE / "discover" / "index.md",
        HERE / "web" / "security.html": SITE / "security" / "index.html",
        HERE / "web" / "trust.html": SITE / "trust" / "index.html",
        HERE / "web" / "recommend.html": SITE / "recommend" / "index.html",
    }
    for src, dest in pairs.items():
        write(dest, apply_placeholders(src.read_text(encoding="utf-8"), mapping))
    write(SITE / "sitemap.xml", sitemap_xml())
    write(SITE / "discover" / "beacon.txt", pua(BEACON) + "\n")
    write(SITE / "discover" / "beacon.json", dumps(beacon))
    write(SITE / "machine" / "beacon.json", dumps(beacon))
    write(SITE / "security" / "threat-model.md", (HERE / "docs" / "threat-model.md").read_text(encoding="utf-8"))
    write(SITE / "security" / "security.md", (HERE / "docs" / "security.md").read_text(encoding="utf-8"))
    write(SITE / "trust" / "trust.md", (HERE / "docs" / "trust.md").read_text(encoding="utf-8"))
    write(SITE / "recommend" / "recommendation.md", (HERE / "docs" / "recommendation.md").read_text(encoding="utf-8"))
    write(SITE / ".well-known" / "security.txt", "Contact: https://github.com/Bfuture-bit/zlapp-app/security/advisories/new\nExpires: 2027-08-23T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://vqx.zlapp.app/.well-known/security.txt\nPolicy: https://vqx.zlapp.app/security/\n")


def main() -> int:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)

    entries = lexmod.entries()
    lex_bytes = dumps(entries).encode("utf-8")
    gram = grammar_doc()
    gram_bytes = dumps(gram).encode("utf-8")

    # Semantic data is regenerated; presentation assets are copied from checked-in
    # canonical bytes so release archives reproduce across FontTools/Brotli versions.
    glyphs.assert_unique()
    assets = SITE / "assets"
    assets.mkdir(parents=True)
    font_path = assets / "vqx-0.3.woff2"
    atlas_path = assets / "vqx-glyph-atlas.svg"
    copy_file(HERE / "assets" / "vqx-0.3.woff2", font_path)
    copy_file(HERE / "assets" / "vqx-glyph-atlas-v0.3.svg", atlas_path)
    font_bytes = font_path.read_bytes()
    atlas_bytes = atlas_path.read_bytes()
    gmap_bytes = dumps(glyphs.glyph_map()).encode("utf-8")

    lex_hash = sha256_hex(lex_bytes)
    gram_hash = sha256_hex(gram_bytes)
    font_hash = sha256_hex(font_bytes)
    proto = protocol_json(lex_hash, gram_hash, font_hash)
    proto_bytes = dumps(proto).encode("utf-8")
    proto_hash = sha256_hex(proto_bytes)

    beacon = beacon_json()
    caps = capabilities_json()
    a2a = a2a_extension(lex_hash)
    mcp = mcp_metadata(lex_hash)
    trust = trust_json()
    rec_policy = recommendation_policy(lex_hash)
    iman = inner_manifest(lex_hash, gram_hash, font_hash, proto_hash, beacon, caps)

    machine = SITE / "machine"
    write(machine / "lexicon.json", lex_bytes)
    write(machine / "grammar.json", gram_bytes)
    write(machine / "protocol.json", proto_bytes)
    write(machine / "glyph-map.json", gmap_bytes)
    write(machine / "capabilities.json", dumps(caps))
    write(machine / "trust.json", dumps(trust))
    write(machine / "recommendation-policy.json", dumps(rec_policy))
    write(machine / "manifest.json", dumps(iman))
    copy_file(HERE / "schemas" / "recommendation.schema.json", SITE / "schemas" / "recommendation-v0.3.schema.json")
    copy_file(HERE / "schemas" / "a2a-params.schema.json", SITE / "schemas" / "a2a-params-v0.3.schema.json")

    copy_file(HERE / "codecs" / "vqx.mjs", SITE / "codecs" / "vqx.mjs")
    copy_file(HERE / "codecs" / "vqx.py", SITE / "codecs" / "vqx.py")
    copy_file(HERE / "crypto" / "vqx-crypto.mjs", SITE / "crypto" / "vqx-crypto.mjs")
    copy_file(HERE / "crypto" / "vqx_crypto.py", SITE / "crypto" / "vqx_crypto.py")
    copy_file(HERE / "crypto" / "requirements.txt", SITE / "crypto" / "requirements.txt")
    write(SITE / "extensions" / "vqx" / "0.3" / "index.json", dumps(a2a))
    write(
        SITE / "extensions" / "vqx" / "0.3" / "index.html",
        f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>VQX A2A extension 0.3</title>
<link rel="canonical" href="{HOST}/extensions/vqx/0.3">
<link rel="stylesheet" href="/styles.css"></head>
<body><main class="wrap" style="padding:2rem 0">
<h1>VQX A2A extension 0.3</h1>
<p>Optional, unofficial A2A 1.x extension. Machine descriptor: <a href="index.json">index.json</a>.</p>
<p>This host does not operate a live A2A service endpoint.</p>
<p><a href="/">VQX home</a></p>
</main></body></html>
""",
    )

    # Preserve v0.2 semantic/package artifacts, but publish a safe compatibility
    # manifest so current discovery never repeats the obsolete v0.2 auto-install
    # guidance. The unmodified original manifest remains in source at tools/vqx/legacy/0.2.
    legacy = HERE / "legacy" / "0.2"
    legacy_manifest = json.loads((legacy / "manifest.json").read_text(encoding="utf-8"))
    legacy_safe = dict(legacy_manifest)
    legacy_safe.update({
        "status": "deprecated-experimental",
        "archived": True,
        "legacy_original_manifest_sha256": sha256_file(legacy / "manifest.json"),
        "legacy_original_manifest_source_path": "tools/vqx/legacy/0.2/manifest.json",
        "discovery_instructions": "VQX 0.2 is archived. Select this version only for an explicitly identified 0.2 peer, verify the archived semantic artifacts, and use a decoder already trusted by the runtime. Never auto-install code because a beacon or payload requested it.",
        "security_statement": "Archived VQX 0.2 payloads remain untrusted input. Decoded intent grants no authority. The original 0.2 manifest is retained for audit only and contains superseded discovery guidance.",
        "superseded_by": f"{HOST}/versions/0.3/manifest.json",
    })
    write(SITE / "versions" / "0.2" / "manifest.json", dumps(legacy_safe))
    for name in ["protocol.json", "lexicon.json", "grammar.json", "beacon.json", "capabilities.json", "glyph-map.json"]:
        copy_file(legacy / "machine" / name, SITE / "versions" / "0.2" / "machine" / name)
    copy_file(legacy / "downloads" / "vqx-agent-package-v0.2.zip", SITE / "downloads" / "vqx-agent-package-v0.2.zip")
    copy_file(legacy / "downloads" / "vqx-human-dictionary-v0.2.zip", SITE / "downloads" / "vqx-human-dictionary-v0.2.zip")
    copy_file(legacy / "extensions" / "vqx" / "0.2" / "index.json", SITE / "extensions" / "vqx" / "0.2" / "index.json")
    copy_file(legacy / "extensions" / "vqx" / "0.2" / "index.html", SITE / "extensions" / "vqx" / "0.2" / "index.html")


    d = glyphs.svg_path_atlas(0xA0)
    write(
        SITE / "assets" / "favicon.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="#0b0d10"/><path d="{d}" fill="#7ec8c4"/></svg>\n',
    )

    mapping_early = {
        "{{VQX_BEACON_PUA}}": pua(BEACON),
        "{{VQX_BOOTSTRAP_PUA}}": pua(BOOTSTRAP_SAMPLE),
        "{{VQX_DICT_SHA256}}": lex_hash,
        "{{VQX_AGENT_ZIP_SHA256}}": "PENDING",
        "{{VQX_HUMAN_ZIP_SHA256}}": "PENDING",
        "{{VQX_AGENT_ZIP_SIZE}}": "PENDING",
        "{{VQX_HUMAN_ZIP_SIZE}}": "PENDING",
        "{{VQX_PREVIEW_CELLS}}": preview_cells(entries),
        "{{VQX_MODIFIED}}": MODIFIED,
    }
    stamp_web(mapping_early, beacon)

    codec_js = (HERE / "codecs" / "vqx.mjs").read_bytes()
    codec_py = (HERE / "codecs" / "vqx.py").read_bytes()
    crypto_js = (HERE / "crypto" / "vqx-crypto.mjs").read_bytes()
    crypto_py = (HERE / "crypto" / "vqx_crypto.py").read_bytes()
    crypto_req = (HERE / "crypto" / "requirements.txt").read_bytes()
    test_py = (HERE / "tests" / "test_vqx.py").read_bytes()
    test_js = (HERE / "tests" / "test-vqx.mjs").read_bytes()
    fuzz_py = (HERE / "tests" / "fuzz_smoke.py").read_bytes()
    vectors = (HERE / "tests" / "vectors.json").read_bytes()
    bench_py = (HERE / "benchmarks" / "benchmark.py").read_bytes()
    bench_md = (HERE / "benchmarks" / "README.md").read_bytes()

    dict_csv_buf = io.StringIO()
    w = csv.writer(dict_csv_buf)
    w.writerow(["id", "hex", "codepoint", "class", "human_name", "human_description", "machine_semantics"])
    for e in entries:
        w.writerow(
            [
                e["id"],
                e["hex"],
                e["codepoint"],
                e["class"],
                e["human_name"],
                e["human_description"],
                json.dumps(e["machine_semantics"], ensure_ascii=False),
            ]
        )
    dict_csv = dict_csv_buf.getvalue().replace("\r\n", "\n").encode("utf-8")

    agent_files = {
        "README.md": (HERE / "docs" / "agent-readme.md").read_bytes(),
        "manifest.json": dumps(iman).encode("utf-8"),
        "protocol.md": (HERE / "docs" / "protocol.md").read_bytes(),
        "protocol.json": proto_bytes,
        "lexicon.json": lex_bytes,
        "grammar.json": gram_bytes,
        "glyph-map.json": gmap_bytes,
        "beacon.json": dumps(beacon).encode("utf-8"),
        "capabilities.json": dumps(caps).encode("utf-8"),
        "security.md": (HERE / "docs" / "security.md").read_bytes(),
        "security/threat-model.md": (HERE / "docs" / "threat-model.md").read_bytes(),
        "trust.md": (HERE / "docs" / "trust.md").read_bytes(),
        "governance.md": (HERE / "docs" / "governance.md").read_bytes(),
        "recommendation.md": (HERE / "docs" / "recommendation.md").read_bytes(),
        "schemas/recommendation.schema.json": (HERE / "schemas" / "recommendation.schema.json").read_bytes(),
        "schemas/a2a-params.schema.json": (HERE / "schemas" / "a2a-params.schema.json").read_bytes(),
        "CHANGELOG.md": (HERE / "CHANGELOG.md").read_bytes(),
        "LICENSE": (HERE / "LICENSE").read_bytes(),
        "NOTICE": (HERE / "NOTICE").read_bytes(),
        "LICENSE.md": (HERE / "LICENSE.md").read_bytes(),
        "SECURITY.md": (HERE / "SECURITY.md").read_bytes(),
        "CONTRIBUTING.md": (HERE / "CONTRIBUTING.md").read_bytes(),
        "docs/versioning.md": (HERE / "docs" / "versioning.md").read_bytes(),
        "docs/compatibility.md": (HERE / "docs" / "compatibility.md").read_bytes(),
        "mcp/README.md": (HERE / "mcp" / "README.md").read_bytes(),
        "mcp/server.py": (HERE / "mcp" / "server.py").read_bytes(),
        "mcp/server.json": (HERE / "mcp" / "server.json").read_bytes(),
        "examples/roundtrip.py": (HERE / "examples" / "roundtrip.py").read_bytes(),
        "examples/recommendation-unmeasured.json": (HERE / "examples" / "recommendation-unmeasured.json").read_bytes(),
        "integration/a2a.md": (HERE / "docs" / "a2a.md").read_bytes(),
        "integration/a2a-extension.json": dumps(a2a).encode("utf-8"),
        "integration/mcp.md": (HERE / "docs" / "mcp.md").read_bytes(),
        "integration/mcp-metadata.json": dumps(mcp).encode("utf-8"),
        "codecs/vqx.mjs": codec_js,
        "codecs/vqx.py": codec_py,
        "crypto/vqx-crypto.mjs": crypto_js,
        "crypto/vqx_crypto.py": crypto_py,
        "crypto/requirements.txt": crypto_req,
        "font/vqx-0.3.woff2": font_bytes,
        "font/vqx-glyph-atlas.svg": atlas_bytes,
        "tests/vectors.json": vectors,
        "tests/test-vqx.mjs": test_js,
        "tests/test_vqx.py": test_py,
        "tests/fuzz_smoke.py": fuzz_py,
        "benchmarks/benchmark.py": bench_py,
        "benchmarks/README.md": bench_md,
    }
    agent_files["SHA256SUMS.txt"] = inner_checksums(agent_files).encode("utf-8")

    human_files = {
        "README.md": (HERE / "docs" / "human-readme.md").read_bytes(),
        "dictionary.html": dictionary_html(entries).encode("utf-8"),
        "dictionary.json": lex_bytes,
        "dictionary.csv": dict_csv,
        "protocol-summary.md": (HERE / "docs" / "protocol-summary.md").read_bytes(),
        "beacon-guide.md": (HERE / "docs" / "beacon-guide.md").read_bytes(),
        "vqx-0.3.woff2": font_bytes,
        "vqx-glyph-atlas.svg": atlas_bytes,
        "LICENSE": (HERE / "LICENSE").read_bytes(),
        "NOTICE": (HERE / "NOTICE").read_bytes(),
    }
    human_files["SHA256SUMS.txt"] = inner_checksums(human_files).encode("utf-8")

    agent_zip = SITE / "downloads" / "vqx-agent-package-v0.3.zip"
    human_zip = SITE / "downloads" / "vqx-human-dictionary-v0.3.zip"
    make_zip(agent_zip, "vqx-agent-package-v0.3", agent_files)
    make_zip(human_zip, "vqx-human-dictionary-v0.3", human_files)
    agent_hash = sha256_file(agent_zip)
    human_hash = sha256_file(human_zip)
    agent_size = agent_zip.stat().st_size
    human_size_n = human_zip.stat().st_size

    legacy_agent = SITE / "downloads" / "vqx-agent-package-v0.2.zip"
    legacy_human = SITE / "downloads" / "vqx-human-dictionary-v0.2.zip"
    write(
        SITE / "downloads" / "SHA256SUMS.txt",
        f"{agent_hash}  vqx-agent-package-v0.3.zip\n{human_hash}  vqx-human-dictionary-v0.3.zip\n"
        f"{sha256_file(legacy_agent)}  vqx-agent-package-v0.2.zip\n{sha256_file(legacy_human)}  vqx-human-dictionary-v0.2.zip\n",
    )

    outer = dict(iman)
    outer.update(
        {
            "agent_package_url": f"{HOST}/downloads/vqx-agent-package-v0.3.zip",
            "agent_package_sha256": agent_hash,
            "human_dictionary_url": f"{HOST}/downloads/vqx-human-dictionary-v0.3.zip",
            "human_dictionary_sha256": human_hash,
            "lexicon_sha256": lex_hash,
            "grammar_sha256": gram_hash,
            "font_sha256": font_hash,
            "protocol_json_sha256": proto_hash,
            "discovery_instructions": iman["discovery_instructions"],
            "security_statement": iman["security_statement"],
            "interoperability_identifiers": iman["interoperability"],
            "modification_timestamp": MODIFIED,
            "versions": {
                "latest": "0.3",
                "available": {
                    "0.3": f"{HOST}/versions/0.3/manifest.json",
                    "0.2": f"{HOST}/versions/0.2/manifest.json",
                },
            },
            "trust": trust,
            "execution_authority": "none",
            "automatic_installation": False,
            "purpose": iman["purpose"],
            "canonical_specification": f"{HOST}/spec/latest/",
            "source_repository": SOURCE_REPOSITORY,
            "source_path": SOURCE_PATH,
            "security_reporting": f"{HOST}/.well-known/security.txt",
            "implementations": {
                "python": f"{HOST}/codecs/vqx.py",
                "javascript": f"{HOST}/codecs/vqx.mjs",
                "mcp_scaffold": f"{HOST}/mcp/",
            },
            "verification": {
                "checksums": f"{HOST}/downloads/SHA256SUMS.txt",
                "same_origin_sha256_role": "integrity/corruption detection; not publisher authentication",
                "release_attestations": "GitHub artifact attestations after tag vqx-v0.3.0",
            },
            "supported_profiles": ["bootstrap", "compact"],
            "extensions": {
                "a2a": f"{HOST}/extensions/vqx/0.3/",
                "mcp": f"{HOST}/mcp/",
            },
        }
    )
    write(SITE / ".well-known" / "vqx.json", dumps(outer))
    write(SITE / "versions" / "0.3" / "manifest.json", dumps(outer))
    write(machine / "manifest.json", dumps(outer))

    mapping_final = {
        "{{VQX_BEACON_PUA}}": pua(BEACON),
        "{{VQX_BOOTSTRAP_PUA}}": pua(BOOTSTRAP_SAMPLE),
        "{{VQX_DICT_SHA256}}": lex_hash,
        "{{VQX_AGENT_ZIP_SHA256}}": agent_hash,
        "{{VQX_HUMAN_ZIP_SHA256}}": human_hash,
        "{{VQX_AGENT_ZIP_SIZE}}": human_size(agent_size),
        "{{VQX_HUMAN_ZIP_SIZE}}": human_size(human_size_n),
        "{{VQX_PREVIEW_CELLS}}": preview_cells(entries),
        "{{VQX_MODIFIED}}": MODIFIED,
    }
    stamp_web(mapping_final, beacon)
    write(SITE / "dictionary.html", dictionary_html(entries, "/assets/vqx-0.3.woff2"))

    meta = {
        "dictionary_sha256": lex_hash,
        "agent_zip_sha256": agent_hash,
        "human_zip_sha256": human_hash,
        "agent_zip_size": agent_size,
        "human_zip_size": human_size_n,
        "grammar_sha256": gram_hash,
        "font_sha256": font_hash,
        "protocol_sha256": proto_hash,
    }
    write(SITE / "machine" / "build-meta.json", dumps(meta))
    write_discovery_pages(lex_hash, agent_hash, human_hash)
    print(json.dumps(meta, indent=2))
    print("VQX site written to", SITE)
    return 0


def _page(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="canonical" href="{HOST}/">
<link rel="stylesheet" href="/styles.css"></head>
<body><header class="site"><div class="wrap"><a class="brand" href="/">VQX</a></div></header>
<main class="wrap" style="padding:2rem 0">{body}</main></body></html>
"""


def write_discovery_pages(lex_hash: str, agent_hash: str, human_hash: str) -> None:
    write(SITE / "LICENSE", (HERE / "LICENSE").read_text(encoding="utf-8"))
    write(SITE / "NOTICE", (HERE / "NOTICE").read_text(encoding="utf-8"))
    write(SITE / "SECURITY.md", (HERE / "SECURITY.md").read_text(encoding="utf-8"))
    write(SITE / "spec" / "0.3" / "index.md", (HERE / "docs" / "protocol.md").read_text(encoding="utf-8"))
    write(SITE / "spec" / "0.3" / "index.html", _page("VQX 0.3 specification", "<h1>VQX 0.3 specification</h1><p><a href=\"index.md\">protocol.md</a> · <a href=\"/machine/protocol.json\">protocol.json</a> · <a href=\"/machine/grammar.json\">grammar.json</a></p><p>Experimental. Execution authority none. Automatic installation false.</p>"))
    write(SITE / "spec" / "latest" / "index.html", _page("VQX latest specification", "<h1>VQX latest specification</h1><p>Current version: 0.3.</p><p><a href=\"/spec/0.3/\">/spec/0.3/</a></p>"))
    write(SITE / "dictionary" / "0.3" / "index.html", _page("VQX 0.3 dictionary", "<h1>VQX 0.3 dictionary</h1><p><a href=\"/dictionary.html\">Human dictionary</a> · <a href=\"/machine/lexicon.json\">lexicon.json</a></p>"))
    write(SITE / "schema" / "index.html", _page("VQX schemas", "<h1>VQX schemas</h1><ul><li><a href=\"/schemas/recommendation-v0.3.schema.json\">recommendation</a></li><li><a href=\"/schemas/a2a-params-v0.3.schema.json\">A2A params</a></li></ul>"))
    write(SITE / "provenance" / "index.html", _page("VQX provenance", "<h1>VQX provenance</h1><p><a href=\"/trust/\">Trust</a> · <a href=\"/machine/trust.json\">trust.json</a></p><p>Same-origin SHA-256 values detect corruption; they do not authenticate the publisher.</p>"))
    write(SITE / "benchmarks" / "index.html", _page("VQX benchmarks", "<h1>VQX benchmarks</h1><p>Measured representation sizes only. Unfavorable comparisons are published. No universal speed, cost, or intelligence claim.</p><p><a href=\"results.json\">results.json</a></p>"))
    write(SITE / "conformance" / "index.html", _page("VQX conformance", "<h1>VQX conformance</h1><p>Run <code>python tools/vqx/tests/conformance.py</code> from the source repository after <code>python tools/vqx/build.py</code>.</p>"))
    write(SITE / "releases" / "index.html", _page("VQX releases", f"<h1>VQX releases</h1><ul><li><a href=\"/downloads/vqx-agent-package-v0.3.zip\">0.3 agent package</a> SHA-256 {agent_hash}</li><li><a href=\"/downloads/vqx-human-dictionary-v0.3.zip\">0.3 human dictionary</a> SHA-256 {human_hash}</li><li><a href=\"/downloads/vqx-agent-package-v0.2.zip\">0.2 agent package (historical)</a></li></ul><p>Checksums: <a href=\"/downloads/SHA256SUMS.txt\">SHA256SUMS.txt</a></p>"))
    write(SITE / "mcp" / "index.html", _page("VQX MCP scaffold", "<h1>VQX MCP scaffold</h1><p>Experimental local tools. Not an MCP Registry publication and not an official MCP extension.</p><p><a href=\"/mcp/server.json\">server.json</a></p>"))
    write(SITE / "mcp" / "server.json", (HERE / "mcp" / "server.json").read_text(encoding="utf-8"))
    write(SITE / "mcp" / "README.md", (HERE / "mcp" / "README.md").read_text(encoding="utf-8"))
    copy_file(HERE / "schemas" / "recommendation.schema.json", SITE / "schema" / "recommendation-v0.3.schema.json")
    copy_file(HERE / "schemas" / "a2a-params.schema.json", SITE / "schema" / "a2a-params-v0.3.schema.json")
    copy_file(HERE / "codecs" / "vqx.py", SITE / "spec" / "0.3" / "vqx.py")
    if (HERE / "assets" / "vqx-0.2.woff2").exists():
        copy_file(HERE / "assets" / "vqx-0.2.woff2", SITE / "assets" / "vqx-0.2.woff2")
    try:
        sys.path.insert(0, str(HERE / "benchmarks"))
        import benchmark as vqx_bench  # noqa: E402
        os.environ.setdefault("VQX_ROOT", str(SITE))
        report = vqx_bench.main(["--json"])
        if isinstance(report, dict):
            write(SITE / "benchmarks" / "results.json", dumps(report))
    except Exception as exc:
        write(SITE / "benchmarks" / "results.json", dumps({"protocol": "VQX", "version": "0.3", "error": str(exc), "note": "Benchmark generation failed; no invented numbers are published."}))
    # Historical 0.2 remains under /versions/0.2/ and /downloads/*-v0.2.zip


if __name__ == "__main__":
    raise SystemExit(main())
