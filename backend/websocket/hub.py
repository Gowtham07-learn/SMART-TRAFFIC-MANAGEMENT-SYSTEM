import json
import asyncio
import random
from datetime import datetime
from fastapi import WebSocket

class TrafficHub:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, cid: str):
        await websocket.accept()
        self.connections[cid] = websocket

    def disconnect(self, cid: str):
        self.connections.pop(cid, None)

    async def broadcast(self, data: dict):
        dead = []
        for cid, ws in self.connections.items():
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(cid)
        for cid in dead:
            self.disconnect(cid)

hub = TrafficHub()

_phase_counter: dict[str, int] = {}
PHASE_CYCLE_TICKS = 30

async def traffic_simulation_loop(session_factory, redis_client):
    from sqlalchemy import select
    from models.junction import Junction
    from models.signal import TrafficSignal

    while True:
        await asyncio.sleep(2)
        try:
            async with session_factory() as db:
                j_result = await db.execute(select(Junction))
                junctions = j_result.scalars().all()
                s_result = await db.execute(select(TrafficSignal))
                signals = {str(s.junction_id): s for s in s_result.scalars().all()}

                output = []
                for j in junctions:
                    jid = str(j.id)
                    signal = signals.get(jid)
                    if not signal:
                        continue

                    if jid not in _phase_counter:
                        _phase_counter[jid] = random.randint(0, PHASE_CYCLE_TICKS * 2)
                    _phase_counter[jid] = (_phase_counter[jid] + 1) % (PHASE_CYCLE_TICKS * 2)
                    phase = 'NS_GREEN' if _phase_counter[jid] < PHASE_CYCLE_TICKS and not signal.emergency_override else 'EW_GREEN' if not signal.emergency_override else 'EMERGENCY_OVERRIDE'

                    ns = max(0, min(200, signal.vehicle_count_ns + random.randint(-5, 5)))
                    ew = max(0, min(200, signal.vehicle_count_ew + random.randint(-5, 5)))
                    signal.vehicle_count_ns = ns
                    signal.vehicle_count_ew = ew

                    total = ns + ew
                    congestion = 'LOW' if total < 50 else 'MEDIUM' if total < 100 else 'HIGH' if total < 150 else 'CRITICAL'
                    state = {'id': jid, 'name': j.name, 'latitude': j.latitude, 'longitude': j.longitude, 'status': j.status.value, 'current_phase': phase, 'vehicle_count_ns': ns, 'vehicle_count_ew': ew, 'green_duration_ns': signal.green_duration_ns, 'green_duration_ew': signal.green_duration_ew, 'emergency_override': signal.emergency_override, 'congestion_level': congestion, 'signal_id': signal.signal_id}
                    if redis_client:
                        await redis_client.setex(f'junction:{jid}:state', 30, json.dumps(state))
                    output.append(state)
                await db.commit()
                await hub.broadcast({'type': 'TRAFFIC_UPDATE', 'timestamp': datetime.utcnow().isoformat() + 'Z', 'junction_count': len(output), 'junctions': output})
        except Exception:
            await asyncio.sleep(2)
