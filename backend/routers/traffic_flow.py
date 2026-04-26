import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models.junction import Junction
from models.traffic_flow import TrafficFlow
from services.auth_service import get_current_user
from utils.response import success
from app_state import get_redis

router = APIRouter(tags=['Traffic'])

@router.get('/live')
async def get_live_traffic(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    result = await db.execute(select(Junction))
    junctions = result.scalars().all()
    live_data=[]
    total_vehicles=0
    for j in junctions:
        cached=None
        if redis:
            raw=await redis.get(f'junction:{j.id}:state')
            if raw: cached=json.loads(raw)
        ns = cached.get('vehicle_count_ns', 0) if cached else 0
        ew = cached.get('vehicle_count_ew', 0) if cached else 0
        total = ns + ew
        total_vehicles += total
        congestion = 'LOW' if total < 50 else 'MEDIUM' if total < 100 else 'HIGH' if total < 150 else 'CRITICAL'
        live_data.append({'junction_id': str(j.id), 'junction_name': j.name, 'latitude': j.latitude, 'longitude': j.longitude, 'vehicle_count_ns': ns, 'vehicle_count_ew': ew, 'total_vehicles': total, 'congestion_level': congestion, 'current_phase': cached.get('current_phase') if cached else 'NS_GREEN'})
    return success({'junctions': live_data, 'total_vehicles_city': total_vehicles, 'junction_count': len(live_data), 'timestamp': __import__('datetime').datetime.utcnow().isoformat() + 'Z'})

@router.get('/history/{junction_id}')
async def get_flow_history(junction_id: str, limit: int = Query(default=50, le=500), current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficFlow).where(TrafficFlow.junction_id == junction_id).order_by(desc(TrafficFlow.recorded_at)).limit(limit))
    flows = result.scalars().all()
    return success([{'flow_id': f.flow_id, 'vehicle_count': f.vehicle_count, 'congestion_level': f.congestion_level, 'avg_speed_kmh': f.avg_speed_kmh, 'recorded_at': f.recorded_at.isoformat()} for f in flows])
