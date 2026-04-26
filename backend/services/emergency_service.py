import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.emergency import EmergencyCorridor, EmergencyVehicle
from models.junction import Junction
from models.signal import PhaseEnum
from services.signal_service import update_signal
from utils.geo import junctions_in_direction


async def activate_corridor(
    db: AsyncSession,
    redis_client,
    junction_id: str,
    heading_degrees: float,
    vehicle_type: str,
    activated_by=None,
) -> dict | None:
    result = await db.execute(select(Junction).where(Junction.id == junction_id))
    origin = result.scalar_one_or_none()
    if not origin:
        return None

    all_result = await db.execute(select(Junction))
    all_junctions = [
        {"id": str(j.id), "name": j.name, "latitude": j.latitude, "longitude": j.longitude}
        for j in all_result.scalars().all()
        if str(j.id) != str(junction_id)
    ]

    corridor_junctions = junctions_in_direction(
        all_junctions, origin.latitude, origin.longitude, heading_degrees, count=5
    )
    corridor_ids = [j["id"] for j in corridor_junctions]

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
        heading_degrees=heading_degrees,
        corridor_junction_ids=corridor_ids,
        activated_by=activated_by,
        status="ACTIVE",
        expires_at=datetime.utcnow() + timedelta(seconds=120),
    )
    db.add(corridor)
    await db.commit()

    return {
        "corridor_id": str(corridor.id),
        "event_id": str(corridor.id),
        "vehicle_id": vehicle_id,
        "vehicle_type": vehicle_type,
        "corridor_junctions": corridor_junctions,
        "expires_at": corridor.expires_at.isoformat() + "Z",
        "message": f"Green corridor activated for {len(corridor_junctions)} junctions",
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
