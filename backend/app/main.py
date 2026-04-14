from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, loans, reports, admin
from app.core.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LoanPro - Loan Management & Credit Approval System",
    description="Complete banking/finance application for loan management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(loans.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "app": "LoanPro API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}