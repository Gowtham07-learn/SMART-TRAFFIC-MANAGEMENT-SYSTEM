from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.iot_sensor import IoTSensor
from models.user import RoleEnum
from services.auth_service import get_current_user, require_roles
from services.sensor_service import get_sensor_health_summary
from utils.response import success, error

router = APIRouter(tags=["IoT Sensors"])

@router.get("")
async def get_all_sensors(current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db)):
    summary = await get_sensor_health_summary(db)
    return success(summary)

@router.get("/health")
async def get_sensor_health(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    summary = await get_sensor_health_summary(db)
    return success({"total": summary["total"], "online": summary["online"], "offline": summary["offline"], "fault": summary["fault"], "health_percent": summary["health_percent"]})

@router.get("/{sensor_id}")
async def get_sensor(sensor_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IoTSensor).where(IoTSensor.sensor_id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        return error("Sensor not found", status_code=404)
    return success({"id": str(sensor.id), "sensor_id": sensor.sensor_id, "sensor_type": sensor.sensor_type, "status": sensor.status, "readings": sensor.readings, "last_ping": sensor.last_ping.isoformat() if sensor.last_ping else None, "created_at": sensor.created_at.isoformat()})
