import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.iot_sensor import IoTSensor

SENSOR_READING_TEMPLATES = {
    "CAMERA": lambda: {"fps": 30, "detection_count": random.randint(0, 50), "accuracy": round(random.uniform(0.92, 0.99), 3)},
    "LOOP_DETECTOR": lambda: {"axle_count": random.randint(0, 30), "occupancy_percent": random.randint(0, 100)},
    "RADAR": lambda: {"avg_speed_kmh": round(random.uniform(10, 60), 1), "vehicle_count": random.randint(0, 40)},
    "WEATHER": lambda: {"temp_c": round(random.uniform(24, 38), 1), "humidity_percent": random.randint(40, 90), "visibility_m": random.randint(100, 2000)},
}

async def simulate_sensor_readings(db: AsyncSession):
    result = await db.execute(select(IoTSensor))
    sensors = result.scalars().all()
    for sensor in sensors:
        template = SENSOR_READING_TEMPLATES.get(sensor.sensor_type)
        if template:
            sensor.readings = template()
            sensor.last_ping = datetime.utcnow()
            sensor.status = "OFFLINE" if random.random() < 0.02 else "ONLINE"
    await db.commit()

async def get_sensor_health_summary(db: AsyncSession) -> dict:
    result = await db.execute(select(IoTSensor))
    sensors = result.scalars().all()
    total = len(sensors)
    online = sum(1 for s in sensors if s.status == "ONLINE")
    offline = sum(1 for s in sensors if s.status == "OFFLINE")
    fault = sum(1 for s in sensors if s.status == "FAULT")
    return {
        "total": total,
        "online": online,
        "offline": offline,
        "fault": fault,
        "health_percent": round((online / total * 100) if total > 0 else 0, 1),
        "sensors": [{"id": str(s.id), "sensor_id": s.sensor_id, "sensor_type": s.sensor_type, "status": s.status, "readings": s.readings, "last_ping": s.last_ping.isoformat() if s.last_ping else None} for s in sensors]
    }
