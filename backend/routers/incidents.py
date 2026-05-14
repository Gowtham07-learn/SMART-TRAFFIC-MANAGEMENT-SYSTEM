import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models.incident import IncidentReport
from models.user import RoleEnum
from services.auth_service import get_current_user, require_roles
from utils.response import success, error

router = APIRouter(tags=['Incidents'])

def _incident_dict(i, full=True):
    d = {'id': str(i.id), 'report_id': i.report_id, 'location': i.location, 'severity': i.severity, 'status': i.status, 'timestamp': i.timestamp.isoformat()}
    if full:
        d.update({'ir_vehicle': i.ir_vehicle, 'location_lat': i.location_lat, 'location_lon': i.location_lon, 'node': i.node, 'description': i.description, 'is_auto_generated': i.is_auto_generated, 'resolved_at': i.resolved_at.isoformat() if i.resolved_at else None})
    return d

@router.post('/report')
async def report_incident(body: dict, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    report_id = f'RPT-{ts}-{str(uuid.uuid4())[:4].upper()}'
    incident = IncidentReport(report_id=report_id, reported_by=current_user.id, ir_vehicle=body.get('ir_vehicle'), location=body.get('location', 'Unknown'), location_lat=body.get('location_lat'), location_lon=body.get('location_lon'), node=body.get('node'), nearest_junction_id=body.get('nearest_junction_id'), severity=body.get('severity', 'MEDIUM'), description=body.get('description'), is_auto_generated=False, status='OPEN')
    db.add(incident)
    await db.commit()
    return success({'report_id': report_id, 'message': 'Incident reported successfully', 'severity': incident.severity, 'status': 'OPEN'}, status_code=201)

@router.get('')
async def get_all_incidents(status: str = Query(default=None), severity: str = Query(default=None), limit: int = Query(default=50, le=200), current_user=Depends(require_roles(RoleEnum.ADMIN, RoleEnum.TRAFFIC_CONTROLLER)), db: AsyncSession = Depends(get_db)):
    query = select(IncidentReport).order_by(desc(IncidentReport.timestamp)).limit(limit)
    if status: query = query.where(IncidentReport.status == status)
    if severity: query = query.where(IncidentReport.severity == severity)
    result = await db.execute(query)
    incidents = result.scalars().all()
    return success([_incident_dict(i) for i in incidents])


@router.get('/my')
async def get_my_incidents(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IncidentReport).where(IncidentReport.reported_by == current_user.id).order_by(desc(IncidentReport.timestamp)))
    incidents = result.scalars().all()
    return success([_incident_dict(i, full=False) for i in incidents])