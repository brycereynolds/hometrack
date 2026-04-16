from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from src.activities.analyze_market import analyze_market
    from src.activities.geocode_address import geocode_address
    from src.activities.save_analysis_results import save_analysis_results
    from src.activities.search_comps import search_comps


@workflow.defn
class MarketAnalysis:
    """Workflow for running a market analysis on a listing.

    Input dict (camelCase keys from TypeScript):
        listingId, analysisId, teamId, address, city, state, zip,
        lat, lng, beds, baths, sqft, propertyType, yearBuilt,
        searchParams (optional): {radius, limit, ...}
    """

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        lat = input_data.get("lat")
        lng = input_data.get("lng")
        search_params = input_data.get("searchParams", {})

        # 1. Geocode if no lat/lng provided
        if not lat or not lng:
            coords = await workflow.execute_activity(
                geocode_address,
                input_data["address"],
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=RetryPolicy(maximum_attempts=3),
            )
            lat = coords["lat"]
            lng = coords["lng"]

        # 2. Search sold comps (uses listingStatus=Sold, not Recently_Sold)
        sold_comps: list[dict] = await workflow.execute_activity(
            search_comps,
            {
                "lat": lat,
                "lng": lng,
                "address": input_data.get("address", ""),
                "radius_miles": search_params.get("radius", 1.0),
                "status": "sold",
                "property_type": input_data.get("propertyType", "single_family"),
                "beds": input_data.get("beds"),
                "baths": input_data.get("baths"),
                "sqft": input_data.get("sqft"),
                "limit": search_params.get("limit", 50),
            },
            start_to_close_timeout=timedelta(seconds=60),
            heartbeat_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        # 3. Search active listings
        active_listings: list[dict] = await workflow.execute_activity(
            search_comps,
            {
                "lat": lat,
                "lng": lng,
                "address": input_data.get("address", ""),
                "radius_miles": search_params.get("radius", 1.0),
                "status": "for_sale",
                "property_type": input_data.get("propertyType", "single_family"),
                "beds": input_data.get("beds"),
                "baths": input_data.get("baths"),
                "sqft": input_data.get("sqft"),
                "limit": search_params.get("limit", 50),
            },
            start_to_close_timeout=timedelta(seconds=60),
            heartbeat_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        # 4. AI analysis
        analysis: dict = await workflow.execute_activity(
            analyze_market,
            {
                "property": {
                    "address": input_data.get("address"),
                    "beds": input_data.get("beds"),
                    "baths": input_data.get("baths"),
                    "sqft": input_data.get("sqft"),
                    "property_type": input_data.get("propertyType"),
                    "year_built": input_data.get("yearBuilt"),
                },
                "sold_comps": sold_comps,
                "active_listings": active_listings,
            },
            start_to_close_timeout=timedelta(minutes=3),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )

        # 5. Save results
        await workflow.execute_activity(
            save_analysis_results,
            {
                "listing_id": input_data["listingId"],
                "analysis_id": input_data["analysisId"],
                "comps": sold_comps + active_listings,
                "analysis": analysis,
            },
            start_to_close_timeout=timedelta(minutes=2),
            heartbeat_timeout=timedelta(minutes=1),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        return analysis
