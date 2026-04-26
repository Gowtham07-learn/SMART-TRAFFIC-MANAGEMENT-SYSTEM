import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.user import RoleEnum
from services.auth_service import get_current_user, require_roles
from services.analytics_service import calculate_co2, get_summary, export_csv_data
from utils.response import success
from app_state import get_redis

router = APIRouter(tags=['Analytics'])

@router.get('/co2')
async def get_co2(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    data = await calculate_co2(db, redis)
    return success(data)

@router.get('/summary')
async def get_analytics_summary(current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    data = await get_summary(db, redis)
    return success(data)

@router.get('/export')
async def export_analytics(format: str = 'csv', current_user=Depends(require_roles(RoleEnum.ADMIN)), db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    csv_str = await export_csv_data(db, redis)
    return StreamingResponse(io.BytesIO(csv_str.encode()), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=stms_export.csv'})
