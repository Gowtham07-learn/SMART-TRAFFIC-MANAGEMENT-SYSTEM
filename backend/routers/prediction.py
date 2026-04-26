from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.junction import Junction
from services.auth_service import get_current_user, require_roles
from models.user import RoleEnum
from services.prediction_service import get_forecast
from utils.response import success, error

router = APIRouter(tags=["Prediction"])

@router.get('/traffic')
async def predict_traffic(junction_id: str = Query(...), minutes: int = Query(default=30, le=60, ge=5), current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Junction).where(Junction.id == junction_id))
    junction = result.scalar_one_or_none()
    if not junction:
        return error('Junction not found', status_code=404)
    forecast = await get_forecast(junction_id, minutes)
    forecast['junction_name'] = junction.name
    return success(forecast)

@router.get('/network')
async def predict_network(current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Junction))
    junctions = result.scalars().all()
    all_forecasts = []
    for j in junctions:
        forecast = await get_forecast(str(j.id), 30)
        forecast['junction_name'] = j.name
        all_forecasts.append(forecast)
    return success({'junction_count': len(all_forecasts), 'forecasts': all_forecasts, 'model': 'LSTM-simulated', 'accuracy_percent': 83})
