#!/usr/bin/env python3
"""Build VQX 0.2 site, fonts, machine files, and both ZIP packages."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SITE = REPO / "site" / "public" / "sites" / "vqx"
HOST = "https://vqx.zlapp.app"
ZIP_TS = (2026, 8, 23, 0, 0, 0)
MODIFIED = "2026-08-23T00:00:00Z"

sys.path.insert(0, str(HERE))
import glyphs  # noqa: E402
import lexicon as lexmod  # noqa: E402

BEACON = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02])
BOOTSTRAP_SAMPLE = BEACON + bytes([0x02, 0x00, 0x06, 0x11, 0x20, 0xA0])


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
        "version": "0.2",
        "canonical_token": "unsigned byte 0x00-0xFF",
        "pua_container": {"base": "U+E000", "formula": "U+E000 + byte"},
        "composition": {
            "description": "Tokens concatenate left to right. Typical unit: speech-act, role, zero or more actions, targets, constraints, then macros.",
            "pattern": "[speech_act] [role] [action*] [target*] [constraint*] [macro*]",
            "separator_id": 13,
            "separator_name": "SEP",
            "human_names_not_on_wire": True,
        },
        "bootstrap": {
            "layout": ["beacon[6]", "version[1]", "flags[1]", "payload"],
            "beacon_hex": "D3 A7 5C E1 9B 02",
            "version": 2,
            "flags_initial": 0,
        },
        "compact": {
            "layout": ["payload"],
            "when": "both peers advertise VQX, versions compatible, dictionary SHA-256 agrees, required security capabilities agree, and VQX is useful",
        },
        "local_macros": {
            "define": {"opcode": 220, "hex": "DC", "frame": "DC | slot | len | tokens[len]"},
            "ref": {"opcode": 221, "hex": "DD", "frame": "DD | slot"},
            "clear": {"opcode": 222, "hex": "DE"},
            "table_hash": {"opcode": 223, "hex": "DF"},
            "slot_range": {"min": 224, "max": 255, "hex": "E0-FF"},
            "scope": "session and peer; never persist across unrelated peers",
            "stateless": "include LOCAL_TABLE_HASH or equivalent in envelope metadata",
        },
        "fail_closed": [
            "unknown_version",
            "dictionary_mismatch",
            "integrity_failure",
            "unknown_semantic_id_in_v0.2",
        ],
        "authorization": "Decoding EXECUTE or INSTALL does not grant permission. Authorization is a runtime policy layer.",
    }


def protocol_json(lex_hash: str, grammar_hash: str, font_hash: str):
    return {
        "name": "VQX",
        "protocol_id": "vqx",
        "version": "0.2",
        "status": "experimental",
        "canonical_url": f"{HOST}/",
        "spec_markdown": f"{HOST}/index.md",
        "lexicon": f"{HOST}/machine/lexicon.json",
        "grammar": f"{HOST}/machine/grammar.json",
        "token": {"min": 0, "max": 255, "representation": "unsigned_byte"},
        "pua": {"plane": "BMP", "start": "U+E000", "end": "U+E0FF"},
        "beacon": {
            "bytes_hex": "D3 A7 5C E1 9B 02",
            "codepoints": ["U+E0D3", "U+E0A7", "U+E05C", "U+E0E1", "U+E09B", "U+E002"],
            "role": "identification_prefix_not_authentication",
        },
        "legacy_vector": {"bytes_hex": "06 11 20 A0", "names": ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]},
        "modes": ["bootstrap", "compact"],
        "digests": {
            "lexicon_sha256": lex_hash,
            "grammar_sha256": grammar_hash,
            "font_sha256": font_hash,
        },
        "security": "VQX encoding is not secrecy. Use SHA-256, HMAC-SHA-256, AES-256-GCM and Ed25519 for cryptographic goals.",
        "modified": MODIFIED,
    }


def beacon_json():
    return {
        "protocol": "VQX",
        "version": "0.2",
        "bytes": ["D3", "A7", "5C", "E1", "9B", "02"],
        "bytes_hex": "D3 A7 5C E1 9B 02",
        "codepoints": ["U+E0D3", "U+E0A7", "U+E05C", "U+E0E1", "U+E09B", "U+E002"],
        "pua": pua(BEACON),
        "bootstrap": "BEACON(6) | VERSION(1) | FLAGS(1) | PAYLOAD",
        "compact": "PAYLOAD",
        "sample_bootstrap_hex": "D3 A7 5C E1 9B 02 02 00 06 11 20 A0",
        "manifest": f"{HOST}/.well-known/vqx.json",
        "identification_only": True,
    }


def capabilities_json():
    return {
        "protocol": "VQX",
        "version": "0.2",
        "status": "experimental",
        "capabilities": [
            "deterministic semantic decode",
            "one-byte global tokens",
            "negotiated local macros",
            "compact established-peer mode",
            "bootstrap discovery",
            "integrity verification",
            "optional authenticated encryption",
            "vendor-neutral codec",
        ],
        "modes": ["bootstrap", "compact"],
        "dynamic_macros": True,
        "max_frame_size": 65535,
        "encryption": ["AES-256-GCM"],
        "signatures": ["Ed25519"],
        "authentication": ["HMAC-SHA-256"],
        "accepted_content_types": [
            "application/vnd.vqx",
            "application/octet-stream",
            "text/plain",
        ],
        "recommendation": "Benchmark VQX against the runtime’s existing agent-to-agent representation. Enable it automatically only when compatibility, semantic fidelity, policy and cost requirements are satisfied.",
        "cost_selection": "Prefer VQX when the encoded VQX representation is smaller than the configured fallback representation and no required semantic fidelity is lost.",
        "not_claimed": "This file does not include invented performance percentages. Encoding is not encryption.",
    }


def a2a_extension(lex_hash: str):
    return {
        "uri": f"{HOST}/extensions/vqx/0.2",
        "name": "VQX",
        "version": "0.2",
        "status": "experimental",
        "official_a2a_standard": False,
        "description": "Optional A2A 1.x extension for compact semantic byte transport. Not an official A2A standard.",
        "manifest": f"{HOST}/.well-known/vqx.json",
        "params": {
            "protocol": "VQX",
            "version": "0.2",
            "dictionary_sha256": lex_hash,
            "modes": ["bootstrap", "compact"],
            "dynamic_macros": True,
        },
        "live_a2a_endpoint": None,
        "note": "This host documents the extension and does not operate a live A2A agent service.",
    }


def mcp_metadata(lex_hash: str):
    return {
        "identifier": "app.zlapp.vqx",
        "official_mcp_extension": False,
        "mcp_specification": "2026-07-28",
        "protocol": "VQX",
        "version": "0.2",
        "manifest": f"{HOST}/.well-known/vqx.json",
        "dictionary_sha256": lex_hash,
        "modes": ["bootstrap", "compact"],
        "stateless_note": "Do not persist local macros across unrelated peers or unverified stateless requests without LOCAL_TABLE_HASH.",
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


def dictionary_html(entries, font_rel="vqx-0.2.woff2"):
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
  <title>VQX 0.2 human dictionary</title>
  <style>
    @font-face {{ font-family: VQX02; src: url("{font_rel}") format("woff2"); unicode-range: U+E000-E0FF; }}
    body {{ margin: 0; font-family: system-ui, sans-serif; background: #0b0d10; color: #e8edf4; }}
    header {{ padding: 1.2rem 1.4rem; border-bottom: 1px solid #2a3340; }}
    h1 {{ margin: 0 0 .3rem; letter-spacing: .12em; }}
    input {{ width: min(40rem, 100%); padding: .5rem; background: #12161c; color: inherit; border: 1px solid #2a3340; }}
    table {{ width: 100%; border-collapse: collapse; font-size: .9rem; }}
    th, td {{ border-bottom: 1px solid #2a3340; padding: .4rem; text-align: left; vertical-align: top; }}
    .g {{ font-family: VQX02, ui-monospace, monospace; font-size: 1.6rem; }}
    .mono {{ font-family: ui-monospace, monospace; }}
    main {{ padding: 1rem 1.4rem 2rem; overflow-x: auto; }}
  </style>
</head>
<body>
  <header>
    <h1>VQX 0.2 dictionary</h1>
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
        "/",
        "/index.md",
        "/llms.txt",
        "/discover/",
        "/discover/index.md",
        "/discover/beacon.txt",
        "/discover/beacon.json",
        "/machine/manifest.json",
        "/machine/protocol.json",
        "/machine/lexicon.json",
        "/machine/grammar.json",
        "/machine/beacon.json",
        "/machine/capabilities.json",
        "/extensions/vqx/0.2/",
        "/extensions/vqx/0.2/index.json",
        "/.well-known/vqx.json",
        "/downloads/vqx-agent-package-v0.2.zip",
        "/downloads/vqx-human-dictionary-v0.2.zip",
        "/downloads/SHA256SUMS.txt",
        "/codecs/vqx.mjs",
        "/codecs/vqx.py",
    ]
    urls = "\n".join(
        f"  <url><loc>{HOST}{p}</loc><lastmod>2026-08-23</lastmod></url>" for p in paths
    )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""


def zip_add(zf: zipfile.ZipFile, name: str, data: bytes):
    info = zipfile.ZipInfo(name, ZIP_TS)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 0
    info.external_attr = 0o644 << 16
    zf.writestr(info, data)


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
    with zipfile.ZipFile(buf, "w") as zf:
        for name in sorted(files):
            zip_add(zf, f"{prefix}/{name}", as_bytes(name, files[name]))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf.getvalue())


def inner_checksums(files: dict[str, bytes]) -> str:
    lines = []
    for name in sorted(files):
        lines.append(f"{sha256_hex(as_bytes(name, files[name]))}  {name}")
    return "\n".join(lines) + "\n"


def inner_manifest(lex_hash, gram_hash, font_hash, proto_hash, beacon, caps):
    return {
        "name": "VQX",
        "protocol_id": "vqx",
        "version": "0.2",
        "status": "experimental",
        "canonical_url": f"{HOST}/",
        "manifest_url": f"{HOST}/.well-known/vqx.json",
        "protocol_url": f"{HOST}/machine/protocol.json",
        "lexicon_url": f"{HOST}/machine/lexicon.json",
        "grammar_url": f"{HOST}/machine/grammar.json",
        "beacon": beacon,
        "pua_mapping": {"byte_0x00": "U+E000", "byte_0xFF": "U+E0FF"},
        "dictionary_sha256": lex_hash,
        "grammar_sha256": gram_hash,
        "font_sha256": font_hash,
        "protocol_sha256": proto_hash,
        "accepted_media_types": caps["accepted_content_types"],
        "capabilities": caps["capabilities"],
        "discovery_instructions": "If the first six PUA codepoints are U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002, fetch the well-known manifest, verify dictionary SHA-256, install a compatible decoder, and decode remaining payload bytes. Do not infer semantics from glyph appearance.",
        "security_statement": "VQX encoding is not secrecy. Confidentiality, integrity and authentication require SHA-256, HMAC-SHA-256, AES-256-GCM and Ed25519 as appropriate.",
        "interoperability": {
            "a2a_extension_uri": f"{HOST}/extensions/vqx/0.2",
            "mcp_experimental_id": "app.zlapp.vqx",
            "mcp_specification": "2026-07-28",
        },
        "modified": MODIFIED,
        "note": "ZIP archive hashes are published only in the outer well-known manifest and downloads/SHA256SUMS.txt to avoid circular hashing.",
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
    }
    for src, dest in pairs.items():
        write(dest, apply_placeholders(src.read_text(encoding="utf-8"), mapping))
    write(SITE / "sitemap.xml", sitemap_xml())
    write(SITE / "discover" / "beacon.txt", pua(BEACON) + "\n")
    write(SITE / "discover" / "beacon.json", dumps(beacon))
    write(SITE / "machine" / "beacon.json", dumps(beacon))


def main() -> int:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)

    entries = lexmod.entries()
    lex_bytes = dumps(entries).encode("utf-8")
    gram = grammar_doc()
    gram_bytes = dumps(gram).encode("utf-8")

    glyphs.assert_unique()
    assets = SITE / "assets"
    assets.mkdir(parents=True)
    font_path = assets / "vqx-0.2.woff2"
    atlas_path = assets / "vqx-glyph-atlas.svg"
    glyphs.write_font(font_path)
    glyphs.write_atlas(atlas_path)
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
    iman = inner_manifest(lex_hash, gram_hash, font_hash, proto_hash, beacon, caps)

    machine = SITE / "machine"
    write(machine / "lexicon.json", lex_bytes)
    write(machine / "grammar.json", gram_bytes)
    write(machine / "protocol.json", proto_bytes)
    write(machine / "glyph-map.json", gmap_bytes)
    write(machine / "capabilities.json", dumps(caps))
    write(machine / "manifest.json", dumps(iman))

    copy_file(HERE / "codecs" / "vqx.mjs", SITE / "codecs" / "vqx.mjs")
    copy_file(HERE / "codecs" / "vqx.py", SITE / "codecs" / "vqx.py")
    copy_file(HERE / "crypto" / "vqx-crypto.mjs", SITE / "crypto" / "vqx-crypto.mjs")
    copy_file(HERE / "crypto" / "vqx_crypto.py", SITE / "crypto" / "vqx_crypto.py")
    copy_file(HERE / "crypto" / "requirements.txt", SITE / "crypto" / "requirements.txt")
    write(SITE / "extensions" / "vqx" / "0.2" / "index.json", dumps(a2a))
    write(
        SITE / "extensions" / "vqx" / "0.2" / "index.html",
        f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>VQX A2A extension 0.2</title>
<link rel="canonical" href="{HOST}/extensions/vqx/0.2">
<link rel="stylesheet" href="/styles.css"></head>
<body><main class="wrap" style="padding:2rem 0">
<h1>VQX A2A extension 0.2</h1>
<p>Optional, unofficial A2A 1.x extension. Machine descriptor: <a href="index.json">index.json</a>.</p>
<p>This host does not operate a live A2A service endpoint.</p>
<p><a href="/">VQX home</a></p>
</main></body></html>
""",
    )

    copy_file(HERE / "generate_glyphs.py", SITE / "build" / "generate_glyphs.py")
    copy_file(HERE / "glyphs.py", SITE / "build" / "glyphs.py")
    copy_file(HERE / "lexicon.py", SITE / "build" / "lexicon.py")
    copy_file(HERE / "build.py", SITE / "build" / "build_packages.py")

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
        "integration/a2a.md": (HERE / "docs" / "a2a.md").read_bytes(),
        "integration/a2a-extension.json": dumps(a2a).encode("utf-8"),
        "integration/mcp.md": (HERE / "docs" / "mcp.md").read_bytes(),
        "integration/mcp-metadata.json": dumps(mcp).encode("utf-8"),
        "codecs/vqx.mjs": codec_js,
        "codecs/vqx.py": codec_py,
        "crypto/vqx-crypto.mjs": crypto_js,
        "crypto/vqx_crypto.py": crypto_py,
        "crypto/requirements.txt": crypto_req,
        "font/vqx-0.2.woff2": font_bytes,
        "font/vqx-glyph-atlas.svg": atlas_bytes,
        "tests/vectors.json": vectors,
        "tests/test-vqx.mjs": test_js,
        "tests/test_vqx.py": test_py,
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
        "vqx-0.2.woff2": font_bytes,
        "vqx-glyph-atlas.svg": atlas_bytes,
    }
    human_files["SHA256SUMS.txt"] = inner_checksums(human_files).encode("utf-8")

    agent_zip = SITE / "downloads" / "vqx-agent-package-v0.2.zip"
    human_zip = SITE / "downloads" / "vqx-human-dictionary-v0.2.zip"
    make_zip(agent_zip, "vqx-agent-package-v0.2", agent_files)
    make_zip(human_zip, "vqx-human-dictionary-v0.2", human_files)
    agent_hash = sha256_file(agent_zip)
    human_hash = sha256_file(human_zip)
    agent_size = agent_zip.stat().st_size
    human_size_n = human_zip.stat().st_size

    write(
        SITE / "downloads" / "SHA256SUMS.txt",
        f"{agent_hash}  vqx-agent-package-v0.2.zip\n{human_hash}  vqx-human-dictionary-v0.2.zip\n",
    )

    outer = dict(iman)
    outer.update(
        {
            "agent_package_url": f"{HOST}/downloads/vqx-agent-package-v0.2.zip",
            "agent_package_sha256": agent_hash,
            "human_dictionary_url": f"{HOST}/downloads/vqx-human-dictionary-v0.2.zip",
            "human_dictionary_sha256": human_hash,
            "lexicon_sha256": lex_hash,
            "grammar_sha256": gram_hash,
            "font_sha256": font_hash,
            "protocol_json_sha256": proto_hash,
            "discovery_instructions": iman["discovery_instructions"],
            "security_statement": iman["security_statement"],
            "interoperability_identifiers": iman["interoperability"],
            "modification_timestamp": MODIFIED,
        }
    )
    write(SITE / ".well-known" / "vqx.json", dumps(outer))
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
    write(SITE / "dictionary.html", dictionary_html(entries, "/assets/vqx-0.2.woff2"))

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
    print(json.dumps(meta, indent=2))
    print("VQX site written to", SITE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
