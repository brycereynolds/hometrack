import json
import statistics

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
        lines.append(
            f"{i}. {c.get('address', 'Unknown')} — {price_str} ({ppsf}) | "
            f"{c.get('beds', '?')}bd/{c.get('baths', '?')}ba, {c.get('sqft', '?')} sqft | "
            f"Built {c.get('year_built', '?')} | {c.get('distance_miles', '?')} mi | "
            f"Status: {c.get('status', '?')} | Sold: {c.get('sold_date', 'N/A')} | "
            f"DOM: {c.get('days_on_market', 'N/A')}"
        )
    return "\n".join(lines)


def _compute_stats(comps: list[dict]) -> dict:
    """Compute basic statistics from comp data."""
    prices = [c["price"] for c in comps if c.get("price")]
    ppsf_values = [c["price_per_sqft"] for c in comps if c.get("price_per_sqft")]
    dom_values = [c["days_on_market"] for c in comps if c.get("days_on_market") is not None]

    return {
        "median_price": statistics.median(prices) if prices else None,
        "avg_price": statistics.mean(prices) if prices else None,
        "price_range": (min(prices), max(prices)) if prices else None,
        "median_ppsf": statistics.median(ppsf_values) if ppsf_values else None,
        "avg_ppsf": statistics.mean(ppsf_values) if ppsf_values else None,
        "avg_dom": statistics.mean(dom_values) if dom_values else None,
        "count": len(prices),
    }


@activity.defn
async def analyze_market(params: dict) -> dict:
    """AI-powered market analysis using comparable sales data.

    params:
        property: subject property dict (address, beds, baths, sqft, property_type, year_built)
        sold_comps: list of sold comp dicts
        active_listings: list of active listing dicts
    """
    activity.heartbeat("analyzing market data")

    prop = params["property"]
    sold_comps = params.get("sold_comps", [])
    active_listings = params.get("active_listings", [])

    sold_stats = _compute_stats(sold_comps)
    active_stats = _compute_stats(active_listings)

    sold_table = _build_comp_table(sold_comps)
    active_table = _build_comp_table(active_listings)

    prompt = f"""You are a real estate market analyst. Given the subject property and comparable sales data,
provide a pricing recommendation.

Subject Property:
- Address: {prop.get('address', 'Unknown')}
- Beds: {prop.get('beds', 'N/A')}, Baths: {prop.get('baths', 'N/A')}, Sqft: {prop.get('sqft', 'N/A')}
- Property Type: {prop.get('property_type', 'N/A')}
- Year Built: {prop.get('year_built', 'N/A')}

Comparable Sales ({len(sold_comps)} sold):
{sold_table}

Active Listings ({len(active_listings)} active):
{active_table}

Summary Statistics (Sold):
- Median Price: ${sold_stats['median_price']:,.0f} | Avg: ${sold_stats['avg_price']:,.0f}
- Median $/sqft: ${sold_stats['median_ppsf']:,.0f}
- Avg Days on Market: {sold_stats['avg_dom']:.0f}
- Price Range: ${sold_stats['price_range'][0]:,.0f} – ${sold_stats['price_range'][1]:,.0f}

Summary Statistics (Active):
- Median List Price: ${active_stats['median_price']:,.0f} (if available)
- Count: {active_stats['count']}

Analyze:
1. Suggested listing price range (low and high)
2. Confidence level (0-1) based on comp quality and quantity
3. Detailed reasoning explaining the price recommendation
4. Key factors affecting value (positive and negative)
5. Market trend assessment (rising, stable, declining)
6. Recommended pricing strategy (aggressive, market, conservative)

Return ONLY valid JSON (no markdown fences):
{{
  "suggested_low": 2100000,
  "suggested_high": 2350000,
  "confidence": 0.82,
  "reasoning": "...",
  "key_factors": {{"positive": ["..."], "negative": ["..."]}},
  "market_trend": "stable",
  "strategy": "market",
  "price_per_sqft_analysis": "..."
}}""" if sold_stats["median_price"] else f"""You are a real estate market analyst. Insufficient comparable sales data is available.

Subject Property:
- Address: {prop.get('address', 'Unknown')}
- Beds: {prop.get('beds', 'N/A')}, Baths: {prop.get('baths', 'N/A')}, Sqft: {prop.get('sqft', 'N/A')}
- Property Type: {prop.get('property_type', 'N/A')}

Active Listings ({len(active_listings)} found):
{active_table}

Provide your best estimate with low confidence. Return ONLY valid JSON:
{{
  "suggested_low": null,
  "suggested_high": null,
  "confidence": 0.1,
  "reasoning": "Insufficient comp data for reliable pricing.",
  "key_factors": {{"positive": [], "negative": ["Insufficient comparable sales data"]}},
  "market_trend": "unknown",
  "strategy": "conservative",
  "price_per_sqft_analysis": "Unable to determine without sufficient data."
}}"""

    activity.heartbeat("calling Claude for analysis")

    try:
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        # Strip markdown fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        analysis = json.loads(response_text)

        # Attach computed stats
        analysis["stats"] = {
            "sold": sold_stats,
            "active": active_stats,
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
            "reasoning": "AI analysis failed to return valid JSON.",
            "key_factors": {"positive": [], "negative": ["Analysis error"]},
            "market_trend": "unknown",
            "strategy": "conservative",
            "price_per_sqft_analysis": "",
            "error": str(e),
        }
    except Exception as e:
        logger.error("Market analysis failed: %s", e)
        return {
            "suggested_low": None,
            "suggested_high": None,
            "confidence": 0.0,
            "reasoning": f"Analysis failed: {e}",
            "key_factors": {"positive": [], "negative": ["Analysis error"]},
            "market_trend": "unknown",
            "strategy": "conservative",
            "price_per_sqft_analysis": "",
            "error": str(e),
        }
