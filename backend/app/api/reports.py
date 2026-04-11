from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_manager
from app.models.user import User
from app.models.loan import LoanApplication, EMISchedule, Payment
from app.schemas.schemas import DashboardStats, DefaulterOut, RepaymentRankOut
from decimal import Decimal

router = APIRouter(prefix="/api/reports", tags=["Reports & Dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    total = db.query(LoanApplication).count()
    pending = db.query(LoanApplication).filter(LoanApplication.status == "pending").count()
    approved = db.query(LoanApplication).filter(LoanApplication.status == "approved").count()
    rejected = db.query(LoanApplication).filter(LoanApplication.status == "rejected").count()
    disbursed = db.query(LoanApplication).filter(LoanApplication.status.in_(["disbursed", "closed"])).count()

    total_disbursed = db.query(func.sum(LoanApplication.approved_amount)).filter(
        LoanApplication.status.in_(["disbursed", "closed"])
    ).scalar() or Decimal("0")

    total_collected = db.query(func.sum(Payment.amount)).scalar() or Decimal("0")
    overdue = db.query(EMISchedule).filter(EMISchedule.status == "overdue").count()

    return DashboardStats(
        total_applications=total,
        pending_applications=pending,
        approved_applications=approved,
        rejected_applications=rejected,
        disbursed_applications=disbursed,
        total_disbursed_amount=total_disbursed,
        total_collected_amount=total_collected,
        overdue_emis=overdue
    )


@router.get("/customer-dashboard")
def customer_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "customer":
        return {"error": "Customer only endpoint"}

    apps = db.query(LoanApplication).filter(LoanApplication.customer_id == current_user.id).all()
    total = len(apps)
    pending = sum(1 for a in apps if a.status == "pending")
    active = sum(1 for a in apps if a.status == "disbursed")
    closed = sum(1 for a in apps if a.status == "closed")

    overdue_emis = db.query(EMISchedule).join(LoanApplication).filter(
        LoanApplication.customer_id == current_user.id,
        EMISchedule.status == "overdue"
    ).count()

    upcoming_emi = db.query(EMISchedule).join(LoanApplication).filter(
        LoanApplication.customer_id == current_user.id,
        EMISchedule.status == "pending"
    ).order_by(EMISchedule.due_date).first()

    return {
        "total_applications": total,
        "pending_applications": pending,
        "active_loans": active,
        "closed_loans": closed,
        "overdue_emis": overdue_emis,
        "credit_score": current_user.credit_score,
        "upcoming_emi": {
            "due_date": str(upcoming_emi.due_date) if upcoming_emi else None,
            "amount": float(upcoming_emi.emi_amount) if upcoming_emi else None,
            "installment": upcoming_emi.installment_number if upcoming_emi else None
        } if upcoming_emi else None
    }


@router.get("/defaulters", response_model=List[DefaulterOut])
def get_defaulters(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    # Update overdue EMIs first
    try:
        db.execute(text("CALL update_overdue_emis()"))
        db.commit()
    except:
        pass

    result = db.execute(text("SELECT * FROM vw_defaulters LIMIT 100"))
    rows = result.fetchall()
    return [DefaulterOut(
        customer_id=row.customer_id,
        full_name=row.full_name,
        email=row.email,
        phone=row.phone,
        credit_score=row.credit_score,
        application_number=row.application_number,
        approved_amount=row.approved_amount,
        overdue_count=row.overdue_count,
        total_overdue_amount=row.total_overdue_amount,
        days_overdue=row.days_overdue
    ) for row in rows]


@router.get("/repayment-ranking", response_model=List[RepaymentRankOut])
def get_repayment_ranking(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    result = db.execute(text("SELECT * FROM vw_customer_repayment_ranking ORDER BY repayment_rank LIMIT 50"))
    rows = result.fetchall()
    return [RepaymentRankOut(
        customer_id=row.customer_id,
        full_name=row.full_name,
        email=row.email,
        credit_score=row.credit_score,
        repayment_score=row.repayment_score,
        repayment_rank=row.repayment_rank,
        paid_emis=row.paid_emis or 0,
        overdue_emis=row.overdue_emis or 0
    ) for row in rows]


@router.get("/active-loans")
def get_active_loans(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    result = db.execute(text("SELECT * FROM vw_active_loans ORDER BY disbursed_at DESC"))
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]


@router.get("/payment-logs")
def get_payment_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    result = db.execute(text(f"SELECT pl.*, u.full_name FROM payment_logs pl JOIN users u ON pl.customer_id = u.id ORDER BY pl.log_timestamp DESC LIMIT {limit}"))
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]