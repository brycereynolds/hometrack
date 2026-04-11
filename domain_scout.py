#!/usr/bin/env python3
"""
domain_scout.py — AI-powered domain name research tool.

Usage:
    # Basic availability check for specific domains
    python domain_scout.py check atrium.io arbor.co parcl.app

    # Brainstorm variations of a base name across TLDs
    python domain_scout.py sweep atrium arbor portico parcl

    # AI-powered: generate new name ideas from a product spec
    python domain_scout.py brainstorm --spec product-spec.md --favorites "atrium,arbor,portico,parcl"

    # AI-powered: generate creative domain variations for a name
    python domain_scout.py riff arbor --style "short,architectural,real-estate"

    # Full pipeline: brainstorm + sweep + check (the works)
    python domain_scout.py pipeline --spec product-spec.md --favorites "atrium,arbor"

Environment:
    ANTHROPIC_API_KEY  — required for brainstorm/riff/pipeline commands
"""

import argparse
import json
import os
import socket
import subprocess
import sys
import time
import re
import textwrap
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_TLDS = [
    # Classic / premium (all Cloudflare-supported)
    ".com", ".co", ".io", ".ai", ".app", ".dev", ".net", ".org",
    # Real estate / property industry
    ".house", ".estate", ".realty", ".properties", ".land", ".place",
    ".build", ".space", ".rent", ".capital",
    # Creative / startup-friendly
    ".sh", ".me", ".live", ".site", ".run", ".work", ".world",
]

PREFIX_PATTERNS = ["get{name}", "use{name}", "try{name}", "{name}hq", "{name}app"]
SUFFIX_PATTERNS = ["{name}app", "{name}hq"]

WHOIS_TIMEOUT = 10  # seconds

LOG_FILE = Path(__file__).parent / "domain_check_log.json"
CACHE_TTL_HOURS = 24

# ---------------------------------------------------------------------------
# Domain check log (read/write/cache)
# ---------------------------------------------------------------------------

def _load_log() -> dict:
    """Load the domain check log from disk."""
    if LOG_FILE.exists():
        try:
            return json.loads(LOG_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {"metadata": {"created": time.strftime("%Y-%m-%d"), "last_updated": None, "total_checks": 0}, "checks": {}}


def _save_log(log: dict):
    """Persist the domain check log to disk."""
    log["metadata"]["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    log["metadata"]["total_checks"] = len(log["checks"])
    LOG_FILE.write_text(json.dumps(log, indent=2))


def _is_cached(entry: dict) -> bool:
    """Return True if a log entry is fresh enough to use as cache."""
    checked_at = entry.get("checked_at")
    if not checked_at:
        return False
    try:
        from datetime import datetime, timezone, timedelta
        ts = datetime.fromisoformat(checked_at.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - ts).total_seconds() < CACHE_TTL_HOURS * 3600
    except (ValueError, TypeError):
        return False


def _log_result(log: dict, result: "DomainResult"):
    """Write a single DomainResult into the log dict (call _save_log after batch)."""
    entry = {
        "status": result.availability.value,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    if result.whois_registrar:
        entry["registrar"] = result.whois_registrar
    if result.whois_org:
        entry["org"] = result.whois_org
    if result.note:
        entry["note"] = result.note
    log["checks"][result.domain] = entry


def _cached_result(domain: str, entry: dict) -> "DomainResult":
    """Reconstruct a DomainResult from a cache entry."""
    r = DomainResult(domain=domain)
    r.availability = Availability(entry["status"])
    r.whois_registrar = entry.get("registrar")
    r.whois_org = entry.get("org")
    r.note = entry.get("note", "")
    if r.note:
        r.note = f"[cached] {r.note}"
    else:
        r.note = "[cached]"
    return r


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

class Availability(Enum):
    AVAILABLE = "AVAILABLE"
    TAKEN = "TAKEN"
    PARKED = "PARKED"          # resolves but no real content / whois shows no org
    LIKELY_TAKEN = "LIKELY_TAKEN"
    POSSIBLY_AVAILABLE = "POSSIBLY_AVAILABLE"
    ERROR = "ERROR"


@dataclass
class DomainResult:
    domain: str
    dns_resolves: bool = False
    whois_registered: Optional[bool] = None
    whois_expiry: Optional[str] = None
    whois_registrar: Optional[str] = None
    whois_org: Optional[str] = None
    availability: Availability = Availability.ERROR
    error: Optional[str] = None
    note: Optional[str] = None

    def summary_line(self) -> str:
        icon = {
            Availability.AVAILABLE: "✅",
            Availability.POSSIBLY_AVAILABLE: "🟡",
            Availability.PARKED: "🅿️ ",
            Availability.TAKEN: "❌",
            Availability.LIKELY_TAKEN: "❌",
            Availability.ERROR: "⚠️ ",
        }.get(self.availability, "?")
        extra = ""
        if self.whois_registrar:
            extra += f"  registrar={self.whois_registrar}"
        if self.whois_org:
            extra += f"  org={self.whois_org}"
        if self.whois_expiry:
            extra += f"  expires={self.whois_expiry}"
        if self.note:
            extra += f"  ({self.note})"
        return f"  {icon} {self.domain:<35s} {self.availability.value:<20s}{extra}"


# ---------------------------------------------------------------------------
# DNS check
# ---------------------------------------------------------------------------

def check_dns(domain: str) -> bool:
    """Returns True if the domain resolves to any address."""
    try:
        socket.setdefaulttimeout(5)
        socket.getaddrinfo(domain, 80)
        return True
    except (socket.gaierror, socket.timeout, OSError):
        return False


# ---------------------------------------------------------------------------
# WHOIS check (shell out to `whois` binary — more reliable than python-whois)
# ---------------------------------------------------------------------------

def parse_whois_output(raw: str) -> dict:
    """Extract structured fields from raw whois text."""
    info: dict = {"registered": None, "registrar": None, "org": None, "expiry": None, "raw_snippet": ""}

    lower = raw.lower()

    # Detect "not found" / "no match" patterns across registries
    not_found_patterns = [
        "no match for", "not found", "no data found", "no entries found",
        "domain not found", "no object found", "status: free",
        "status: available", "is available for",
    ]
    if any(p in lower for p in not_found_patterns):
        info["registered"] = False
        return info

    # Detect registered patterns
    registered_patterns = [
        "domain name:", "registrant", "creation date:", "created:",
        "registry domain id:", "name server:", "nserver:",
    ]
    if any(p in lower for p in registered_patterns):
        info["registered"] = True

    # Extract registrar
    for line in raw.splitlines():
        ll = line.lower().strip()
        if ll.startswith("registrar:"):
            info["registrar"] = line.split(":", 1)[1].strip()[:80]
        elif "registrant organization:" in ll or "registrant org:" in ll:
            info["org"] = line.split(":", 1)[1].strip()[:80]
        elif "expiry date:" in ll or "expiration date:" in ll or "registry expiry" in ll:
            info["expiry"] = line.split(":", 1)[1].strip()[:30]

    # Keep a snippet for debugging
    info["raw_snippet"] = raw[:500]

    return info


def check_whois(domain: str) -> dict:
    """Run system `whois` command and parse results."""
    try:
        result = subprocess.run(
            ["whois", domain],
            capture_output=True, text=True, timeout=WHOIS_TIMEOUT,
        )
        raw = result.stdout + result.stderr
        return parse_whois_output(raw)
    except subprocess.TimeoutExpired:
        return {"registered": None, "error": "whois timeout"}
    except FileNotFoundError:
        return {"registered": None, "error": "whois binary not found"}
    except Exception as e:
        return {"registered": None, "error": str(e)[:100]}


# ---------------------------------------------------------------------------
# Combined availability assessment
# ---------------------------------------------------------------------------

def assess_domain(domain: str) -> DomainResult:
    """Check DNS + WHOIS and return a DomainResult with best-effort availability."""
    r = DomainResult(domain=domain)

    r.dns_resolves = check_dns(domain)

    whois_info = check_whois(domain)
    r.whois_registered = whois_info.get("registered")
    r.whois_registrar = whois_info.get("registrar")
    r.whois_org = whois_info.get("org")
    r.whois_expiry = whois_info.get("expiry")

    if whois_info.get("error"):
        r.error = whois_info["error"]

    # Decision matrix
    if r.whois_registered is False and not r.dns_resolves:
        r.availability = Availability.AVAILABLE
    elif r.whois_registered is False and r.dns_resolves:
        # Weird edge case — might be a wildcard TLD DNS
        r.availability = Availability.POSSIBLY_AVAILABLE
        r.note = "WHOIS says unregistered but DNS resolves — verify manually"
    elif r.whois_registered is True and r.dns_resolves:
        if r.whois_org:
            r.availability = Availability.TAKEN
        else:
            r.availability = Availability.LIKELY_TAKEN
            r.note = "registered, resolves, but no org — could be parked"
    elif r.whois_registered is True and not r.dns_resolves:
        r.availability = Availability.LIKELY_TAKEN
        r.note = "registered but not resolving — could be parked/expired"
    else:
        # whois_registered is None (error/timeout)
        if r.dns_resolves:
            r.availability = Availability.LIKELY_TAKEN
        else:
            r.availability = Availability.POSSIBLY_AVAILABLE
            r.note = "WHOIS lookup failed — verify manually"

    return r


def check_domains_parallel(domains: list[str], max_workers: int = 8) -> list[DomainResult]:
    """Check a list of domains in parallel, using cache where available."""
    log = _load_log()
    cached_results = {}
    to_check = []

    for d in domains:
        entry = log["checks"].get(d)
        if entry and _is_cached(entry):
            cached_results[d] = _cached_result(d, entry)
            print(f"   [cached] {d} -> {entry['status']}")
        else:
            to_check.append(d)

    fresh_results = []
    if to_check:
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(assess_domain, d): d for d in to_check}
            for future in as_completed(futures):
                r = future.result()
                fresh_results.append(r)
                _log_result(log, r)
        _save_log(log)

    # Merge and sort back into input order
    all_results = list(cached_results.values()) + fresh_results
    order = {d: i for i, d in enumerate(domains)}
    all_results.sort(key=lambda r: order.get(r.domain, 999))
    return all_results


# ---------------------------------------------------------------------------
# Domain generation helpers
# ---------------------------------------------------------------------------

def generate_sweep_domains(base_names: list[str], tlds: list[str] | None = None) -> list[str]:
    """Generate base + TLD combinations plus common prefix/suffix patterns on .com."""
    tlds = tlds or DEFAULT_TLDS
    domains = []
    for name in base_names:
        name = name.lower().strip()
        for tld in tlds:
            domains.append(f"{name}{tld}")
        # Prefix/suffix .com variants
        for pat in PREFIX_PATTERNS:
            domains.append(pat.format(name=name) + ".com")
    return list(dict.fromkeys(domains))  # dedupe preserving order


# ---------------------------------------------------------------------------
# Anthropic API helpers
# ---------------------------------------------------------------------------

def get_anthropic_client():
    """Lazy-load the Anthropic SDK."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable for AI features.", file=sys.stderr)
        sys.exit(1)
    try:
        import anthropic
    except ImportError:
        print("Installing anthropic SDK...", file=sys.stderr)
        subprocess.check_call([sys.executable, "-m", "pip", "install", "anthropic", "-q"])
        import anthropic
    return anthropic.Anthropic(api_key=api_key)


def ai_brainstorm(spec_path: str, favorites: list[str], count: int = 20) -> list[dict]:
    """
    Use Claude to brainstorm product names given a spec and a list of names the user likes.
    Returns a list of {name, rationale} dicts.
    """
    client = get_anthropic_client()
    spec_text = Path(spec_path).read_text()

    # Truncate spec if huge
    if len(spec_text) > 12000:
        spec_text = spec_text[:12000] + "\n...[truncated]..."

    prompt = f"""You are a brand naming expert. A founder is building the product described below and needs a name.

<product_spec>
{spec_text}
</product_spec>

Names they liked (for style/vibe reference): {', '.join(favorites)}
Names they rejected: Hearthstone

Constraints:
- Short (ideally 4-7 characters, max 9)
- Real English words or near-words strongly preferred (not invented compound words)
- Must work well as a subdomain prefix (clients will visit clientname.PRODUCT.tld)
- Architectural, spatial, or nature metaphors resonate
- Should feel premium/boutique, not enterprise/corporate
- AI sits in the background — name should NOT scream "AI product"
- Avoid names of major existing tech products

Generate exactly {count} name suggestions. For each, give the name and a one-sentence rationale.

Respond ONLY in this JSON format, no other text:
[
  {{"name": "example", "rationale": "One sentence explanation."}},
  ...
]"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()
    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def ai_riff(base_name: str, style_hints: str = "", count: int = 15) -> list[dict]:
    """
    Use Claude to generate creative domain-friendly variations of a base name.
    """
    client = get_anthropic_client()

    prompt = f"""You are a domain name specialist. The founder loves the name "{base_name}" but can't find available domains for it.

Generate {count} creative variations that:
- Keep the spirit/meaning of "{base_name}"
- Are short (4-8 chars ideally)
- Work as standalone brand names (not just "{base_name}" with random letters appended)
- Include: spelling tweaks, etymological cousins, translations, truncations, related words
- Do NOT just add "the", "my", "go", or numbers
{f"- Style direction: {style_hints}" if style_hints else ""}

Respond ONLY in this JSON format:
[
  {{"name": "example", "relationship": "How it relates to {base_name}"}},
  ...
]"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


# ---------------------------------------------------------------------------
# CLI Commands
# ---------------------------------------------------------------------------

def cmd_check(args):
    """Check specific domains."""
    print(f"\n🔍 Checking {len(args.domains)} domain(s)...\n")
    results = check_domains_parallel(args.domains, max_workers=args.workers)
    for r in results:
        print(r.summary_line())
    print()
    _print_summary(results)


def cmd_sweep(args):
    """Sweep base names across TLDs."""
    tlds = args.tlds.split(",") if args.tlds else None
    domains = generate_sweep_domains(args.names, tlds)
    print(f"\n🔍 Sweeping {len(args.names)} name(s) × {len(tlds or DEFAULT_TLDS)} TLDs + prefix variants = {len(domains)} domains...\n")
    results = check_domains_parallel(domains, max_workers=args.workers)

    # Group by base name
    for name in args.names:
        name = name.lower()
        group = [r for r in results if r.domain.startswith(name) or name in r.domain]
        print(f"\n  ── {name.upper()} ──")
        for r in group:
            print(r.summary_line())
    print()
    _print_summary(results)


def cmd_brainstorm(args):
    """AI-powered name brainstorming from a product spec."""
    favorites = [f.strip() for f in args.favorites.split(",")] if args.favorites else ["atrium", "arbor", "portico"]
    print(f"\n🤖 Brainstorming names from spec: {args.spec}")
    print(f"   Style reference: {', '.join(favorites)}\n")

    suggestions = ai_brainstorm(args.spec, favorites, count=args.count)

    print(f"   Generated {len(suggestions)} suggestions:\n")
    for i, s in enumerate(suggestions, 1):
        print(f"   {i:2d}. {s['name']:<20s} — {s['rationale']}")

    if args.check:
        # Auto-sweep the suggestions
        names = [s["name"].lower() for s in suggestions]
        tlds = args.tlds.split(",") if args.tlds else [".io", ".co", ".app", ".realty", ".com"]
        domains = generate_sweep_domains(names, tlds)
        print(f"\n🔍 Checking availability for {len(domains)} domain combinations...\n")
        results = check_domains_parallel(domains, max_workers=args.workers)

        available = [r for r in results if r.availability in (Availability.AVAILABLE, Availability.POSSIBLY_AVAILABLE)]
        if available:
            print("   ── POTENTIALLY AVAILABLE ──")
            for r in available:
                print(r.summary_line())
        else:
            print("   No clearly available domains found — verify top picks on a registrar.")
        print()
        _print_summary(results)


def cmd_riff(args):
    """AI-powered variations on a single name."""
    print(f"\n🤖 Generating variations of '{args.name}'...\n")
    variations = ai_riff(args.name, style_hints=args.style, count=args.count)

    print(f"   {len(variations)} variations:\n")
    for i, v in enumerate(variations, 1):
        print(f"   {i:2d}. {v['name']:<20s} — {v['relationship']}")

    if args.check:
        names = [v["name"].lower() for v in variations]
        tlds = args.tlds.split(",") if args.tlds else [".io", ".co", ".app", ".realty", ".com"]
        domains = generate_sweep_domains(names, tlds)
        print(f"\n🔍 Checking {len(domains)} domains...\n")
        results = check_domains_parallel(domains, max_workers=args.workers)

        available = [r for r in results if r.availability in (Availability.AVAILABLE, Availability.POSSIBLY_AVAILABLE)]
        if available:
            print("   ── POTENTIALLY AVAILABLE ──")
            for r in available:
                print(r.summary_line())
        print()
        _print_summary(results)


def cmd_pipeline(args):
    """Full pipeline: brainstorm → sweep → report."""
    favorites = [f.strip() for f in args.favorites.split(",")] if args.favorites else ["atrium", "arbor", "portico"]
    tlds = args.tlds.split(",") if args.tlds else None

    # Step 1: Brainstorm
    print(f"\n{'='*60}")
    print("  STEP 1: AI Brainstorm")
    print(f"{'='*60}")
    suggestions = ai_brainstorm(args.spec, favorites, count=args.count)
    all_names = [s["name"].lower() for s in suggestions] + [f.lower() for f in favorites]
    all_names = list(dict.fromkeys(all_names))

    for i, s in enumerate(suggestions, 1):
        print(f"   {i:2d}. {s['name']:<20s} — {s['rationale']}")

    # Step 2: Riff on favorites
    print(f"\n{'='*60}")
    print("  STEP 2: AI Variations on Favorites")
    print(f"{'='*60}")
    for fav in favorites:
        print(f"\n   ── Riffing on '{fav}' ──")
        variations = ai_riff(fav, count=8)
        for v in variations:
            print(f"      {v['name']:<20s} — {v['relationship']}")
            all_names.append(v["name"].lower())

    all_names = list(dict.fromkeys(all_names))

    # Step 3: Sweep all names
    print(f"\n{'='*60}")
    print(f"  STEP 3: Domain Sweep ({len(all_names)} names)")
    print(f"{'='*60}")
    domains = generate_sweep_domains(all_names, tlds)
    print(f"\n   Checking {len(domains)} domain combinations...\n")
    results = check_domains_parallel(domains, max_workers=args.workers)

    # Report
    available = [r for r in results if r.availability == Availability.AVAILABLE]
    maybe = [r for r in results if r.availability == Availability.POSSIBLY_AVAILABLE]
    taken = [r for r in results if r.availability in (Availability.TAKEN, Availability.LIKELY_TAKEN)]

    print(f"\n{'='*60}")
    print("  RESULTS")
    print(f"{'='*60}")

    if available:
        print("\n   ✅ AVAILABLE:")
        for r in available:
            print(r.summary_line())

    if maybe:
        print("\n   🟡 POSSIBLY AVAILABLE (verify on registrar):")
        for r in maybe:
            print(r.summary_line())

    print(f"\n   ❌ TAKEN: {len(taken)} domains")
    print(f"   ⚠️  ERRORS: {len([r for r in results if r.availability == Availability.ERROR])} domains")

    # Save full report
    report_path = args.output or "domain_report.json"
    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "favorites": favorites,
        "brainstormed_names": suggestions,
        "all_names_checked": all_names,
        "results": {
            "available": [r.domain for r in available],
            "possibly_available": [r.domain for r in maybe],
            "taken": [r.domain for r in taken],
        },
        "full_results": [
            {"domain": r.domain, "status": r.availability.value, "note": r.note}
            for r in results
        ],
    }
    Path(report_path).write_text(json.dumps(report, indent=2))
    print(f"\n   📄 Full report saved to: {report_path}\n")


def _print_summary(results: list[DomainResult]):
    avail = len([r for r in results if r.availability == Availability.AVAILABLE])
    maybe = len([r for r in results if r.availability == Availability.POSSIBLY_AVAILABLE])
    taken = len([r for r in results if r.availability in (Availability.TAKEN, Availability.LIKELY_TAKEN)])
    err = len([r for r in results if r.availability == Availability.ERROR])
    print(f"   Summary: ✅ {avail} available · 🟡 {maybe} possibly · ❌ {taken} taken · ⚠️  {err} errors\n")


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="domain_scout",
        description="AI-powered domain name research tool.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""\
            Examples:
              %(prog)s check atrium.io arbor.co parcl.app
              %(prog)s sweep atrium arbor portico parcl
              %(prog)s brainstorm --spec product-spec.md --favorites "atrium,arbor" --check
              %(prog)s riff arbor --style "architectural,premium" --check
              %(prog)s pipeline --spec product-spec.md --favorites "atrium,arbor,portico"
        """),
    )
    parser.add_argument("--workers", type=int, default=8, help="Parallel workers for DNS/WHOIS (default: 8)")
    parser.add_argument("--tlds", type=str, default=None, help="Comma-separated TLDs to check (default: built-in list)")

    sub = parser.add_subparsers(dest="command", required=True)

    # check
    p_check = sub.add_parser("check", help="Check specific domain(s)")
    p_check.add_argument("domains", nargs="+", help="Full domain names to check (e.g. atrium.io)")

    # sweep
    p_sweep = sub.add_parser("sweep", help="Sweep base names across all TLDs")
    p_sweep.add_argument("names", nargs="+", help="Base names (e.g. atrium arbor)")

    # brainstorm
    p_brain = sub.add_parser("brainstorm", help="AI brainstorm names from product spec")
    p_brain.add_argument("--spec", required=True, help="Path to product spec file")
    p_brain.add_argument("--favorites", type=str, default="", help="Comma-separated names you like")
    p_brain.add_argument("--count", type=int, default=20, help="Number of names to generate")
    p_brain.add_argument("--check", action="store_true", help="Auto-check availability of generated names")

    # riff
    p_riff = sub.add_parser("riff", help="AI variations on a single name")
    p_riff.add_argument("name", help="Base name to riff on")
    p_riff.add_argument("--style", type=str, default="", help="Style hints (e.g. 'short,architectural')")
    p_riff.add_argument("--count", type=int, default=15, help="Number of variations")
    p_riff.add_argument("--check", action="store_true", help="Auto-check availability")

    # pipeline
    p_pipe = sub.add_parser("pipeline", help="Full pipeline: brainstorm + riff + sweep")
    p_pipe.add_argument("--spec", required=True, help="Path to product spec file")
    p_pipe.add_argument("--favorites", type=str, default="", help="Comma-separated names you like")
    p_pipe.add_argument("--count", type=int, default=20, help="Brainstorm count")
    p_pipe.add_argument("--output", type=str, default=None, help="Report output path (default: domain_report.json)")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    dispatch = {
        "check": cmd_check,
        "sweep": cmd_sweep,
        "brainstorm": cmd_brainstorm,
        "riff": cmd_riff,
        "pipeline": cmd_pipeline,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
