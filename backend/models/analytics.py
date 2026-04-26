import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class CO2Record(Base):
    __tablename__='co2_records'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    junction_id=Column(UUID(as_uuid=True),ForeignKey('junctions.id'),nullable=False)
    vehicle_count=Column(Integer,nullable=False)
    idle_seconds=Column(Float,nullable=False)
    co2_kg=Column(Float,nullable=False)
    recorded_at=Column(DateTime,default=datetime.utcnow)
class SimulationResult(Base):
    __tablename__='simulation_results'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    scenario_description=Column(String,nullable=True)
    input_payload=Column(JSON,nullable=True)
    results=Column(JSON,nullable=True)
    status=Column(String,default='PENDING')
    created_at=Column(DateTime,default=datetime.utcnow)
    completed_at=Column(DateTime,nullable=True)
