import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class TrafficFlow(Base):
    __tablename__='traffic_flows'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    flow_id=Column(String,unique=True,nullable=False)
    junction_id=Column(UUID(as_uuid=True),ForeignKey('junctions.id'),nullable=False)
    vehicle_count=Column(Integer,default=0)
    congestion_level=Column(String,default='LOW')
    avg_speed_kmh=Column(Float,default=0.0)
    recorded_at=Column(DateTime,default=datetime.utcnow)
