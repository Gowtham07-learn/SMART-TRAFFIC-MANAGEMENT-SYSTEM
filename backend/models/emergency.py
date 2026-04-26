import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class EmergencyVehicle(Base):
    __tablename__='emergency_vehicles'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    vehicle_id=Column(String,unique=True,nullable=False)
    vehicle_type=Column(String,nullable=False)
    priority_level=Column(Integer,default=1)
    cur_location_lat=Column(Float,nullable=True)
    cur_location_lon=Column(Float,nullable=True)
    assigned_driver_id=Column(UUID(as_uuid=True),ForeignKey('users.id'),nullable=True)
    is_active=Column(Boolean,default=False)
    created_at=Column(DateTime,default=datetime.utcnow)
class EmergencyCorridor(Base):
    __tablename__='emergency_corridors'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    emergency_vehicle_id=Column(UUID(as_uuid=True),ForeignKey('emergency_vehicles.id'),nullable=True)
    triggering_junction_id=Column(UUID(as_uuid=True),ForeignKey('junctions.id'),nullable=False)
    heading_degrees=Column(Float,nullable=False)
    corridor_junction_ids=Column(JSON,nullable=False)
    activated_by=Column(UUID(as_uuid=True),ForeignKey('users.id'),nullable=True)
    status=Column(String,default='ACTIVE')
    activated_at=Column(DateTime,default=datetime.utcnow)
    expires_at=Column(DateTime,nullable=False)
    cancelled_at=Column(DateTime,nullable=True)
