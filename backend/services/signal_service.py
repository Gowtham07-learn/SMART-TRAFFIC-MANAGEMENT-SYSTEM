import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.signal import TrafficSignal, PhaseEnum

MIN_GREEN = 15
MAX_GREEN = 120

def clamp(value: int) -> int:
    return max(MIN_GREEN, min(MAX_GREEN, value))

async def update_signal(db: AsyncSession, redis_client, junction_id: str,
                        phase: PhaseEnum, green_ns: int, green_ew: int,
                        emergency_override: bool = False):
    result = await db.execute(
        select(TrafficSignal).where(TrafficSignal.junction_id == junction_id)
    )
    signal = result.scalar_one_or_none()
    if not signal:
        return None

    if signal.emergency_override and not emergency_override:
        return signal

    signal.current_phase = phase
    signal.green_duration_ns = clamp(green_ns)
    signal.green_duration_ew = clamp(green_ew)
    signal.emergency_override = emergency_override
    signal.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(signal)

    state = {
        "junction_id": str(junction_id),
        "current_phase": phase.value,
        "green_duration_ns": signal.green_duration_ns,
        "green_duration_ew": signal.green_duration_ew,
        "vehicle_count_ns": signal.vehicle_count_ns,
        "vehicle_count_ew": signal.vehicle_count_ew,
        "emergency_override": emergency_override,
        "updated_at": datetime.utcnow().isoformat()
    }
    if redis_client:
        await redis_client.setex(f"junction:{junction_id}:state", 30, json.dumps(state))
    return signal

async def get_signal_from_cache(redis_client, junction_id: str) -> dict | None:
    if not redis_client:
        return None
    cached = await redis_client.get(f"junction:{junction_id}:state")
    if cached:
        return json.loads(cached)
    return None

async def get_all_signals_live(db: AsyncSession, redis_client) -> list:
    from models.junction import Junction
    j_result = await db.execute(select(Junction))
    junctions = j_result.scalars().all()
    s_result = await db.execute(select(TrafficSignal))
    signals = {str(s.junction_id): s for s in s_result.scalars().all()}

    output = []
    for j in junctions:
        jid = str(j.id)
        cached = await get_signal_from_cache(redis_client, jid)
        if cached:
            output.append(cached)
        else:
            sig = signals.get(jid)
            if sig:
                output.append({
                    "junction_id": jid,
                    "current_phase": sig.current_phase.value,
                    "green_duration_ns": sig.green_duration_ns,
                    "green_duration_ew": sig.green_duration_ew,
                    "vehicle_count_ns": sig.vehicle_count_ns,
                    "vehicle_count_ew": sig.vehicle_count_ew,
                    "emergency_override": sig.emergency_override,
                })
    return output
