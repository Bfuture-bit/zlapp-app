#!/usr/bin/env python3
"""Site and package conformance checks for VQX 0.2."""

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
SITE = ROOT / "site" / "public" / "sites" / "vqx"
HOST = "https://vqx.zlapp.app"
FORBIDDEN = ("example.com", "localhost", "TODO", "FIXME", "lorem ipsum", "dummy package hash")

passed = 0
failed = 0
errors: list[str] = []


def ok(name: str, cond: bool, detail: str = ""):
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


def main() -> int:
    lex = json.loads((SITE / "machine" / "lexicon.json").read_text(encoding="utf-8"))
    ok("lexicon 256", len(lex) == 256)
    ids = [e["id"] for e in lex]
    ok("ids 0-255 unique", sorted(ids) == list(range(256)))
    ok(
        "pua map",
        all(e["codepoint"] == f"U+E0{e['id']:02X}" for e in lex),
    )

    gmap = json.loads((SITE / "machine" / "glyph-map.json").read_text(encoding="utf-8"))
    hashes = [gmap[f"{i:02X}"]["path_sha256"] for i in range(256)]
    ok("unique glyph paths", len(set(hashes)) == 256)

    font = SITE / "assets" / "vqx-0.2.woff2"
    ok("woff2 exists", font.exists() and font.stat().st_size > 1000, str(font.stat().st_size if font.exists() else 0))

    env = os.environ.copy()
    env["VQX_ROOT"] = str(SITE / "machine")
    py = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "vqx" / "tests" / "test_vqx.py")],
        cwd=str(ROOT / "tools" / "vqx" / "tests"),
        env=env,
        capture_output=True,
        text=True,
    )
    ok("python codec tests", py.returncode == 0, py.stdout + py.stderr)
    js = subprocess.run(
        ["node", str(ROOT / "tools" / "vqx" / "tests" / "test-vqx.mjs")],
        cwd=str(ROOT / "tools" / "vqx" / "tests"),
        env=env,
        capture_output=True,
        text=True,
    )
    ok("js codec tests", js.returncode == 0, js.stdout + js.stderr)

    well = json.loads((SITE / ".well-known" / "vqx.json").read_text(encoding="utf-8"))
    dump = json.dumps(well)
    ok("manifest https only", "http://" not in dump and HOST in dump)
    ok("no example.com in manifest", "example.com" not in dump)

    text_blobs = []
    for p in SITE.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() in {".zip", ".woff2", ".py"}:
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
                ok(f"forbidden {needle} in {p.relative_to(SITE)}", False, needle)
                break
        else:
            pass
    ok("no leftover placeholders", all("{{VQX_" not in t for _, t in text_blobs))

    agent = SITE / "downloads" / "vqx-agent-package-v0.2.zip"
    human = SITE / "downloads" / "vqx-human-dictionary-v0.2.zip"
    ok("agent zip", agent.exists() and zipfile.is_zipfile(agent))
    ok("human zip", human.exists() and zipfile.is_zipfile(human))
    with zipfile.ZipFile(agent) as zf:
        names = zf.namelist()
        ok("agent zip opens", "vqx-agent-package-v0.2/lexicon.json" in names)
        with zf.open("vqx-agent-package-v0.2/lexicon.json") as fh:
            inner = json.loads(fh.read())
        ok("agent lexicon 256", len(inner) == 256)
        ok("zip has no own hash", b"agent_package_sha256" not in zf.read("vqx-agent-package-v0.2/manifest.json"))

    sums = (SITE / "downloads" / "SHA256SUMS.txt").read_text(encoding="utf-8")
    ok("agent sha published", sha256(agent) in sums)
    ok("human sha published", sha256(human) in sums)
    ok("well-known agent hash", well.get("agent_package_sha256") == sha256(agent))
    ok("well-known human hash", well.get("human_dictionary_sha256") == sha256(human))
    ok("well-known dict hash", well.get("dictionary_sha256") == sha256(SITE / "machine" / "lexicon.json"))

    sm = ET.parse(SITE / "sitemap.xml")
    ok("sitemap xml", sm.getroot() is not None)
    locs = [el.text for el in sm.getroot().iter() if el.tag.endswith("loc")]
    ok("sitemap https host", all(x and x.startswith(HOST) for x in locs))

    json_fail = []
    for p in SITE.rglob("*.json"):
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            json_fail.append(f"{p}: {e}")
    ok("all json parse", not json_fail, "; ".join(json_fail[:4]))

    missing = []
    href_re = re.compile(r"""(?:href|src)=["'](/[^"'#?]+)""")
    for html in list(SITE.rglob("*.html")) + list(SITE.rglob("*.md")) + list(SITE.rglob("*.txt")) + list(SITE.rglob("*.xml")):
        try:
            t = html.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for m in href_re.findall(t):
            if m.startswith("//"):
                continue
            rel = m[1:]
            if rel.endswith("/"):
                cand = SITE / rel / "index.html"
            else:
                cand = SITE / rel
            if not cand.exists() and not (SITE / rel / "index.html").exists():
                missing.append(f"{html.relative_to(SITE)} -> {m}")
    ok("internal links resolve", not missing, "; ".join(missing[:8]))

    index = (SITE / "index.html").read_text(encoding="utf-8")
    ok("canonical host", HOST in index)
    ok("describedby", 'rel="describedby"' in index)
    ok("index.md exists", (SITE / "index.md").exists())
    ok("llms.txt exists", (SITE / "llms.txt").exists())
    ok("robots.txt exists", (SITE / "robots.txt").exists())
    ok("beacon pua in discover", "\ue0d3" in (SITE / "discover" / "beacon.txt").read_text(encoding="utf-8"))
    ok("experimental not standard", "not an industry standard" in index.lower() or "not an industry standard" in (SITE / "index.md").read_text().lower())

    print(f"\n{passed} passed, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
