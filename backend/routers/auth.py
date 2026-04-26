from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from services.auth_service import verify_password, create_access_token, create_refresh_token, decode_token, get_current_user, log_audit
from utils.response import success, error

router = APIRouter(tags=["Auth"])

@router.post("/login")
async def login(body: dict, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == body.get("email")))
        user = result.scalar_one_or_none()
        if not user or not verify_password(body.get("password", ""), user.hashed_password):
            return error("Invalid credentials", status_code=401)
        if not user.is_active:
            return error("Account disabled", status_code=403)

        token_data = {"sub": user.email, "role": user.role.value, "user_id": str(user.id)}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        client_ip = request.client.host if request.client else "unknown"
        await log_audit(db, user.id, "LOGIN", "auth", "Successful login", client_ip)

        return success({"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role.value}})
    except Exception as e:
        return error("Login failed", str(e), 500)

@router.post("/refresh")
async def refresh(body: dict):
    try:
        payload = decode_token(body.get("refresh_token", ""))
        if payload.get("type") != "refresh":
            return error("Invalid refresh token", status_code=401)
        new_access = create_access_token({"sub": payload["sub"], "role": payload["role"], "user_id": payload["user_id"]})
        return success({"access_token": new_access})
    except Exception as e:
        return error("Token refresh failed", str(e), 401)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await log_audit(db, current_user.id, "LOGOUT", "auth", "User logged out")
    return success({"message": "Logged out successfully"})

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return success({"id": str(current_user.id), "email": current_user.email, "full_name": current_user.full_name, "phone_number": current_user.phone_number, "role": current_user.role.value, "is_active": current_user.is_active, "created_at": current_user.created_at.isoformat()})
