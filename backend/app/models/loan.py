from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, DECIMAL, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class LoanType(Base):
    __tablename__ = "loan_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    min_amount = Column(DECIMAL(15, 2), nullable=False)
    max_amount = Column(DECIMAL(15, 2), nullable=False)
    min_tenure_months = Column(Integer, nullable=False)
    max_tenure_months = Column(Integer, nullable=False)
    base_interest_rate = Column(DECIMAL(5, 2), nullable=False)
    min_credit_score = Column(Integer, default=600)
    min_annual_income = Column(DECIMAL(15, 2), default=0)
    processing_fee_percent = Column(DECIMAL(5, 2), default=1.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    applications = relationship("LoanApplication", back_populates="loan_type")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_type_id = Column(Integer, ForeignKey("loan_types.id"), nullable=False)
    requested_amount = Column(DECIMAL(15, 2), nullable=False)
    approved_amount = Column(DECIMAL(15, 2))
    tenure_months = Column(Integer, nullable=False)
    interest_rate = Column(DECIMAL(5, 2))
    purpose = Column(Text)
    status = Column(Enum("pending", "under_review", "approved", "rejected", "disbursed", "closed"), default="pending")
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    review_notes = Column(Text)
    reviewed_at = Column(DateTime)
    disbursed_at = Column(DateTime)
    processing_fee = Column(DECIMAL(15, 2))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("User", foreign_keys=[customer_id], back_populates="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_applications")
    loan_type = relationship("LoanType", back_populates="applications")
    emi_schedules = relationship("EMISchedule", back_populates="application")
    payments = relationship("Payment", back_populates="application")


class EMISchedule(Base):
    __tablename__ = "emi_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    emi_amount = Column(DECIMAL(15, 2), nullable=False)
    principal_component = Column(DECIMAL(15, 2), nullable=False)
    interest_component = Column(DECIMAL(15, 2), nullable=False)
    outstanding_balance = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum("pending", "paid", "overdue", "waived"), default="pending")
    paid_amount = Column(DECIMAL(15, 2))
    paid_date = Column(Date)
    penalty_amount = Column(DECIMAL(15, 2), default=0)
    created_at = Column(DateTime, default=func.now())

    application = relationship("LoanApplication", back_populates="emi_schedules")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    emi_schedule_id = Column(Integer, ForeignKey("emi_schedules.id"))
    amount = Column(DECIMAL(15, 2), nullable=False)
    payment_mode = Column(Enum("online", "bank_transfer", "cash", "cheque"), nullable=False)
    transaction_reference = Column(String(100))
    payment_date = Column(DateTime, default=func.now())
    recorded_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)

    application = relationship("LoanApplication", back_populates="payments")


class PaymentLog(Base):
    __tablename__ = "payment_logs"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, nullable=False)
    application_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    action = Column(String(50), nullable=False)
    log_timestamp = Column(DateTime, default=func.now())
    details = Column(Text)