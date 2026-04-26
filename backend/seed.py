import asyncio
from database import AsyncSessionLocal, engine, Base
from models.user import User, RoleEnum
from services.auth_service import hash_password

USERS = [
    {'email': 'admin@gmail.com', 'full_name': 'Admin User', 'role': RoleEnum.ADMIN, 'phone': '9876543210'},
    {'email': 'traffic@gmail.com', 'full_name': 'Controller Unit', 'role': RoleEnum.TRAFFIC_CONTROLLER, 'phone': '9876543211'},
    {'email': 'driver@gmail.com', 'full_name': 'Emergency Driver', 'role': RoleEnum.EMERGENCY_DRIVER, 'phone': '9876543212'},
    {'email': 'citizen@gmail.com', 'full_name': 'Citizen User', 'role': RoleEnum.CITIZEN, 'phone': '9876543213'},
]

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        hp = hash_password('test1234')
        for u in USERS:
            db.add(User(email=u['email'], hashed_password=hp, full_name=u['full_name'], role=u['role'], phone_number=u['phone']))
        await db.commit()
    print('SEED COMPLETE - password test1234')

if __name__ == '__main__':
    asyncio.run(seed())
