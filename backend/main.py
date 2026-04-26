import asyncio
import uuid
from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from app_state import init_redis, get_redis_sync
from services.auth_service import decode_token
from services.emergency_service import expire_corridors
from services.sensor_service import simulate_sensor_readings
from websocket.hub import hub, traffic_simulation_loop
from database import AsyncSessionLocal

import models.user
import models.junction
import models.signal
import models.iot_sensor
import models.traffic_flow
import models.emergency
import models.incident
import models.route
import models.analytics

from routers import auth, junctions, iot_sensors, traffic_flow, emergency, incidents, routes, prediction, simulation, analytics, admin

app = FastAPI(
    title='Smart Traffic Management System API',
    version='1.0.0',
    description='STMS Backend - Real-time traffic management with AI predictions and emergency corridors'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/auth')
app.include_router(junctions.router, prefix='/junctions')
app.include_router(iot_sensors.router, prefix='/sensors')
app.include_router(traffic_flow.router, prefix='/traffic')
app.include_router(emergency.router, prefix='/emergency')
app.include_router(incidents.router, prefix='/incidents')
app.include_router(routes.router, prefix='/routes')
app.include_router(prediction.router, prefix='/predict')
app.include_router(simulation.router, prefix='/simulation')
app.include_router(analytics.router, prefix='/analytics')
app.include_router(admin.router, prefix='/admin')

@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'STMS API', 'version': '1.0.0', 'docs': '/docs', 'redoc': '/redoc', 'websocket': 'ws://localhost:8000/ws/traffic?token=<JWT>'}

@app.get('/health')
async def health():
    return {'status': 'healthy', 'service': 'STMS API', 'version': '1.0.0'}

@app.websocket('/ws/traffic')
async def ws_traffic(websocket: WebSocket, token: str = Query(...)):
    try:
        decode_token(token)
    except Exception:
        await websocket.close(code=4001)
        return

    cid = str(uuid.uuid4())
    await hub.connect(websocket, cid)
    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                pass
    except Exception:
        hub.disconnect(cid)

@app.on_event('startup')
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await init_redis()
    redis = get_redis_sync()

    asyncio.create_task(traffic_simulation_loop(AsyncSessionLocal, redis))

    async def expire_loop():
        while True:
            await asyncio.sleep(10)
            try:
                async with AsyncSessionLocal() as db:
                    await expire_corridors(db, redis)
            except Exception:
                pass

    async def sensor_loop():
        while True:
            await asyncio.sleep(15)
            try:
                async with AsyncSessionLocal() as db:
                    await simulate_sensor_readings(db)
            except Exception:
                pass

    asyncio.create_task(expire_loop())
    asyncio.create_task(sensor_loop())

@app.on_event('shutdown')
async def shutdown():
    redis = get_redis_sync()
    if redis:
        await redis.close()
