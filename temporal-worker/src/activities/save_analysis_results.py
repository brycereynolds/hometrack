import json
import uuid
from datetime import datetime, timezone

from temporalio import activity

from src.config import logger
from src.db import get_pool


@activity.defn
async def save_analysis_results(params: dict) -> dict:
    """Save market analysis results to Postgres.

    params:
        listing_id: UUID of the listing
        analysis_id: UUID of the market_analyses record (created by the app)
        comps: list of comp dicts (sold + active)
        analysis: AI analysis result dict
    """
    activity.heartbeat("saving analysis results")

    listing_id = params["listing_id"]
    analysis_id = params["analysis_id"]
    comps = params.get("comps", [])
    analysis = params.get("analysis", {})

    now = datetime.now(timezone.utc)
    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():

            # 1. Update market_analyses record
            stats = analysis.get("stats", {})
            sold_stats = stats.get("sold", {})

            await conn.execute(
                """UPDATE market_analyses SET
                    status = 'completed',
                    suggested_price_low = $1,
                    suggested_price_high = $2,
                    confidence = $3,
                    ai_narrative = $4,
                    market_trend = $5,
                    strategy = $6,
                    key_factors = $7::jsonb,
                    price_per_sqft_analysis = $8,
                    median_price = $9,
                    median_ppsf = $10,
                    avg_dom = $11,
                    comp_count = $12,
                    completed_at = $13,
                    updated_at = $13
                WHERE id = $14""",
                analysis.get("suggested_low"),
                analysis.get("suggested_high"),
                analysis.get("confidence"),
                analysis.get("reasoning"),
                analysis.get("market_trend"),
                analysis.get("strategy"),
                json.dumps(analysis.get("key_factors", {})),
                analysis.get("price_per_sqft_analysis"),
                sold_stats.get("median_price"),
                sold_stats.get("median_ppsf"),
                sold_stats.get("avg_dom"),
                len(comps),
                now,
                analysis_id,
            )
            activity.heartbeat("updated market_analyses record")

            # 2. Insert comp_listings records
            for comp in comps:
                comp_id = str(uuid.uuid4())
                photos_json = json.dumps([comp["photo_url"]] if comp.get("photo_url") else [])

                await conn.execute(
                    """INSERT INTO comp_listings
                       (id, market_analysis_id, source, external_id,
                        address, city, state, zip,
                        price, price_per_sqft,
                        beds, baths, sqft, lot_sqft,
                        year_built, sold_date, days_on_market, status,
                        distance_miles, lat, lng,
                        photos,
                        created_at, updated_at)
                       VALUES ($1, $2, 'realty_api', $3,
                               $4, $5, $6, $7,
                               $8, $9,
                               $10, $11, $12, $13,
                               $14, $15, $16, $17,
                               $18, $19, $20,
                               $21::jsonb,
                               $22, $22)""",
                    comp_id,
                    analysis_id,
                    comp.get("external_id", ""),
                    comp.get("address", ""),
                    comp.get("city", ""),
                    comp.get("state", ""),
                    comp.get("zip", ""),
                    comp.get("price"),
                    comp.get("price_per_sqft"),
                    comp.get("beds"),
                    comp.get("baths"),
                    comp.get("sqft"),
                    comp.get("lot_sqft"),
                    comp.get("year_built"),
                    comp.get("sold_date"),
                    comp.get("days_on_market"),
                    comp.get("status", ""),
                    comp.get("distance_miles"),
                    comp.get("lat"),
                    comp.get("lng"),
                    photos_json,
                    now,
                )

            if comps:
                activity.heartbeat(f"inserted {len(comps)} comp listings")

    logger.info(
        "Saved analysis %s: %d comps, price range $%s–$%s (confidence: %s)",
        analysis_id,
        len(comps),
        analysis.get("suggested_low"),
        analysis.get("suggested_high"),
        analysis.get("confidence"),
    )

    return {
        "analysis_id": analysis_id,
        "comp_count": len(comps),
        "status": "completed",
    }
