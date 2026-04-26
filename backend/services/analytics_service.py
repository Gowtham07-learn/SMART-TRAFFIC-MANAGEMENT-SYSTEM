import json
import random
import io
import csv
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.junction import Junction
from models.analytics import CO2Record

IDLE_EMISSION_FACTOR = 0.000196
IDLE_SECONDS = 30


async def calculate_co2(db: AsyncSession, redis_client) -> dict:
    result = await db.execute(select(Junction))
    junctions = result.scalars().all()

    items = []
    city_total = 0.0

    for j in junctions:
        cached = None
        if redis_client:
            raw = await redis_client.get(f"junction:{j.id}:state")
            if raw:
                cached = json.loads(raw)

        if cached:
            count = cached.get("vehicle_count_ns", 0) + cached.get("vehicle_count_ew", 0)
        else:
            count = random.randint(20, 80)

        co2 = round(count * IDLE_SECONDS * IDLE_EMISSION_FACTOR, 4)
        city_total += co2
        items.append({
            "junction_id": str(j.id),
            "junction_name": j.name,
            "vehicle_count": count,
            "co2_kg": co2
        })

    annual_projected = round(city_total * 288 * 365, 2)

    return {
        "city_total_co2_kg": round(city_total, 4),
        "city_total_co2_tons": round(city_total / 1000, 6),
        "annual_projected_tons": round(annual_projected / 1000, 2),
        "junctions": items,
        "calculated_at": datetime.utcnow().isoformat() + "Z"
    }


async def get_summary(db: AsyncSession, redis_client) -> dict:
    result = await db.execute(select(Junction))
    junctions = result.scalars().all()

    total_vehicles = 0
    busiest = {"name": "None", "count": 0, "id": ""}

    for j in junctions:
        cached = None
        if redis_client:
            raw = await redis_client.get(f"junction:{j.id}:state")
            if raw:
                cached = json.loads(raw)

        count = (cached.get("vehicle_count_ns", 0) + cached.get("vehicle_count_ew", 0)
                 if cached else random.randint(20, 80))
        total_vehicles += count

        if count > busiest["count"]:
            busiest = {"name": j.name, "count": count, "id": str(j.id)}

    return {
        "total_junctions": len(junctions),
        "total_vehicles_now": total_vehicles,
        "avg_vehicles_per_junction": round(total_vehicles / len(junctions), 1) if junctions else 0,
        "busiest_junction": busiest,
        "system_uptime_percent": 99.5,
        "calculated_at": datetime.utcnow().isoformat() + "Z"
    }


async def export_csv_data(db: AsyncSession, redis_client) -> str:
    result = await db.execute(select(Junction))
    junctions = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["junction_id", "junction_name", "timestamp", "vehicle_count", "co2_kg"])

    for j in junctions:
        cached = None
        if redis_client:
            raw = await redis_client.get(f"junction:{j.id}:state")
            if raw:
                cached = json.loads(raw)

        count = (cached.get("vehicle_count_ns", 0) + cached.get("vehicle_count_ew", 0)
                 if cached else random.randint(20, 80))
        co2 = round(count * IDLE_SECONDS * IDLE_EMISSION_FACTOR, 4)
        writer.writerow([str(j.id), j.name, datetime.utcnow().isoformat(), count, co2])

    return output.getvalue()
