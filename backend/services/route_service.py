from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.junction import Junction
from models.route import RouteFinder
from utils.geo import find_optimal_route


async def find_route(
    db: AsyncSession,
    s_location: str,
    s_lat: float,
    s_lon: float,
    d_location: str,
    d_lat: float,
    d_lon: float,
    requested_by=None,
) -> dict:
    result = await db.execute(select(Junction))
    junctions = [
        {"id": str(j.id), "name": j.name, "latitude": j.latitude, "longitude": j.longitude}
        for j in result.scalars().all()
    ]

    route_data = find_optimal_route(junctions, s_lat, s_lon, d_lat, d_lon)

    route_record = RouteFinder(
        route_id=f"RTE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        requested_by=requested_by,
        s_location=s_location,
        s_lat=s_lat,
        s_lon=s_lon,
        d_location=d_location,
        d_lat=d_lat,
        d_lon=d_lon,
        distance=route_data["total_distance_km"],
        time=route_data["estimated_time_minutes"],
        optimal_path=[j["id"] for j in route_data["junctions"]],
    )
    db.add(route_record)
    await db.commit()

    return {
        "route_id": route_record.route_id,
        "source": {"address": s_location, "lat": s_lat, "lon": s_lon},
        "destination": {"address": d_location, "lat": d_lat, "lon": d_lon},
        "total_distance_km": route_data["total_distance_km"],
        "estimated_time_minutes": route_data["estimated_time_minutes"],
        "junctions": route_data["junctions"],
        "junction_count": len(route_data["junctions"]),
    }
