import uuid
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db, AsyncSessionLocal
from models.analytics import SimulationResult
from models.user import RoleEnum
from services.auth_service import get_current_user, require_roles
from services.simulation_service import run_simulation
from utils.response import success, error

router = APIRouter(tags=['Simulation'])

@router.post('/run')
async def start_simulation(body: dict, background_tasks: BackgroundTasks, current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db)):
    sim = SimulationResult(id=uuid.uuid4(), scenario_description=body.get('scenario_description', 'Custom simulation'), input_payload=body, status='RUNNING')
    db.add(sim)
    await db.commit()
    sim_id = str(sim.id)
    async def run_bg():
        async with AsyncSessionLocal() as bg_db:
            await run_simulation(bg_db, sim_id, body)
    background_tasks.add_task(run_bg)
    return success({'simulation_id': sim_id, 'status': 'RUNNING', 'message': f'Simulation started. Poll GET /simulation/results/{sim_id} for results.'})

@router.get('/results/{simulation_id}')
async def get_simulation_results(simulation_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SimulationResult).where(SimulationResult.id == simulation_id))
    sim = result.scalar_one_or_none()
    if not sim: return error('Simulation not found', status_code=404)
    return success({'simulation_id': str(sim.id), 'status': sim.status, 'scenario_description': sim.scenario_description, 'results': sim.results, 'created_at': sim.created_at.isoformat(), 'completed_at': sim.completed_at.isoformat() if sim.completed_at else None})

@router.get('/history')
async def simulation_history(limit: int = 20, current_user=Depends(require_roles(RoleEnum.ADMIN)), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SimulationResult).order_by(desc(SimulationResult.created_at)).limit(limit))
    sims = result.scalars().all()
    return success([{'id': str(s.id), 'scenario_description': s.scenario_description, 'status': s.status, 'created_at': s.created_at.isoformat(), 'completed_at': s.completed_at.isoformat() if s.completed_at else None} for s in sims])
