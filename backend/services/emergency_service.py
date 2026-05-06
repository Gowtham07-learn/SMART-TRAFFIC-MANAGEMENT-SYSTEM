import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.emergency import EmergencyCorridor, EmergencyVehicle
from models.junction import Junction
from models.signal import PhaseEnum
from services.signal_service import update_signal
from utils.geo import junctions_in_direction, COIMBATORE_BOUNDS, within_coimbatore, get_hospital_for_junction, find_optimal_route


async def activate_corridor(
    db: AsyncSession,
    redis_client,
    junction_id: str,
    vehicle_type: str,
    activated_by=None,
) -> dict | None:
    result = await db.execute(select(Junction).where(Junction.id == junction_id))
    origin = result.scalar_one_or_none()
    if not origin or not within_coimbatore(origin.latitude, origin.longitude):
        return None

    nearest_hospital = get_hospital_for_junction(origin.name, origin.latitude, origin.longitude)

    all_result = await db.execute(
        select(Junction).where(
            Junction.latitude.between(COIMBATORE_BOUNDS["lat_min"], COIMBATORE_BOUNDS["lat_max"]),
            Junction.longitude.between(COIMBATORE_BOUNDS["lon_min"], COIMBATORE_BOUNDS["lon_max"]),
        )
    )
    all_junctions = [
        {"id": str(j.id), "name": j.name, "latitude": j.latitude, "longitude": j.longitude}
        for j in all_result.scalars().all()
        if within_coimbatore(j.latitude, j.longitude)
    ]

    route_info = find_optimal_route(
        all_junctions,
        origin.latitude,
        origin.longitude,
        nearest_hospital["latitude"],
        nearest_hospital["longitude"]
    )
    
    corridor_junctions = route_info["junctions"]
    
    # Ensure hospital is explicitly added to the corridor route for frontend plotting
    hospital_node = {
        "id": nearest_hospital["id"],
        "name": nearest_hospital["name"],
        "latitude": nearest_hospital["latitude"],
        "longitude": nearest_hospital["longitude"]
    }
    
    if not corridor_junctions or corridor_junctions[-1].get("id") != hospital_node["id"]:
        corridor_junctions.append(hospital_node)

    # Exclude the hospital node itself when assigning signal overrides, as it has no signal
    corridor_ids = [j["id"] for j in corridor_junctions if j["id"] != hospital_node["id"]]

    for jid in corridor_ids:
        await update_signal(db, redis_client, jid, PhaseEnum.EMERGENCY_OVERRIDE, 60, 60, True)

    await update_signal(
        db, redis_client, junction_id, PhaseEnum.EMERGENCY_OVERRIDE, 60, 60, True
    )

    vehicle_id = f"VEH-{random.randint(1000, 9999)}"
    ev = EmergencyVehicle(
        vehicle_id=vehicle_id,
        vehicle_type=vehicle_type,
        priority_level=1,
        is_active=True,
    )
    db.add(ev)
    await db.flush()

    corridor = EmergencyCorridor(
        emergency_vehicle_id=ev.id,
        triggering_junction_id=uuid.UUID(str(junction_id)),
        heading_degrees=0.0, # Removed heading degrees logic, kept for schema compatibility

        corridor_junction_ids=corridor_ids,
        activated_by=activated_by,
        status="ACTIVE",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(corridor)
    await db.commit()

    return {
        "corridor_id": str(corridor.id),
        "event_id": str(corridor.id),
        "vehicle_id": vehicle_id,
        "vehicle_type": vehicle_type,
        "destination_hospital": nearest_hospital,
        "corridor_junctions": corridor_junctions,
        "total_distance_km": route_info["total_distance_km"],
        "estimated_time_minutes": route_info["estimated_time_minutes"],
        "expires_at": corridor.expires_at.isoformat() + "Z",
        "message": f"Routed to {nearest_hospital['name']} ({len(corridor_junctions)} junctions cleared)",
    }


async def expire_corridors(db: AsyncSession, redis_client):
    result = await db.execute(
        select(EmergencyCorridor).where(
            EmergencyCorridor.status == "ACTIVE",
            EmergencyCorridor.expires_at <= datetime.utcnow(),
        )
    )
    corridors = result.scalars().all()
    for corridor in corridors:
        corridor.status = "EXPIRED"
        for jid in corridor.corridor_junction_ids:
            await update_signal(db, redis_client, jid, PhaseEnum.NS_GREEN, 30, 30, False)
        await update_signal(
            db,
            redis_client,
            str(corridor.triggering_junction_id),
            PhaseEnum.NS_GREEN,
            30,
            30,
            False,
        )
    if corridors:
        await db.commit()


async def cancel_corridor(db: AsyncSession, redis_client, corridor_id: str) -> bool:
    result = await db.execute(
        select(EmergencyCorridor).where(EmergencyCorridor.id == corridor_id)
    )
    corridor = result.scalar_one_or_none()
    if not corridor or corridor.status != "ACTIVE":
        return False
    corridor.status = "CANCELLED"
    corridor.cancelled_at = datetime.utcnow()
    for jid in corridor.corridor_junction_ids:
        await update_signal(db, redis_client, jid, PhaseEnum.NS_GREEN, 30, 30, False)
    await db.commit()
    return True


async def get_active_corridors(db: AsyncSession) -> list:
    result = await db.execute(
        select(EmergencyCorridor).where(EmergencyCorridor.status == "ACTIVE")
    )
    return result.scalars().all()
