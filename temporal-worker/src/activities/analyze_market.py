import json
import statistics
from datetime import datetime, timezone

import anthropic
from temporalio import activity

from src.config import ANTHROPIC_API_KEY, logger


def _build_comp_table(comps: list[dict]) -> str:
    """Format comps into a readable table for the AI prompt."""
    if not comps:
        return "No comparable properties found."

    lines = []
    for i, c in enumerate(comps, 1):
        price_str = f"${c.get('price', 0):,.0f}" if c.get("price") else "N/A"
        ppsf = f"${c.get('price_per_sqft', 0):,.0f}/sqft" if c.get("price_per_sqft") else "N/A"
        lot_size = f" | Lot: {c.get('lot_sqft', '?')} sqft" if c.get("lot_sqft") else ""
        lines.append(
            f"{i}. {c.get('address', 'Unknown')} — {price_str} ({ppsf}) | "
            f"{c.get('beds', '?')}bd/{c.get('baths', '?')}ba, {c.get('sqft', '?')} sqft | "
            f"Built {c.get('year_built', '?')}{lot_size} | {c.get('distance_miles', '?')} mi | "
            f"Status: {c.get('status', '?')} | DOM: {c.get('days_on_market', 'N/A')}"
        )
    return "\n".join(lines)


def _compute_stats(comps: list[dict]) -> dict:
    """Compute detailed statistics from comp data."""
    prices = [c["price"] for c in comps if c.get("price")]
    ppsf_values = [c["price_per_sqft"] for c in comps if c.get("price_per_sqft")]
    dom_values = [c["days_on_market"] for c in comps if c.get("days_on_market") is not None]
    distances = [c["distance_miles"] for c in comps if c.get("distance_miles") is not None]
    beds = [c["beds"] for c in comps if c.get("beds") is not None]
    baths = [c["baths"] for c in comps if c.get("baths") is not None]
    sqfts = [c["sqft"] for c in comps if c.get("sqft") is not None]

    result = {
        "count": len(prices),
        "median_price": None,
        "mean_price": None,
        "stdev_price": None,
        "min_price": None,
        "max_price": None,
        "q1_price": None,
        "q3_price": None,
        "cv_price": None,
        "median_ppsf": None,
        "mean_ppsf": None,
        "avg_dom": None,
        "median_dom": None,
        "avg_distance": None,
        "avg_beds": None,
        "avg_baths": None,
        "avg_sqft": None,
    }

    if prices:
        sorted_prices = sorted(prices)
        n = len(sorted_prices)
        result["median_price"] = statistics.median(prices)
        result["mean_price"] = round(statistics.mean(prices))
        result["min_price"] = min(prices)
        result["max_price"] = max(prices)

        if n > 1:
            result["stdev_price"] = round(statistics.stdev(prices))
            result["cv_price"] = round(statistics.stdev(prices) / statistics.mean(prices), 3)

        if n >= 4:
            mid = n // 2
            result["q1_price"] = statistics.median(sorted_prices[:mid])
            result["q3_price"] = statistics.median(sorted_prices[mid:])
        elif n >= 2:
            result["q1_price"] = sorted_prices[n // 4]
            result["q3_price"] = sorted_prices[(3 * n) // 4]

    if ppsf_values:
        result["median_ppsf"] = round(statistics.median(ppsf_values))
        result["mean_ppsf"] = round(statistics.mean(ppsf_values))

    if dom_values:
        result["avg_dom"] = round(statistics.mean(dom_values), 1)
        result["median_dom"] = statistics.median(dom_values)

    if distances:
        result["avg_distance"] = round(statistics.mean(distances), 2)

    if beds:
        result["avg_beds"] = round(statistics.mean(beds), 1)
    if baths:
        result["avg_baths"] = round(statistics.mean(baths), 1)
    if sqfts:
        result["avg_sqft"] = round(statistics.mean(sqfts))

    return result


def _count_recent_comps(comps: list[dict], days: int = 90) -> int:
    """Count comps sold within the last N days."""
    count = 0
    now = datetime.now(timezone.utc)
    for c in comps:
        sale_date = c.get("sale_date") or c.get("sold_date") or c.get("close_date")
        if sale_date:
            try:
                if isinstance(sale_date, str):
                    # Handle common date formats
                    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
                        try:
                            dt = datetime.strptime(sale_date, fmt).replace(tzinfo=timezone.utc)
                            break
                        except ValueError:
                            continue
                    else:
                        continue
                elif isinstance(sale_date, datetime):
                    dt = sale_date if sale_date.tzinfo else sale_date.replace(tzinfo=timezone.utc)
                else:
                    continue
                if (now - dt).days <= days:
                    count += 1
            except (ValueError, TypeError):
                continue
    return count


def _format_stats_section(label: str, stats: dict) -> str:
    """Format pre-computed stats into a readable section for the prompt."""
    if not stats["median_price"]:
        return ""

    lines = [f"\nPre-Computed Statistics ({label}):"]
    lines.append(f"- Count: {stats['count']}")
    lines.append(f"- Median Price: ${stats['median_price']:,.0f}")
    lines.append(f"- Mean Price: ${stats['mean_price']:,.0f}")
    if stats["stdev_price"]:
        lines.append(f"- Std Deviation: ${stats['stdev_price']:,.0f}")
    if stats["cv_price"] is not None:
        lines.append(f"- Coefficient of Variation: {stats['cv_price']:.3f}")
    lines.append(f"- Price Range: ${stats['min_price']:,.0f} – ${stats['max_price']:,.0f}")
    if stats["q1_price"] and stats["q3_price"]:
        lines.append(f"- Q1 (25th pct): ${stats['q1_price']:,.0f}")
        lines.append(f"- Q3 (75th pct): ${stats['q3_price']:,.0f}")
        iqr = stats["q3_price"] - stats["q1_price"]
        lines.append(f"- IQR: ${iqr:,.0f}")
    if stats["median_ppsf"]:
        lines.append(f"- Median $/sqft: ${stats['median_ppsf']:,}")
        lines.append(f"- Mean $/sqft: ${stats['mean_ppsf']:,}")
    if stats["avg_dom"] is not None:
        lines.append(f"- Avg Days on Market: {stats['avg_dom']:.0f}")
        lines.append(f"- Median Days on Market: {stats['median_dom']:.0f}")
    if stats["avg_distance"] is not None:
        lines.append(f"- Avg Distance from Subject: {stats['avg_distance']} mi")

    return "\n".join(lines)


@activity.defn
async def analyze_market(params: dict) -> dict:
    """AI-powered market analysis using sold comps and active listings.

    params:
        property: subject property dict (address, beds, baths, sqft, property_type, year_built)
        sold_comps: list of sold comp dicts
        active_listings: list of active listing dicts
    """
    activity.heartbeat("analyzing market data")

    prop = params["property"]
    sold_comps = params.get("sold_comps", [])
    active_listings = params.get("active_listings", [])
    user_prompt = params.get("prompt", "")

    sold_stats = _compute_stats(sold_comps)
    active_stats = _compute_stats(active_listings)

    sold_table = _build_comp_table(sold_comps)
    active_table = _build_comp_table(active_listings)

    sold_stats_section = _format_stats_section("Sold Comps", sold_stats)
    active_stats_section = _format_stats_section("Active Listings", active_stats)

    recent_90d = _count_recent_comps(sold_comps, 90)
    recent_pct = round(recent_90d / len(sold_comps) * 100) if sold_comps else 0

    has_data = sold_stats["median_price"] or active_stats["median_price"]

    user_guidance_section = ""
    if user_prompt:
        user_guidance_section = f"""

Additional Context from User:
{user_prompt}
Take this guidance into account in your analysis."""

    if has_data:
        prompt = f"""You are a rigorous real estate market analyst. Given the subject property and comparable \
market data, provide a statistically grounded pricing recommendation.

Subject Property:
- Address: {prop.get('address', 'Unknown')}
- Beds: {prop.get('beds', 'N/A')}, Baths: {prop.get('baths', 'N/A')}, Sqft: {prop.get('sqft', 'N/A')}
- Property Type: {prop.get('property_type', 'N/A')}
- Year Built: {prop.get('year_built', 'N/A')}
- Lot Size: {prop.get('lot_sqft', 'N/A')} sqft

═══════════════════════════════════════════
COMPARABLE SALES ({len(sold_comps)} sold)
═══════════════════════════════════════════
{sold_table}

═══════════════════════════════════════════
ACTIVE LISTINGS ({len(active_listings)} currently for sale)
═══════════════════════════════════════════
{active_table}

═══════════════════════════════════════════
PRE-COMPUTED STATISTICS
═══════════════════════════════════════════
{sold_stats_section}
{active_stats_section}

Comps sold within last 90 days: {recent_90d} of {len(sold_comps)} ({recent_pct}%)
{user_guidance_section}

═══════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════

1. PRICE DISTRIBUTION ANALYSIS
   - Are the comp prices tightly clustered or widely spread? Reference the coefficient of variation.
   - Identify any outliers (comps significantly above/below the IQR). For each outlier, explain WHY \
it is an outlier (larger lot, recent renovation, inferior location, etc.).
   - What specific features distinguish the top 25% (above Q3) from the bottom 25% (below Q1)?

2. SUBJECT PROPERTY COMPARISON
   - Compare the subject property's characteristics to the comp averages (beds, baths, sqft, age).
   - What makes this property worth MORE than the median comp? Be specific.
   - What makes this property worth LESS than the median comp? Be specific.
   - Quantify adjustments where possible (e.g., "$X per additional sqft based on $/sqft data").

3. CONFIDENCE SCORING — CALCULATE THIS, DO NOT DEFAULT TO 0.75
   Base confidence at 0.50, then adjust using these factors:

   Comp quantity:
   - 0-3 comps: -0.20
   - 4-5 comps: -0.10
   - 6-10 comps: +0.00
   - 11-20 comps: +0.10
   - 20+ comps: +0.15

   Comp similarity (how well comps match subject in beds/baths/sqft):
   - Very similar (avg <10% deviation): +0.10
   - Somewhat similar (10-25% deviation): +0.00
   - Dissimilar (>25% deviation): -0.10

   Recency (% of sold comps within 90 days):
   - >75%: +0.10
   - 50-75%: +0.05
   - 25-50%: +0.00
   - <25%: -0.10

   Price clustering (coefficient of variation):
   - CV < 0.10: +0.10 (very tight)
   - CV 0.10-0.20: +0.05 (moderate)
   - CV 0.20-0.35: +0.00 (typical)
   - CV > 0.35: -0.10 (wide spread)

   Distance (avg distance of comps):
   - <0.5 mi: +0.05
   - 0.5-1.0 mi: +0.00
   - 1.0-2.0 mi: -0.05
   - >2.0 mi: -0.10

   Show your math: list each factor, its value, and the adjustment. Clamp final result to [0.05, 0.95].

4. PRICING STRATEGY
   Provide three pricing tiers with rationale:
   - Conservative: priced to sell quickly (15-30 days DOM target)
   - Market: competitively priced (30-60 days DOM target)
   - Aggressive: maximize sale price (60-90+ days DOM target)
   Recommend one strategy and explain why.

5. MARKET TREND
   Based on the data, assess whether the market is "rising", "stable", or "declining".
   Consider: active listing prices vs sold prices, DOM trends, inventory levels.

Return ONLY valid JSON (no markdown fences, no commentary outside the JSON):
{{
  "suggested_low": <number>,
  "suggested_high": <number>,
  "confidence": <float 0.05-0.95>,
  "confidence_factors": {{
    "comp_count": "<adjustment> (<reason>)",
    "similarity": "<adjustment> (<reason>)",
    "recency": "<adjustment> (<reason>)",
    "clustering": "<adjustment> (<reason>)",
    "distance": "<adjustment> (<reason>)"
  }},
  "reasoning": "<Write 3-4 distinct paragraphs separated by \\n\\n. Paragraph 1: Price distribution analysis — describe the spread, clustering, outliers and what distinguishes high vs low comps. Paragraph 2: Subject property analysis — how does this property compare? What are its strengths and weaknesses relative to the comps? Paragraph 3: Market context — current market velocity, active listing competition, DOM trends. Paragraph 4 (conclusion): State the suggested range explicitly and explain WHY the low end is where it is and WHY the high end is justified. Format: 'We suggest a listing range of $X to $Y. The lower end of $X reflects [specific reasons]. The upper end of $Y is supported by [specific reasons].' Use \\n\\n between paragraphs. Do NOT write a single run-on paragraph.>",
  "stats": {{
    "median_price": <number>,
    "mean_price": <number>,
    "median_ppsf": <number>,
    "mean_ppsf": <number>,
    "price_range": "<formatted string e.g. '$1.85M - $3.1M'>",
    "iqr": "<formatted string e.g. '$2.05M - $2.55M'>",
    "stdev": <number>,
    "cv": <float>,
    "avg_dom": <number>
  }},
  "strategy": {{
    "conservative": {{ "price": <number>, "expected_dom": "15-30 days" }},
    "market": {{ "price": <number>, "expected_dom": "30-60 days" }},
    "aggressive": {{ "price": <number>, "expected_dom": "60-90+ days" }},
    "recommended": "<conservative|market|aggressive>",
    "rationale": "<why this strategy>"
  }},
  "key_factors": {{
    "positive": ["<specific factor 1>", "<specific factor 2>"],
    "negative": ["<specific factor 1>", "<specific factor 2>"]
  }},
  "market_trend": "<rising|stable|declining>",
  "outliers": ["<address: reason it's an outlier>"]
}}"""
    else:
        prompt = f"""You are a real estate market analyst. Insufficient market data is available.

Subject Property:
- Address: {prop.get('address', 'Unknown')}
- Beds: {prop.get('beds', 'N/A')}, Baths: {prop.get('baths', 'N/A')}, Sqft: {prop.get('sqft', 'N/A')}
- Property Type: {prop.get('property_type', 'N/A')}

No comparable sales or active listings were found in the search area.

Provide your best estimate with low confidence. Return ONLY valid JSON:
{{
  "suggested_low": null,
  "suggested_high": null,
  "confidence": 0.05,
  "confidence_factors": {{
    "comp_count": "-0.20 (0 comps)",
    "similarity": "+0.00 (no data)",
    "recency": "-0.10 (no data)",
    "clustering": "+0.00 (no data)",
    "distance": "+0.00 (no data)"
  }},
  "reasoning": "Insufficient market data — no comps or listings found in the area.",
  "stats": {{
    "median_price": null,
    "mean_price": null,
    "median_ppsf": null,
    "mean_ppsf": null,
    "price_range": "N/A",
    "iqr": "N/A",
    "stdev": null,
    "cv": null,
    "avg_dom": null
  }},
  "strategy": {{
    "conservative": {{ "price": null, "expected_dom": "N/A" }},
    "market": {{ "price": null, "expected_dom": "N/A" }},
    "aggressive": {{ "price": null, "expected_dom": "N/A" }},
    "recommended": "conservative",
    "rationale": "Insufficient data to recommend a strategy."
  }},
  "key_factors": {{ "positive": [], "negative": ["No comparable data found in search area"] }},
  "market_trend": "unknown",
  "outliers": []
}}"""

    activity.heartbeat("calling Claude for analysis")

    try:
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        # Strip markdown fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        analysis = json.loads(response_text)

        # Attach pre-computed stats for downstream consumers
        analysis["computed_stats"] = {
            "sold": sold_stats,
            "active": active_stats,
            "recent_90d_count": recent_90d,
            "recent_90d_pct": recent_pct,
        }

        logger.info(
            "Market analysis complete: $%s–$%s (confidence: %s)",
            analysis.get("suggested_low"),
            analysis.get("suggested_high"),
            analysis.get("confidence"),
        )
        return analysis

    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI response as JSON: %s", e)
        return {
            "suggested_low": None,
            "suggested_high": None,
            "confidence": 0.0,
            "confidence_factors": {},
            "reasoning": "AI analysis failed to return valid JSON.",
            "stats": {},
            "strategy": {
                "conservative": {"price": None, "expected_dom": "N/A"},
                "market": {"price": None, "expected_dom": "N/A"},
                "aggressive": {"price": None, "expected_dom": "N/A"},
                "recommended": "conservative",
                "rationale": "Analysis failed.",
            },
            "key_factors": {"positive": [], "negative": ["Analysis error"]},
            "market_trend": "unknown",
            "outliers": [],
            "error": str(e),
        }
    except Exception as e:
        logger.error("Market analysis failed: %s", e)
        return {
            "suggested_low": None,
            "suggested_high": None,
            "confidence": 0.0,
            "confidence_factors": {},
            "reasoning": f"Analysis failed: {e}",
            "stats": {},
            "strategy": {
                "conservative": {"price": None, "expected_dom": "N/A"},
                "market": {"price": None, "expected_dom": "N/A"},
                "aggressive": {"price": None, "expected_dom": "N/A"},
                "recommended": "conservative",
                "rationale": "Analysis failed.",
            },
            "key_factors": {"positive": [], "negative": ["Analysis error"]},
            "market_trend": "unknown",
            "outliers": [],
            "error": str(e),
        }
