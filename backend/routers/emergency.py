from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.junction import Junction
from models.user import RoleEnum
from models.emergency import EmergencyCorridor
from services.auth_service import get_current_user, require_roles
from services.emergency_service import activate_corridor, cancel_corridor, get_active_corridors
from utils.response import success, error
from app_state import get_redis
from utils.geo import within_coimbatore, get_hospital_for_junction

router = APIRouter(tags=['Emergency'])

@router.post('/activate')
async def activate_emergency(body: dict, current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER, RoleEnum.EMERGENCY_DRIVER)), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    junction_id = body.get('junction_id')
    if not junction_id:
        return error('junction_id is required', status_code=422)

    active_corridor = await db.execute(select(EmergencyCorridor).where(
        EmergencyCorridor.activated_by == current_user.id,
        EmergencyCorridor.status == "ACTIVE"
    ))
    if active_corridor.scalars().first():
        return error('You already have an active corridor. Please cancel it first.', status_code=400)

    j_result = await db.execute(select(Junction).where(Junction.id == junction_id))
    junction = j_result.scalar_one_or_none()
    if not junction:
        return error('Junction not found', status_code=404)
    if not within_coimbatore(junction.latitude, junction.longitude):
        return error('Junction is outside the Coimbatore boundary', status_code=422)
    result = await activate_corridor(db, redis, junction_id=junction_id, vehicle_type=body.get('vehicle_type', 'AMBULANCE'), activated_by=current_user.id)
    if not result:
        return error('Junction not found', status_code=404)
    return success(result)

@router.get('/active')
async def get_active(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    corridors = await get_active_corridors(db)
    data=[]
    for c in corridors:
        junction_details=[]
        for jid in c.corridor_junction_ids:
            j_result = await db.execute(select(Junction).where(Junction.id == jid))
            j = j_result.scalar_one_or_none()
            if j and within_coimbatore(j.latitude, j.longitude):
                junction_details.append({'id': str(j.id), 'name': j.name, 'latitude': j.latitude, 'longitude': j.longitude})
        
        trigger_j_result = await db.execute(select(Junction).where(Junction.id == c.triggering_junction_id))
        trigger_j = trigger_j_result.scalar_one_or_none()
        if trigger_j:
            hospital_node = get_hospital_for_junction(trigger_j.name, trigger_j.latitude, trigger_j.longitude)
            junction_details.append({
                'id': hospital_node['id'],
                'name': hospital_node['name'],
                'latitude': hospital_node['latitude'],
                'longitude': hospital_node['longitude']
            })

        data.append({'id': str(c.id), 'heading_degrees': c.heading_degrees, 'corridor_junction_ids': c.corridor_junction_ids, 'corridor_junctions': junction_details, 'activated_at': c.activated_at.isoformat() + 'Z', 'expires_at': c.expires_at.isoformat() + 'Z', 'status': c.status})
    return success(data)

@router.delete('/{corridor_id}/cancel')
async def cancel_emergency(corridor_id: str, current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    cancelled = await cancel_corridor(db, redis, corridor_id)
    if not cancelled:
        return error('Corridor not found or already inactive', status_code=404)
    return success({'message': 'Corridor cancelled successfully', 'corridor_id': corridor_id})
