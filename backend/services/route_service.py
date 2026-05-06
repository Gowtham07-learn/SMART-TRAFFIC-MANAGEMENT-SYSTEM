from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from models.junction import Junction
from models.route import RouteFinder
from utils.geo import find_optimal_route, COIMBATORE_BOUNDS, within_coimbatore


async def _build_route_geometry(points: list[dict]) -> list[list[float]]:
    coords = [f"{point['longitude']},{point['latitude']}" for point in points if point.get('latitude') is not None and point.get('longitude') is not None]
    if len(coords) < 2:
        return [[point['latitude'], point['longitude']] for point in points if point.get('latitude') is not None and point.get('longitude') is not None]

    url = f"https://router.project-osrm.org/route/v1/driving/{';'.join(coords)}"
    params = {
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'false',
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
            route = payload.get('routes', [{}])[0]
            geometry = route.get('geometry', {})
            coordinates = geometry.get('coordinates') or []
            if coordinates:
                return [[lat, lon] for lon, lat in coordinates]
    except Exception:
        pass

    # Fallback: connect the route nodes directly if the routing service is unavailable.
    return [[point['latitude'], point['longitude']] for point in points if point.get('latitude') is not None and point.get('longitude') is not None]


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
    if not within_coimbatore(s_lat, s_lon) or not within_coimbatore(d_lat, d_lon):
        raise ValueError("Coordinates must be within the Coimbatore bounding box")

    result = await db.execute(
        select(Junction).where(
            Junction.latitude.between(COIMBATORE_BOUNDS["lat_min"], COIMBATORE_BOUNDS["lat_max"]),
            Junction.longitude.between(COIMBATORE_BOUNDS["lon_min"], COIMBATORE_BOUNDS["lon_max"]),
        )
    )
    junctions = [
        {"id": str(j.id), "name": j.name, "latitude": j.latitude, "longitude": j.longitude}
        for j in result.scalars().all()
    ]

    route_data = find_optimal_route(junctions, s_lat, s_lon, d_lat, d_lon)
    route_nodes = [
        {"latitude": s_lat, "longitude": s_lon},
        *route_data["junctions"],
        {"latitude": d_lat, "longitude": d_lon},
    ]
    route_geometry = await _build_route_geometry(route_nodes)

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
        "waypoints": route_data["junctions"],
        "path_coordinates": route_geometry,
        "junction_count": len(route_data["junctions"]),
    }
