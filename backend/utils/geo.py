import math

COIMBATORE_BOUNDS = {
    "lat_min": 10.90,
    "lat_max": 11.10,
    "lon_min": 76.85,
    "lon_max": 77.10,
}


def within_coimbatore(lat: float, lon: float) -> bool:
    return (
        COIMBATORE_BOUNDS["lat_min"] <= lat <= COIMBATORE_BOUNDS["lat_max"]
        and COIMBATORE_BOUNDS["lon_min"] <= lon <= COIMBATORE_BOUNDS["lon_max"]
    )


def coimbatore_junctions(junctions: list) -> list:
    return [j for j in junctions if within_coimbatore(j["latitude"], j["longitude"])]

def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in kilometers between two lat/lon points."""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def bearing_degrees(lat1, lon1, lat2, lon2) -> float:
    """Returns compass bearing (0-360) from point1 to point2."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360

def junctions_in_direction(all_junctions: list, origin_lat: float, origin_lon: float,
                            heading_degrees: float, count: int = 5, tolerance: float = 45) -> list:
    """
    Returns up to `count` junctions in the direction of heading_degrees
    (within ±tolerance degrees), sorted by distance from origin.
    """
    candidates = []
    for j in all_junctions:
        bearing = bearing_degrees(origin_lat, origin_lon, j["latitude"], j["longitude"])
        angle_diff = abs((bearing - heading_degrees + 180) % 360 - 180)
        if angle_diff <= tolerance:
            dist = haversine_distance(origin_lat, origin_lon, j["latitude"], j["longitude"])
            candidates.append((dist, j))
    candidates.sort(key=lambda x: x[0])
    return [j for _, j in candidates[:count]]

def find_optimal_route(junctions: list, source_lat: float, source_lon: float,
                        dest_lat: float, dest_lon: float) -> dict:
    """
    Greedy nearest-junction routing from source to destination.
    Returns ordered junction list, total_distance_km, estimated_time_minutes.
    """
    if not junctions:
        return {"junctions": [], "total_distance_km": 0.0, "estimated_time_minutes": 0.0}

    def nearest(lat, lon):
        return min(junctions, key=lambda j: haversine_distance(lat, lon, j["latitude"], j["longitude"]))

    start = nearest(source_lat, source_lon)
    end = nearest(dest_lat, dest_lon)

    route = [start]
    visited = {start["id"]}
    current = start

    for _ in range(10):
        if current["id"] == end["id"]:
            break
        bear = bearing_degrees(current["latitude"], current["longitude"],
                                end["latitude"], end["longitude"])
        candidates = [j for j in junctions if j["id"] not in visited]
        if not candidates:
            break
        next_j = min(candidates, key=lambda j: abs(
            (bearing_degrees(current["latitude"], current["longitude"],
                             j["latitude"], j["longitude"]) - bear + 180) % 360 - 180
        ))
        route.append(next_j)
        visited.add(next_j["id"])
        current = next_j

    total_dist = sum(
        haversine_distance(route[i]["latitude"], route[i]["longitude"],
                           route[i+1]["latitude"], route[i+1]["longitude"])
        for i in range(len(route) - 1)
    )
    return {
        "junctions": route,
        "total_distance_km": round(total_dist, 2),
        "estimated_time_minutes": round((total_dist / 30) * 60, 1)
    }

HOSPITALS = [
    {"id": "h1", "name": "CMCH", "latitude": 11.002, "longitude": 77.001},
    {"id": "h2", "name": "Ganga Hospital", "latitude": 11.025, "longitude": 76.945},
    {"id": "h3", "name": "PSG Hospitals", "latitude": 11.023, "longitude": 77.011},
    {"id": "h4", "name": "KMCH Hospital", "latitude": 11.036, "longitude": 77.054},
    {"id": "h5", "name": "Sri Ramakrishna Hospital", "latitude": 11.018, "longitude": 76.984},
    {"id": "h6", "name": "ESI Hospital", "latitude": 11.004, "longitude": 77.019}
]

JUNCTION_HOSPITAL_MAP = {
  "PSG Tech Junction": "PSG Hospitals",
  "Peelamedu Junction": "PSG Hospitals",
  "Gandhipuram Junction": "Ganga Hospital",
  "RS Puram Junction": "Ganga Hospital",
  "Singanallur Junction": "ESI Hospital",
  "Ukkadam Junction": "CMCH"
}

def find_nearest_hospital(lat: float, lon: float) -> dict:
    return min(HOSPITALS, key=lambda h: haversine_distance(lat, lon, h["latitude"], h["longitude"]))

def get_hospital_for_junction(junction_name: str, lat: float, lon: float) -> dict:
    hospital_name = JUNCTION_HOSPITAL_MAP.get(junction_name)
    if hospital_name:
        for h in HOSPITALS:
            if h["name"] == hospital_name:
                return h
    return find_nearest_hospital(lat, lon)
