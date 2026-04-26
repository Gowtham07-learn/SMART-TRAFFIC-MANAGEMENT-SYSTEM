import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
class IoTSensor(Base):
    __tablename__='iot_sensors'
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    sensor_id=Column(String,unique=True,nullable=False)
    signal_id=Column(UUID(as_uuid=True),ForeignKey('traffic_signals.id'),nullable=False)
    sensor_type=Column(String,nullable=False)
    status=Column(String,default='ONLINE')
    readings=Column(JSON,nullable=True)
    last_ping=Column(DateTime,default=datetime.utcnow)
    created_at=Column(DateTime,default=datetime.utcnow)
