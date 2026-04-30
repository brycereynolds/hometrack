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

    now = datetime.utcnow()
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
                    comp_count = $5,
                    updated_at = $6
                WHERE id = $7""",
                analysis.get("suggested_low"),
                analysis.get("suggested_high"),
                analysis.get("confidence"),
                analysis.get("reasoning"),
                len(comps),
                now,
                analysis_id,
            )
            activity.heartbeat("updated market_analyses record")

            # 2. Insert comp_listings records
            # Schema: id, market_analysis_id, property_id, source, external_id,
            #         price, price_per_sqft, sold_date, days_on_market, status,
            #         distance_miles, adjustments, is_confirmed_comp,
            #         created_at, updated_at
            # Property details (address, beds, baths, sqft, etc.) live on the
            # linked properties row, NOT on comp_listings.
            for comp in comps:
                comp_id = str(uuid.uuid4())

                await conn.execute(
                    """INSERT INTO comp_listings
                       (id, market_analysis_id, property_id, source, external_id,
                        price, price_per_sqft,
                        sold_date, days_on_market, status,
                        distance_miles,
                        created_at, updated_at)
                       VALUES ($1, $2, $3, 'realty_api', $4,
                               $5, $6,
                               $7, $8, $9,
                               $10,
                               $11, $11)""",
                    comp_id,
                    analysis_id,
                    comp.get("property_id"),
                    comp.get("external_id", ""),
                    comp.get("price"),
                    comp.get("price_per_sqft"),
                    comp.get("sold_date"),
                    comp.get("days_on_market"),
                    comp.get("status", ""),
                    comp.get("distance_miles"),
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
