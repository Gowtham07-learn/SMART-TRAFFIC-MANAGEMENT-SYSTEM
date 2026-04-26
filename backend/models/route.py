import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class RouteFinder(Base):
    __tablename__='route_finders'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    route_id=Column(String,unique=True,nullable=False)
    requested_by=Column(UUID(as_uuid=True),ForeignKey('users.id'),nullable=True)
    s_location=Column(String,nullable=False)
    s_lat=Column(Float,nullable=False)
    s_lon=Column(Float,nullable=False)
    d_location=Column(String,nullable=False)
    d_lat=Column(Float,nullable=False)
    d_lon=Column(Float,nullable=False)
    distance=Column(Float,nullable=True)
    time=Column(Float,nullable=True)
    optimal_path=Column(JSON,nullable=True)
    created_at=Column(DateTime,default=datetime.utcnow)
