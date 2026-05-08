import asyncio
from database import AsyncSessionLocal, engine, Base
from models.user import User, RoleEnum
import models.analytics
import models.emergency
import models.incident
import models.iot_sensor
import models.junction
import models.route
import models.signal
import models.traffic_flow
from services.auth_service import hash_password

USERS = [
    {'email': 'admin@gmail.com', 'full_name': 'Admin User', 'role': RoleEnum.ADMIN, 'phone': '9876543210'},
    {'email': 'traffic@gmail.com', 'full_name': 'Controller Unit', 'role': RoleEnum.TRAFFIC_CONTROLLER, 'phone': '9876543211'},
    {'email': 'driver@gmail.com', 'full_name': 'Emergency Driver', 'role': RoleEnum.EMERGENCY_DRIVER, 'phone': '9876543212'},
    {'email': 'citizen@gmail.com', 'full_name': 'Citizen User', 'role': RoleEnum.CITIZEN, 'phone': '9876543213'},
]

JUNCTIONS = {
    'PSG Tech Main Gate': [11.0247, 77.003],
    'Peelamedu Signal': [11.026, 77.004],
    'Hopes College Signal': [11.028, 77.012],
    'Nava India Junction': [11.018, 76.992],
    'Fun Republic Mall Road': [11.027, 77.015],
    'Gandhipuram Junction': [11.0168, 76.9673],
    'Town Hall': [10.9947, 76.9614],
    'Ukkadam Junction': [10.9909, 76.9598],
    'Singanallur Junction': [11.0056, 77.0347],
    'RS Puram Junction': [11.0051, 76.9515],
    'Ganapathy': [11.0594, 76.9995],
    'Saravanampatti': [11.0818, 77.0054],
    'Avinashi Road': [11.0185, 77.0368],
}

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        hp = hash_password('test@1234')
        for u in USERS:
            db.add(User(email=u['email'], hashed_password=hp, full_name=u['full_name'], role=u['role'], phone_number=u['phone']))
        
        for name, coords in JUNCTIONS.items():
            j = models.junction.Junction(name=name, j_location=name, latitude=coords[0], longitude=coords[1], lane_count=4)
            db.add(j)
            await db.flush()
            s = models.signal.TrafficSignal(junction_id=j.id, signal_id=f"SIG-{name.replace(' ', '')}", location=name)
            db.add(s)

        await db.commit()
    print('SEED COMPLETE - password test@1234')

if __name__ == '__main__':
    asyncio.run(seed())
