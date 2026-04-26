from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import settings
from models.user import User, RoleEnum, AuditLog
from database import get_db
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
bearer_scheme = HTTPBearer()
def hash_password(password: str) -> str: return pwd_context.hash(password)
def verify_password(plain: str, hashed: str) -> bool: return pwd_context.verify(plain, hashed)
def create_access_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, 'exp': expire, 'type': 'access'}, settings.SECRET_KEY, settings.ALGORITHM)
def create_refresh_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({**data, 'exp': expire, 'type': 'refresh'}, settings.SECRET_KEY, settings.ALGORITHM)
def decode_token(token: str) -> dict:
    try: return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError: raise HTTPException(status_code=401, detail='Invalid or expired token')
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_token(credentials.credentials)
    result = await db.execute(select(User).where(User.email == payload.get('sub')))
    user = result.scalar_one_or_none()
    if not user or not user.is_active: raise HTTPException(status_code=401, detail='User not found or inactive')
    return user
def require_roles(*roles: RoleEnum):
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles: raise HTTPException(status_code=403, detail=f'Access denied. Required roles: {[r.value for r in roles]}')
        return current_user
    return checker
async def log_audit(db: AsyncSession, user_id, action: str, resource: str, details: str = None, ip_address: str = None):
    db.add(AuditLog(user_id=user_id, action=action, resource=resource, details=details, ip_address=ip_address))
    await db.commit()
