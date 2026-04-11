from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, func
from typing import List, Optional
from datetime import datetime
import random
import string
from app.core.database import get_db
from app.core.security import get_current_user, require_manager
from app.models.user import User
from app.models.loan import LoanApplication, LoanType, EMISchedule, Payment
from app.schemas.schemas import (
    LoanApplicationCreate, LoanApplicationOut, LoanTypeOut,
    LoanReviewRequest, EMIScheduleOut, PaymentCreate, PaymentOut,
    DashboardStats, DefaulterOut, RepaymentRankOut
)
from decimal import Decimal

router = APIRouter(prefix="/api/loans", tags=["Loans"])


def generate_application_number():
    prefix = "LN"
    year = datetime.now().strftime("%Y")
    random_part = ''.join(random.choices(string.digits, k=8))
    return f"{prefix}{year}{random_part}"


# ─── Loan Types ───────────────────────────────────────────────

@router.get("/types", response_model=List[LoanTypeOut])
def get_loan_types(db: Session = Depends(get_db)):
    return db.query(LoanType).filter(LoanType.is_active == True).all()


@router.get("/types/{type_id}", response_model=LoanTypeOut)
def get_loan_type(type_id: int, db: Session = Depends(get_db)):
    lt = db.query(LoanType).filter(LoanType.id == type_id).first()
    if not lt:
        raise HTTPException(status_code=404, detail="Loan type not found")
    return lt


# ─── Applications ─────────────────────────────────────────────

@router.post("/apply", response_model=LoanApplicationOut, status_code=201)
def apply_for_loan(
    payload: LoanApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can apply for loans")

    loan_type = db.query(LoanType).filter(LoanType.id == payload.loan_type_id, LoanType.is_active == True).first()
    if not loan_type:
        raise HTTPException(status_code=404, detail="Loan type not found")

    # Eligibility checks
    errors = []
    if current_user.credit_score < loan_type.min_credit_score:
        errors.append(f"Credit score {current_user.credit_score} is below minimum {loan_type.min_credit_score}")
    if current_user.annual_income and current_user.annual_income < loan_type.min_annual_income:
        errors.append(f"Annual income below minimum requirement")
    if payload.requested_amount < loan_type.min_amount or payload.requested_amount > loan_type.max_amount:
        errors.append(f"Amount must be between {loan_type.min_amount} and {loan_type.max_amount}")
    if payload.tenure_months < loan_type.min_tenure_months or payload.tenure_months > loan_type.max_tenure_months:
        errors.append(f"Tenure must be between {loan_type.min_tenure_months} and {loan_type.max_tenure_months} months")

    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    processing_fee = payload.requested_amount * loan_type.processing_fee_percent / 100

    application = LoanApplication(
        application_number=generate_application_number(),
        customer_id=current_user.id,
        loan_type_id=payload.loan_type_id,
        requested_amount=payload.requested_amount,
        tenure_months=payload.tenure_months,
        purpose=payload.purpose,
        processing_fee=processing_fee,
        status="pending"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return db.query(LoanApplication).options(
        joinedload(LoanApplication.customer),
        joinedload(LoanApplication.loan_type)
    ).filter(LoanApplication.id == application.id).first()


@router.get("/my-applications", response_model=List[LoanApplicationOut])
def my_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LoanApplication).options(
        joinedload(LoanApplication.loan_type)
    ).filter(LoanApplication.customer_id == current_user.id)
    if status:
        query = query.filter(LoanApplication.status == status)
    return query.order_by(LoanApplication.created_at.desc()).all()


@router.get("/all", response_model=List[LoanApplicationOut])
def get_all_applications(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    query = db.query(LoanApplication).options(
        joinedload(LoanApplication.customer),
        joinedload(LoanApplication.loan_type)
    )
    if status:
        query = query.filter(LoanApplication.status == status)
    return query.order_by(LoanApplication.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{application_id}", response_model=LoanApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(LoanApplication).options(
        joinedload(LoanApplication.customer),
        joinedload(LoanApplication.loan_type)
    ).filter(LoanApplication.id == application_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Customers can only view their own applications
    if current_user.role == "customer" and app.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return app


@router.post("/{application_id}/review")
def review_application(
    application_id: int,
    payload: LoanReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ("pending", "under_review"):
        raise HTTPException(status_code=400, detail=f"Cannot review application with status: {app.status}")

    if payload.action == "approve":
        if not payload.approved_amount:
            payload.approved_amount = app.requested_amount
        app.status = "approved"
        app.approved_amount = payload.approved_amount
    elif payload.action == "reject":
        app.status = "rejected"
    elif payload.action == "under_review":
        app.status = "under_review"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use: approve, reject, under_review")

    app.reviewed_by = current_user.id
    app.review_notes = payload.review_notes
    app.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": f"Application {payload.action}d successfully", "status": app.status}


@router.post("/{application_id}/disburse")
def disburse_loan(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved loans can be disbursed")

    app.status = "disbursed"
    app.disbursed_at = datetime.utcnow()
    db.commit()

    # Call stored procedure to generate EMI schedule
    try:
        db.execute(text(f"CALL generate_emi_schedule({application_id})"))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"EMI generation failed: {str(e)}")

    return {"message": "Loan disbursed and EMI schedule generated successfully"}


# ─── EMI Schedule ─────────────────────────────────────────────

@router.get("/{application_id}/emi-schedule", response_model=List[EMIScheduleOut])
def get_emi_schedule(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == "customer" and app.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(EMISchedule).filter(
        EMISchedule.application_id == application_id
    ).order_by(EMISchedule.installment_number).all()


# ─── Payments ─────────────────────────────────────────────────

@router.post("/payments/record", response_model=PaymentOut, status_code=201)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ("disbursed",):
        raise HTTPException(status_code=400, detail="Can only record payments for disbursed loans")

    try:
        db.execute(text(
            f"CALL process_payment({payload.application_id}, {float(payload.amount)}, "
            f"'{payload.payment_mode}', '{payload.transaction_reference or ''}', {current_user.id})"
        ))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

    payment = db.query(Payment).filter(
        Payment.application_id == payload.application_id
    ).order_by(Payment.id.desc()).first()

    return payment


@router.get("/{application_id}/payments", response_model=List[PaymentOut])
def get_payments(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == "customer" and app.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(Payment).filter(Payment.application_id == application_id).order_by(Payment.payment_date.desc()).all()