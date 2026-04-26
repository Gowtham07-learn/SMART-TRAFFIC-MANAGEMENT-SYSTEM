import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class IncidentReport(Base):
    __tablename__='incident_reports'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    report_id=Column(String,unique=True,nullable=False)
    reported_by=Column(UUID(as_uuid=True),ForeignKey('users.id'),nullable=True)
    ir_vehicle=Column(String,nullable=True)
    location=Column(String,nullable=False)
    location_lat=Column(Float,nullable=True)
    location_lon=Column(Float,nullable=True)
    node=Column(String,nullable=True)
    nearest_junction_id=Column(UUID(as_uuid=True),ForeignKey('junctions.id'),nullable=True)
    severity=Column(String,nullable=False,default='MEDIUM')
    description=Column(Text,nullable=True)
    timestamp=Column(DateTime,default=datetime.utcnow)
    is_auto_generated=Column(Boolean,default=False)
    status=Column(String,default='OPEN')
    resolved_at=Column(DateTime,nullable=True)
    resolved_by=Column(UUID(as_uuid=True),ForeignKey('users.id'),nullable=True)
