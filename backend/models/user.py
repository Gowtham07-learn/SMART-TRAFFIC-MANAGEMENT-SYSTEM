import uuid, enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    TRAFFIC_CONTROLLER = "TRAFFIC_CONTROLLER"
    EMERGENCY_DRIVER = "EMERGENCY_DRIVER"
    CITIZEN = "CITIZEN"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    role = Column(SAEnum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
