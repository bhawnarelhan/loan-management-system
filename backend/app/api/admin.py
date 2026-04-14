from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_admin, require_manager
from app.models.user import User
from app.schemas.schemas import UserOut

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(
    role: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@router.patch("/users/{user_id}/update-credit-score")
def update_credit_score(
    user_id: int,
    score: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)   # ✅ FIX
):
    if not (300 <= score <= 900):
        raise HTTPException(status_code=400, detail="Credit score must be between 300 and 900")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.credit_score = score
    db.commit()
    return {"message": "Credit score updated", "credit_score": score}