from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import re


# ─── Auth Schemas ────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    annual_income: Optional[Decimal] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    credit_score: int
    annual_income: Optional[Decimal]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    annual_income: Optional[Decimal] = None


# ─── Loan Type Schemas ────────────────────────────────────────

class LoanTypeOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    min_amount: Decimal
    max_amount: Decimal
    min_tenure_months: int
    max_tenure_months: int
    base_interest_rate: Decimal
    min_credit_score: int
    min_annual_income: Decimal
    processing_fee_percent: Decimal

    class Config:
        from_attributes = True


# ─── Loan Application Schemas ─────────────────────────────────

class LoanApplicationCreate(BaseModel):
    loan_type_id: int
    requested_amount: Decimal
    tenure_months: int
    purpose: Optional[str] = None


class LoanApplicationOut(BaseModel):
    id: int
    application_number: str
    customer_id: int
    loan_type_id: int
    requested_amount: Decimal
    approved_amount: Optional[Decimal]
    tenure_months: int
    interest_rate: Optional[Decimal]
    purpose: Optional[str]
    status: str
    review_notes: Optional[str]
    reviewed_at: Optional[datetime]
    disbursed_at: Optional[datetime]
    processing_fee: Optional[Decimal]
    created_at: datetime
    customer: Optional[UserOut] = None
    loan_type: Optional[LoanTypeOut] = None

    class Config:
        from_attributes = True


class LoanReviewRequest(BaseModel):
    action: str  # approve | reject | under_review
    approved_amount: Optional[Decimal] = None
    review_notes: Optional[str] = None


class DisburseRequest(BaseModel):
    application_id: int


# ─── EMI Schemas ──────────────────────────────────────────────

class EMIScheduleOut(BaseModel):
    id: int
    installment_number: int
    due_date: date
    emi_amount: Decimal
    principal_component: Decimal
    interest_component: Decimal
    outstanding_balance: Decimal
    status: str
    paid_amount: Optional[Decimal]
    paid_date: Optional[date]
    penalty_amount: Decimal

    class Config:
        from_attributes = True


# ─── Payment Schemas ──────────────────────────────────────────

class PaymentCreate(BaseModel):
    application_id: int
    amount: Decimal
    payment_mode: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    application_id: int
    amount: Decimal
    payment_mode: str
    transaction_reference: Optional[str]
    payment_date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


# ─── Dashboard / Report Schemas ───────────────────────────────

class DashboardStats(BaseModel):
    total_applications: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    disbursed_applications: int
    total_disbursed_amount: Decimal
    total_collected_amount: Decimal
    overdue_emis: int


class DefaulterOut(BaseModel):
    customer_id: int
    full_name: str
    email: str
    phone: Optional[str]
    credit_score: int
    application_number: str
    approved_amount: Decimal
    overdue_count: int
    total_overdue_amount: Decimal
    days_overdue: int


class RepaymentRankOut(BaseModel):
    customer_id: int
    full_name: str
    email: str
    credit_score: int
    repayment_score: Optional[Decimal]
    repayment_rank: int
    paid_emis: int
    overdue_emis: int


Token.model_rebuild()