from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, DECIMAL, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    customer = "customer"
    manager = "manager"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    date_of_birth = Column(Date)
    annual_income = Column(DECIMAL(15, 2))
    credit_score = Column(Integer, default=650)
    role = Column(Enum("customer", "manager", "admin"), default="customer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    applications = relationship("LoanApplication", foreign_keys="LoanApplication.customer_id", back_populates="customer")
    reviewed_applications = relationship("LoanApplication", foreign_keys="LoanApplication.reviewed_by", back_populates="reviewer")