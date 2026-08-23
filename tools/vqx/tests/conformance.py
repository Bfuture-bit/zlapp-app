#!/usr/bin/env python3
"""Release, site, codec, and trust conformance checks for VQX 0.3."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
VQX = ROOT / "tools" / "vqx"
SITE = ROOT / "site" / "public" / "sites" / "vqx"
HOST = "https://vqx.zlapp.app"
FORBIDDEN = ("example.com", "localhost", "TODO", "FIXME", "lorem ipsum", "dummy package hash")

passed = 0
failed = 0
errors: list[str] = []


def ok(name: str, cond: bool, detail: str = "") -> None:
    global passed, failed
    if cond:
        passed += 1
        print("PASS", name)
    else:
        failed += 1
        msg = f"FAIL {name}" + (f": {detail}" if detail else "")
        errors.append(msg)
        print(msg)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(name: str, cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    proc = subprocess.run(cmd, cwd=str(cwd or ROOT), env=env, capture_output=True, text=True)
    ok(name, proc.returncode == 0, (proc.stdout + proc.stderr)[-4000:])


def main() -> int:
    ok("site built", SITE.exists())
    lex_path = SITE / "machine" / "lexicon.json"
    lex = json.loads(lex_path.read_text(encoding="utf-8"))
    ok("lexicon has exactly 256 entries", len(lex) == 256)
    ids = [e["id"] for e in lex]
    names = [e["human_name"] for e in lex]
    ok("lexicon ids are exactly 0..255", sorted(ids) == list(range(256)))
    ok("lexicon names unique", len(set(names)) == 256)
    ok("PUA mapping consistent", all(e["codepoint"] == f"U+E0{e['id']:02X}" for e in lex))

    gmap = json.loads((SITE / "machine" / "glyph-map.json").read_text(encoding="utf-8"))
    hashes = [gmap[f"{i:02X}"]["path_sha256"] for i in range(256)]
    ok("all 256 glyph paths are unique", len(set(hashes)) == 256)

    font = SITE / "assets" / "vqx-0.3.woff2"
    source_font = VQX / "assets" / "vqx-0.3.woff2"
    ok("canonical WOFF2 exists", font.exists() and font.stat().st_size > 1000)
    ok("published WOFF2 exactly matches checked-in asset", font.exists() and source_font.exists() and font.read_bytes() == source_font.read_bytes())

    env = os.environ.copy()
    env["VQX_ROOT"] = str(SITE / "machine")
    run("Python codec tests", [sys.executable, str(VQX / "tests" / "test_vqx.py")], cwd=VQX / "tests", env=env)
    run("JavaScript codec tests", ["node", str(VQX / "tests" / "test-vqx.mjs")], cwd=VQX / "tests", env=env)
    run("deterministic fuzz smoke test", [sys.executable, str(VQX / "tests" / "fuzz_smoke.py")], cwd=VQX / "tests", env=env)

    well = json.loads((SITE / ".well-known" / "vqx.json").read_text(encoding="utf-8"))
    trust = json.loads((SITE / "machine" / "trust.json").read_text(encoding="utf-8"))
    protocol = json.loads((SITE / "machine" / "protocol.json").read_text(encoding="utf-8"))
    grammar = json.loads((SITE / "machine" / "grammar.json").read_text(encoding="utf-8"))
    caps = json.loads((SITE / "machine" / "capabilities.json").read_text(encoding="utf-8"))

    ok("root manifest is VQX 0.3", well.get("protocol_id") == "vqx" and well.get("version") == "0.3")
    ok("root manifest uses HTTPS canonical host", "http://" not in json.dumps(well) and HOST in json.dumps(well))
    ok("automatic installation forbidden", well.get("trust", {}).get("automatic_installation") is False and protocol.get("security", {}).get("automatic_installation") is False and caps.get("automatic_installation") is False)
    ok("execution authority is none", well.get("trust", {}).get("execution_authority") == "none" and protocol.get("security", {}).get("execution_authority") == "none" and caps.get("execution_authority") == "none")
    discovery = str(well.get("discovery_instructions", "")).lower()
    ok("discovery requires already-trusted decoder", "already trusted" in discovery)
    ok("discovery explicitly forbids auto-install", "never auto-install" in discovery)
    ok("beacon is identification not authentication", protocol.get("beacon", {}).get("role") == "protocol_family_identification_not_authentication" and protocol.get("security", {}).get("beacon_authenticates_sender") is False)
    ok("unsupported flags fail closed", grammar.get("bootstrap", {}).get("allowed_flags_mask") == 0 and "unsupported_flags" in grammar.get("fail_closed", []))
    ok("limits declared", grammar.get("bootstrap", {}).get("max_payload_bytes_default") == 65535 and grammar.get("local_macros", {}).get("max_expanded_bytes_default") == 65535)
    ok("source provenance points at public repository", trust.get("source", {}).get("repository") == "https://github.com/Bfuture-bit/zlapp-app" and trust.get("source", {}).get("path") == "tools/vqx")
    ok("same-origin hash limitation documented", "not publisher authentication" in trust.get("same_origin_sha256_role", ""))
    ok("VQX Apache-2.0 license declared", trust.get("license", {}).get("id") == "Apache-2.0" and (VQX / "LICENSE").exists() and "Apache License" in (VQX / "LICENSE").read_text(encoding="utf-8"))

    versions = well.get("versions", {})
    ok("0.3 is latest version", versions.get("latest") == "0.3")
    ok("0.2 and 0.3 manifests addressable", set(versions.get("available", {})) >= {"0.2", "0.3"} and (SITE / "versions" / "0.2" / "manifest.json").exists() and (SITE / "versions" / "0.3" / "manifest.json").exists())
    legacy_safe = json.loads((SITE / "versions" / "0.2" / "manifest.json").read_text(encoding="utf-8"))
    ok("0.2 compatibility manifest deprecates unsafe discovery", legacy_safe.get("archived") is True and "never auto-install" in legacy_safe.get("discovery_instructions", "").lower())

    sec = (SITE / ".well-known" / "security.txt").read_text(encoding="utf-8")
    ok("security.txt has required Contact", re.search(r"(?m)^Contact:\s*https://", sec) is not None)
    ok("security.txt has Expires", re.search(r"(?m)^Expires:\s*\d{4}-\d{2}-\d{2}T", sec) is not None)
    ok("security.txt canonical URL", f"Canonical: {HOST}/.well-known/security.txt" in sec)
    ok("threat model published", (SITE / "security" / "threat-model.md").exists())
    ok("recommendation schema published", (SITE / "schemas" / "recommendation-v0.3.schema.json").exists())
    rec_policy = json.loads((SITE / "machine" / "recommendation-policy.json").read_text(encoding="utf-8"))
    ok("recommendation policy published", rec_policy.get("default_recommendation") == "evaluate" and rec_policy.get("verification", {}).get("automatic_installation") is False and rec_policy.get("verification", {}).get("execution_authority") == "none")
    ok("recommendation policy forbids fabricated endorsements", any("never fabricate" in x for x in rec_policy.get("requirements", [])))
    ok("A2A params schema published", (SITE / "schemas" / "a2a-params-v0.3.schema.json").exists())
    ok("A2A descriptor exists", (SITE / "extensions" / "vqx" / "0.3" / "index.json").exists())
    ok("Apache LICENSE published at site root", (SITE / "LICENSE").exists() and "Apache License" in (SITE / "LICENSE").read_text(encoding="utf-8"))
    ok("root manifest execution_authority none", well.get("execution_authority") == "none")
    ok("root manifest automatic_installation false", well.get("automatic_installation") is False)
    for rel in ["spec/0.3/index.html", "spec/latest/index.html", "dictionary/0.3/index.html", "schema/index.html", "provenance/index.html", "benchmarks/index.html", "conformance/index.html", "releases/index.html", "mcp/index.html"]:
        ok(f"discovery path {rel}", (SITE / rel).exists())
    ok("MCP registry not falsely claimed", json.loads((SITE / "mcp" / "server.json").read_text(encoding="utf-8")).get("mcp_registry_published") is False)

    # Public text must not accidentally re-introduce unsafe bootstrap instructions.
    text_blobs: list[tuple[Path, str]] = []
    for p in SITE.rglob("*"):
        if not p.is_file() or p.suffix.lower() in {".zip", ".woff2"}:
            continue
        if "build/" in str(p.relative_to(SITE)):
            continue
        try:
            t = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        text_blobs.append((p, t))
        low = t.lower()
        for needle in FORBIDDEN:
            if needle.lower() in low and "{{VQX_" not in t:
                ok(f"forbidden placeholder/example in {p.relative_to(SITE)}", False, needle)
                break
    ok("no unexpanded web placeholders", all("{{VQX_" not in t for _, t in text_blobs))
    unsafe_phrases = ("install a compatible decoder", "obtain a compatible decoder", "agent installation")
    unsafe_hits = [str(p.relative_to(SITE)) for p, t in text_blobs if any(x in t.lower() for x in unsafe_phrases)]
    ok("no unsafe auto-install discovery language", not unsafe_hits, ", ".join(unsafe_hits[:10]))

    agent = SITE / "downloads" / "vqx-agent-package-v0.3.zip"
    human = SITE / "downloads" / "vqx-human-dictionary-v0.3.zip"
    old_agent = SITE / "downloads" / "vqx-agent-package-v0.2.zip"
    old_human = SITE / "downloads" / "vqx-human-dictionary-v0.2.zip"
    ok("0.3 agent ZIP valid", agent.exists() and zipfile.is_zipfile(agent))
    ok("0.3 human ZIP valid", human.exists() and zipfile.is_zipfile(human))
    ok("0.2 packages preserved", old_agent.exists() and old_human.exists())
    with zipfile.ZipFile(agent) as zf:
        znames = zf.namelist()
        prefix = "vqx-agent-package-v0.3/"
        required = {
            prefix + "lexicon.json", prefix + "manifest.json", prefix + "codecs/vqx.py", prefix + "codecs/vqx.mjs",
            prefix + "security/threat-model.md", prefix + "trust.md", prefix + "recommendation.md", prefix + "tests/fuzz_smoke.py",
        }
        ok("agent package contains trust/security/test surface", required.issubset(set(znames)), str(sorted(required - set(znames))))
        inner_manifest = json.loads(zf.read(prefix + "manifest.json"))
        ok("inner manifest does not claim package hash", "agent_package_sha256" not in inner_manifest)
        ok("inner manifest forbids auto-install", "never auto-install" in inner_manifest.get("discovery_instructions", "").lower())

    sums = (SITE / "downloads" / "SHA256SUMS.txt").read_text(encoding="utf-8")
    for name, path in (("0.3 agent", agent), ("0.3 human", human), ("0.2 agent", old_agent), ("0.2 human", old_human)):
        ok(f"{name} SHA-256 published", sha256(path) in sums)
    ok("manifest 0.3 agent digest correct", well.get("agent_package_sha256") == sha256(agent))
    ok("manifest 0.3 human digest correct", well.get("human_dictionary_sha256") == sha256(human))
    ok("manifest lexicon digest correct", well.get("lexicon_sha256") == sha256(lex_path))

    json_fail: list[str] = []
    for p in SITE.rglob("*.json"):
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except Exception as exc:
            json_fail.append(f"{p.relative_to(SITE)}: {exc}")
    ok("all published JSON parses", not json_fail, "; ".join(json_fail[:6]))

    sm = ET.parse(SITE / "sitemap.xml")
    locs = [el.text for el in sm.getroot().iter() if el.tag.endswith("loc")]
    ok("sitemap URLs use canonical host", bool(locs) and all(x and x.startswith(HOST) for x in locs))

    href_re = re.compile(r'''(?:href|src)=["'](/[^"'#?]+)''')
    missing: list[str] = []
    for page in list(SITE.rglob("*.html")) + list(SITE.rglob("*.md")) + list(SITE.rglob("*.txt")):
        try:
            t = page.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for target in href_re.findall(t):
            if target.startswith("//"):
                continue
            rel = target[1:]
            cand = SITE / rel
            if target.endswith("/"):
                cand = cand / "index.html"
            if not cand.exists() and not (SITE / rel / "index.html").exists():
                missing.append(f"{page.relative_to(SITE)} -> {target}")
    ok("internal absolute links resolve", not missing, "; ".join(missing[:10]))

    index = (SITE / "index.html").read_text(encoding="utf-8")
    ok("homepage states experimental/non-standard status", "not an industry standard" in index.lower())
    ok("homepage says no automatic installation", "no automatic installation" in index.lower())
    ok("homepage says no execution authority", "no execution authority" in index.lower())
    ok("machine discovery files exist", all((SITE / x).exists() for x in ["index.md", "llms.txt", "robots.txt", "discover/beacon.txt", "discover/beacon.json", "machine/recommendation-policy.json"]))
    ok("no misleading partial public builder", not (SITE / "build" / "build_packages.py").exists())
    ok("beacon PUA bytes preserved", "\ue0d3" in (SITE / "discover" / "beacon.txt").read_text(encoding="utf-8"))

    print(f"\n{passed} passed, {failed} failed")
    if errors:
        print("\nFailures:")
        for e in errors:
            print(" -", e)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
