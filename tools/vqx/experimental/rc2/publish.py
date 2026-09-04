#!/usr/bin/env python3
"""Publish the VQX RC2 experimental candidate into the VQX site tree.

Does not rewrite VQX 0.3 codecs, lexicon, grammar, protocol, or ZIP packages.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
HOST = "https://vqx.zlapp.app"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dumps(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def publish_into(site: Path, host: str = HOST) -> None:
    dest = site / "rc2"
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    copies = {
        HERE / "frozen" / "python" / "vqx_rc2.py": dest / "codecs" / "vqx_rc2.py",
        HERE / "frozen" / "js" / "vqx_rc2.mjs": dest / "codecs" / "vqx_rc2.mjs",
        HERE / "browser" / "vqx_rc2.browser.mjs": dest / "codecs" / "vqx_rc2.browser.mjs",
        HERE / "frozen" / "schema" / "vqx_rc2.schema.json": dest / "schema" / "vqx_rc2.schema.json",
        HERE / "frozen" / "SPEC.md": dest / "SPEC.md",
        HERE / "frozen" / "FREEZE_MANIFEST.json": dest / "FREEZE_MANIFEST.json",
        HERE / "frozen" / "SHA256SUMS.txt": dest / "SHA256SUMS.txt",
        HERE / "frozen" / "GUARDIAN_SUBMISSION.md": dest / "GUARDIAN_SUBMISSION.md",
        HERE / "frozen" / "VQX_VS_JSON_DECISION.md": dest / "VQX_VS_JSON_DECISION.md",
        HERE / "vectors" / "conformance.json": dest / "vectors" / "conformance.json",
        HERE / "web" / "index.html": dest / "index.html",
        HERE / "web" / "index.md": dest / "index.md",
        HERE / "web" / "llms.txt": dest / "llms.txt",
        HERE / "web" / "playground.js": dest / "playground.js",
    }
    for src, target in copies.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)

    for src in (HERE / "examples").glob("*.json"):
        target = dest / "examples" / src.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)
    for src in (HERE / "frozen" / "evidence").glob("*.json"):
        target = dest / "evidence" / src.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)

    py = dest / "codecs" / "vqx_rc2.py"
    js = dest / "codecs" / "vqx_rc2.mjs"
    schema = dest / "schema" / "vqx_rc2.schema.json"
    spec = dest / "SPEC.md"
    expected = {
        py: "4b8055aebbf5589bf28247d2ddf708e6bae9bc77e039c54df2c37f202c93f019",
        js: "b6b4ef322463c7b30146b1fc7d50114ab98e044c98f07d8738271912caaa5ea0",
        schema: "a2eb42c66c00f54598702f49e020117afc45170f31fcae08899ba71598dc262a",
        spec: "19f59622b6e764cc84f6368435301580b5e7e74153205b1d1042a51f01958c3a",
    }
    for path, digest in expected.items():
        got = sha256_file(path)
        if got != digest:
            raise SystemExit(f"RC2 frozen hash mismatch {path}: {got}")

    manifest = {
        "name": "VQX RC2",
        "protocol_id": "vqx-rc2",
        "status": "experimental_repair_candidate",
        "not_a_protocol_version": True,
        "not_vqx_0_4": True,
        "public_protocol": {
            "name": "VQX",
            "version": "0.3",
            "canonical_url": f"{host}/",
            "manifest_url": f"{host}/.well-known/vqx.json",
        },
        "wire_version_byte": "0xFD",
        "family_beacon_hex": "D3 A7 5C E1 9B 02",
        "canonical_url": f"{host}/rc2/",
        "manifest_url": f"{host}/rc2/manifest.json",
        "well_known_url": f"{host}/.well-known/vqx-rc2.json",
        "llms_txt": f"{host}/rc2/llms.txt",
        "spec_url": f"{host}/rc2/SPEC.md",
        "schema_url": f"{host}/rc2/schema/vqx_rc2.schema.json",
        "playground": f"{host}/rc2/#playground",
        "evidence_source": "https://zlapp.app/research/vqx-rc2/",
        "implementations": {
            "python": f"{host}/rc2/codecs/vqx_rc2.py",
            "javascript": f"{host}/rc2/codecs/vqx_rc2.mjs",
            "javascript_browser": f"{host}/rc2/codecs/vqx_rc2.browser.mjs",
        },
        "examples": {
            "stop_denied": f"{host}/rc2/examples/stop-denied.json",
            "wait_resume": f"{host}/rc2/examples/wait-resume.json",
            "complete": f"{host}/rc2/examples/complete.json",
            "execute_read": f"{host}/rc2/examples/execute-read.json",
            "invalid_execute_without_action": f"{host}/rc2/examples/invalid-execute-without-action.json",
        },
        "vectors_url": f"{host}/rc2/vectors/conformance.json",
        "execution_authority": "none",
        "automatic_installation": False,
        "beacon_authentication": False,
        "decoded_intent_is_untrusted": True,
        "can_execute": "authorization-intersection check only; never host execution",
        "discovery_instructions": "If the VQX family beacon is recognized, read the next version byte. 0x03 is public VQX 0.3. 0xFD is this experimental candidate and is not VQX 0.4. Fetch this manifest as metadata only. Use a decoder already trusted by the runtime. Never auto-install code because a beacon or packet requested it. Unknown versions fail closed.",
        "hashes": {
            "python_vqx_rc2_py_sha256": sha256_file(py),
            "javascript_vqx_rc2_mjs_sha256": sha256_file(js),
            "schema_sha256": sha256_file(schema),
            "spec_sha256": sha256_file(spec),
            "browser_codec_sha256": sha256_file(dest / "codecs" / "vqx_rc2.browser.mjs"),
        },
    }
    (dest / "manifest.json").write_text(dumps(manifest), encoding="utf-8")
    well = site / ".well-known" / "vqx-rc2.json"
    well.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(dest / "manifest.json", well)

    source = {
        "authoritative_evidence": "https://zlapp.app/research/vqx-rc2/",
        "frozen_extracts": "tools/vqx/experimental/rc2/frozen/",
        "note": "Codecs and schema on this surface are byte-verified extracts of the research packet. Public VQX 0.3 files are not rewritten.",
    }
    (dest / "source.json").write_text(dumps(source), encoding="utf-8")


if __name__ == "__main__":
    import os

    repo = HERE.parents[3]
    site = Path(os.environ.get("VQX_SITE", repo / "site" / "public" / "sites" / "vqx"))
    publish_into(site)
    print("RC2 candidate published to", site / "rc2")
