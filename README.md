# 🏦 LoanPro — Loan Management & Credit Approval System

A complete, production-ready banking/finance application built with **FastAPI + MySQL + React**.

---

## 🗂️ Project Structure

```
loan-management/
├── database/
│   └── schema.sql              ← All tables, stored procedures, triggers, views
├── backend/
│   ├── app/
│   │   ├── main.py             ← FastAPI entry point
│   │   ├── core/
│   │   │   ├── config.py       ← Settings (env-based)
│   │   │   ├── database.py     ← SQLAlchemy engine
│   │   │   └── security.py     ← JWT auth, RBAC
│   │   ├── models/
│   │   │   ├── user.py         ← User model
│   │   │   └── loan.py         ← LoanType, Application, EMI, Payment models
│   │   ├── schemas/
│   │   │   └── schemas.py      ← Pydantic request/response schemas
│   │   └── api/
│   │       ├── auth.py         ← Register, login, profile
│   │       ├── loans.py        ← Loan types, apply, review, disburse, EMI, payments
│   │       ├── reports.py      ← Dashboard, defaulters, rankings, views
│   │       └── admin.py        ← User management
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             ← Router & protected routes
    │   ├── index.css           ← Full design system
    │   ├── hooks/
    │   │   └── useAuth.jsx     ← Auth context
    │   ├── utils/
    │   │   ├── api.js          ← Axios client + all API calls
    │   │   └── helpers.js      ← formatCurrency, formatDate, etc.
    │   ├── components/
    │   │   ├── Layout.jsx      ← App shell with sidebar
    │   │   └── Sidebar.jsx     ← Navigation sidebar
    │   └── pages/
    │       ├── AuthPage.jsx         ← Login + Register
    │       ├── ManagerDashboard.jsx ← Admin/Manager stats + charts
    │       ├── CustomerDashboard.jsx← Customer overview
    │       ├── AllApplications.jsx  ← Manager: all apps + review modal
    │       ├── MyApplications.jsx   ← Customer: their applications
    │       ├── ApplicationDetail.jsx← EMI schedule + payment recording
    │       ├── ApplyLoan.jsx        ← Loan application form + EMI calculator
    │       └── ReportPages.jsx      ← Defaulters, Ranking, Active Loans, Customers, Logs
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Database Setup (MySQL)

```bash
# Login to MySQL
mysql -u root -p

# Run schema (creates DB, tables, procedures, triggers, views, seed data)
SOURCE /path/to/loan-management/database/schema.sql;
```

### 2. Backend Setup

```bash
cd loan-management/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials:
#   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/loan_management
#   SECRET_KEY=your-long-random-secret-key

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd loan-management/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

App available at: http://localhost:5173

---

## 🔐 Default Login Credentials

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@loanpro.com       | Admin@123  |
| Manager | manager@loanpro.com     | Admin@123  |

Register as a customer through the UI.

---

## ✨ Features Implemented

### User Stories
| Story                      | Implementation                                          |
|----------------------------|---------------------------------------------------------|
| Customer Registration/Login| JWT auth, bcrypt passwords, role-based access           |
| Loan Application Form      | Eligibility check, EMI calculator, validation           |
| Loan Types & Eligibility   | 6 loan types with rules in DB, trigger for rate adjust  |
| Approval Workflow          | Review modal: approve/reject/under_review + disburse    |
| EMI Schedule Generation    | MySQL Stored Procedure (generate_emi_schedule)          |
| Payment Tracking           | Stored Procedure (process_payment), payment modal        |
| Defaulter Reports          | SQL View (vw_defaulters) + overdue trigger              |
| Loan Dashboard             | Stats cards, pie chart, recharts                        |
| Role-Based Access          | RBAC middleware: customer / manager / admin             |
| Payment Logs Trigger       | after_payment_insert trigger → payment_logs table       |
| Loan Summary Views         | vw_customer_loan_summary, vw_active_loans               |
| Repayment Ranking          | vw_customer_repayment_ranking with RANK() WINDOW func   |
| Query Optimization         | Indexes on all FK/filter columns, connection pooling    |
| React UI                   | Full React app, dark theme, responsive                  |

### Advanced Database Concepts
- ✅ **Transactions** — process_payment uses START TRANSACTION / COMMIT / ROLLBACK
- ✅ **Stored Procedures** — generate_emi_schedule, process_payment, update_overdue_emis
- ✅ **Triggers** — after_payment_insert (log), before_application_insert (rate calculation)
- ✅ **Views** — vw_customer_loan_summary, vw_active_loans, vw_defaulters, vw_customer_repayment_ranking
- ✅ **Window Functions** — RANK() OVER, NTILE() in repayment ranking view
- ✅ **Indexing** — All FK columns, status, email, application_number indexed
- ✅ **Connection Pooling** — SQLAlchemy pool_size=10, max_overflow=20

---

## 🚀 API Endpoints

```
POST   /api/auth/register         Register new customer
POST   /api/auth/login            Login (returns JWT)
GET    /api/auth/me               Current user profile
PUT    /api/auth/me               Update profile

GET    /api/loans/types           List all loan types
POST   /api/loans/apply           Submit loan application
GET    /api/loans/my-applications Customer's own applications
GET    /api/loans/all             Manager: all applications
GET    /api/loans/{id}            Application detail
POST   /api/loans/{id}/review     Manager: approve/reject
POST   /api/loans/{id}/disburse   Manager: disburse loan → EMI generated
GET    /api/loans/{id}/emi-schedule   EMI schedule
POST   /api/loans/payments/record     Record payment (calls SP)
GET    /api/loans/{id}/payments       Payment history

GET    /api/reports/dashboard         Manager dashboard stats
GET    /api/reports/customer-dashboard Customer dashboard
GET    /api/reports/defaulters        Defaulter report
GET    /api/reports/repayment-ranking Customer ranking
GET    /api/reports/active-loans      Active loans view
GET    /api/reports/payment-logs      Trigger-generated logs

GET    /api/admin/users               List users
PATCH  /api/admin/users/{id}/toggle-active     Toggle user
PATCH  /api/admin/users/{id}/update-credit-score  Update score
```

---

## 🛠️ Tech Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Database | MySQL 8.0 — Stored Procs, Triggers, Views, Window Fns  |
| Backend  | FastAPI, SQLAlchemy, PyMySQL, Passlib, python-jose      |
| Auth     | JWT Bearer tokens, bcrypt password hashing             |
| Frontend | React 18, React Router v6, Axios, Recharts             |
| UI       | Custom CSS design system (dark theme)                  |
