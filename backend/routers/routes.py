from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models.route import RouteFinder
from services.auth_service import get_current_user
from services.route_service import find_route
from utils.response import success, error

router = APIRouter(tags=['Routes'])

@router.post('/find')
async def find_route_endpoint(body: dict, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await find_route(db, s_location=body.get('s_location', 'Source'), s_lat=float(body['s_lat']), s_lon=float(body['s_lon']), d_location=body.get('d_location', 'Destination'), d_lat=float(body['d_lat']), d_lon=float(body['d_lon']), requested_by=current_user.id)
        return success(result)
    except (KeyError, ValueError) as e:
        return error('Missing or invalid coordinates', str(e), 422)

@router.get('/history')
async def get_route_history(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RouteFinder)
        .where(
            RouteFinder.requested_by == current_user.id,
            RouteFinder.s_lat.between(10.90, 11.10),
            RouteFinder.s_lon.between(76.85, 77.10),
            RouteFinder.d_lat.between(10.90, 11.10),
            RouteFinder.d_lon.between(76.85, 77.10),
        )
        .order_by(desc(RouteFinder.created_at))
        .limit(20)
    )
    routes = result.scalars().all()
    return success([{'route_id': r.route_id, 's_location': r.s_location, 'd_location': r.d_location, 'distance_km': r.distance, 'time_minutes': r.time, 'created_at': r.created_at.isoformat()} for r in routes])
