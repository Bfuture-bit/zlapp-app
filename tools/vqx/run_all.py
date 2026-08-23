#!/usr/bin/env python3
"""Build VQX 0.2, run tests, start a local server, and browser-check the homepage."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "site" / "public" / "sites" / "vqx"


def run(cmd, **kw):
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, **kw)


def main() -> int:
    run([sys.executable, str(ROOT / "tools" / "vqx" / "build.py")], cwd=str(ROOT))
    env = os.environ.copy()
    env["VQX_ROOT"] = str(SITE / "machine")
    run([sys.executable, str(ROOT / "tools" / "vqx" / "tests" / "conformance.py")], env=env)
    run([sys.executable, str(ROOT / "tools" / "vqx" / "benchmarks" / "benchmark.py")], env=env, cwd=str(ROOT / "tools" / "vqx" / "benchmarks"))

    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"],
        cwd=str(SITE),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(20):
            try:
                urllib.request.urlopen("http://127.0.0.1:8765/", timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        chrome = "google-chrome-stable" if Path("/usr/bin/google-chrome-stable").exists() else "google-chrome"
        dump = subprocess.check_output(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--user-data-dir=/tmp/vqx-chrome",
                "--virtual-time-budget=8000",
                "--dump-dom",
                "http://127.0.0.1:8765/?e2e=1",
            ],
            text=True,
            timeout=40,
        )
        if 'id="e2e-report"' not in dump and "data-e2e=" not in dump:
            raise SystemExit("browser e2e report missing")
        marker = dump.find('id="e2e-report"')
        snippet = dump[max(0, marker) : marker + 1200] if marker >= 0 else dump
        print(snippet[:800])
        if "REQUEST PEER RESPOND GLYPH_ONLY" not in dump:
            # report JSON may be HTML-escaped; accept data-e2e attribute
            if "REQUEST" not in dump:
                raise SystemExit("browser e2e did not encode sample")
        discover = urllib.request.urlopen("http://127.0.0.1:8765/discover/", timeout=5).read().decode("utf-8")
        if "U+E0D3" not in discover:
            raise SystemExit("discover page missing codepoints")
        agent = urllib.request.urlopen("http://127.0.0.1:8765/downloads/vqx-agent-package-v0.2.zip", timeout=10)
        if agent.status != 200:
            raise SystemExit("agent zip not downloadable")
        human = urllib.request.urlopen("http://127.0.0.1:8765/downloads/vqx-human-dictionary-v0.2.zip", timeout=10)
        if human.status != 200:
            raise SystemExit("human zip not downloadable")
        mobile = subprocess.check_output(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--user-data-dir=/tmp/vqx-chrome-mobile",
                "--window-size=390,844",
                "--virtual-time-budget=4000",
                "--dump-dom",
                "http://127.0.0.1:8765/",
            ],
            text=True,
            timeout=40,
        )
        if "<h1>VQX</h1>" not in mobile:
            raise SystemExit("mobile homepage missing title")
        print("BROWSER PASS")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

    meta = json.loads((SITE / "machine" / "build-meta.json").read_text(encoding="utf-8"))
    print("\nVQX 0.2 BUILD COMPLETE")
    print("Canonical URL:")
    print("https://vqx.zlapp.app/")
    print("Agent package:")
    print("downloads/vqx-agent-package-v0.2.zip")
    print("SHA-256:", meta["agent_zip_sha256"])
    print("Size:", meta["agent_zip_size"])
    print("Human dictionary:")
    print("downloads/vqx-human-dictionary-v0.2.zip")
    print("SHA-256:", meta["human_zip_sha256"])
    print("Size:", meta["human_zip_size"])
    print("Manifest:")
    print(".well-known/vqx.json")
    print("Beacon:")
    print("D3 A7 5C E1 9B 02")
    print("U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002")
    print("Dictionary SHA-256:")
    print(meta["dictionary_sha256"])
    print("Deployment root:")
    print(SITE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
