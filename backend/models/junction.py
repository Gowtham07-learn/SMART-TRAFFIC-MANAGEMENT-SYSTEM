import uuid, enum
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class JunctionStatusEnum(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"

class Junction(Base):
    __tablename__ = "junctions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    j_location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    lane_count = Column(Integer, default=4)
    status = Column(SAEnum(JunctionStatusEnum), default=JunctionStatusEnum.ONLINE)
    created_at = Column(DateTime, default=datetime.utcnow)
