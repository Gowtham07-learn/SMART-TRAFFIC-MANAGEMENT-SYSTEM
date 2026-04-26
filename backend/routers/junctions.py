from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models.junction import Junction
from models.signal import TrafficSignal, PhaseEnum
from models.traffic_flow import TrafficFlow
from models.user import RoleEnum
from services.auth_service import get_current_user, require_roles
from services.signal_service import update_signal, clamp
from utils.response import success, error
from app_state import get_redis

router = APIRouter(tags=["Junctions"])

def _signal_dict(sig):
    if not sig:
        return None
    return {
        "signal_id": sig.signal_id,
        "current_phase": sig.current_phase.value,
        "green_duration_ns": sig.green_duration_ns,
        "green_duration_ew": sig.green_duration_ew,
        "vehicle_count_ns": sig.vehicle_count_ns,
        "vehicle_count_ew": sig.vehicle_count_ew,
        "emergency_override": sig.emergency_override,
        "signal_status": sig.signal_status,
        "updated_at": sig.updated_at.isoformat() if sig.updated_at else None
    }

@router.get("")
async def get_all_junctions(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    j_result = await db.execute(select(Junction))
    junctions = j_result.scalars().all()
    s_result = await db.execute(select(TrafficSignal))
    signals = {str(s.junction_id): s for s in s_result.scalars().all()}

    data = []
    for j in junctions:
        sig = signals.get(str(j.id))
        total = (sig.vehicle_count_ns + sig.vehicle_count_ew) if sig else 0
        congestion = "LOW" if total < 50 else "MEDIUM" if total < 100 else "HIGH" if total < 150 else "CRITICAL"
        data.append({"id": str(j.id), "name": j.name, "j_location": j.j_location, "latitude": j.latitude, "longitude": j.longitude, "lane_count": j.lane_count, "status": j.status.value, "congestion_level": congestion, "signal": _signal_dict(sig)})
    return success(data)

@router.put("/{junction_id}/signal")
async def update_junction_signal(junction_id: str, body: dict, current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    try:
        phase = PhaseEnum(body.get("current_phase", "NS_GREEN"))
    except ValueError:
        return error(f"Invalid phase value. Must be one of: {[p.value for p in PhaseEnum]}", status_code=422)

    green_ns = clamp(int(body.get("green_duration_ns", 30)))
    green_ew = clamp(int(body.get("green_duration_ew", 30)))

    signal = await update_signal(db, redis, junction_id, phase, green_ns, green_ew)
    if not signal:
        return error("Signal not found for junction", status_code=404)

    return success({"message": "Signal updated", "junction_id": junction_id, "phase": phase.value, "green_duration_ns": green_ns, "green_duration_ew": green_ew})
