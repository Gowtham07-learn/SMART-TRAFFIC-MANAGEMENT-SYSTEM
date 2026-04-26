from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User, RoleEnum
from services.auth_service import require_roles, hash_password
from utils.response import success, error

router = APIRouter(tags=['Admin'])

@router.get('/users')
async def get_users(current_user=Depends(require_roles(RoleEnum.ADMIN)), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at))
    users = result.scalars().all()
    return success([{'id': str(u.id), 'email': u.email, 'full_name': u.full_name, 'phone_number': u.phone_number, 'role': u.role.value, 'is_active': u.is_active, 'created_at': u.created_at.isoformat()} for u in users])
