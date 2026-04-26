import uuid, enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class PhaseEnum(str, enum.Enum):
    NS_GREEN = "NS_GREEN"
    EW_GREEN = "EW_GREEN"
    ALL_RED = "ALL_RED"
    EMERGENCY_OVERRIDE = "EMERGENCY_OVERRIDE"

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signal_id = Column(String, unique=True, nullable=False)
    junction_id = Column(UUID(as_uuid=True), ForeignKey("junctions.id"), nullable=False)
    location = Column(String, nullable=False)
    signal_status = Column(String, default="ACTIVE")
    current_phase = Column(SAEnum(PhaseEnum), default=PhaseEnum.NS_GREEN)
    phase_duration = Column(Integer, default=30)
    green_duration_ns = Column(Integer, default=30)
    green_duration_ew = Column(Integer, default=30)
    vehicle_count_ns = Column(Integer, default=0)
    vehicle_count_ew = Column(Integer, default=0)
    emergency_override = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
