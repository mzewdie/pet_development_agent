"""
FastAPI Application providing REST API for Personal Expense Tracker.
"""

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os

from backend.database import get_db, init_db, DB_PATH
from backend.models import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse,
    CategoryCreate, CategoryResponse, DashboardSummary
)
from backend.crud import (
    create_expense, get_expense_by_id, get_expenses,
    update_expense, delete_expense, get_categories,
    create_category, get_dashboard_summary, seed_test_data, reset_all_data
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Personal Expense Tracker API",
    description="REST API with SQLite persistence, multi-currency isolation, search, filtering, and monthly summaries.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Health check endpoint confirming API status and database connectivity."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM expenses")
        count = cursor.fetchone()["count"]
    return {
        "status": "healthy",
        "service": "Personal Expense Tracker API",
        "version": "1.0.0",
        "database": "SQLite",
        "expense_count": count
    }

@app.get("/api/categories", response_model=List[CategoryResponse])
def list_categories():
    """Retrieve all available expense categories."""
    with get_db() as conn:
        return get_categories(conn)

@app.post("/api/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(cat: CategoryCreate):
    """Create a new expense category."""
    with get_db() as conn:
        return create_category(conn, cat)

@app.get("/api/expenses", response_model=ExpenseListResponse)
def list_expenses(
    search: Optional[str] = Query(None, description="Search term for description or category"),
    category: Optional[str] = Query(None, description="Filter by exact category"),
    currency: Optional[str] = Query(None, description="Filter by 3-letter currency code (e.g. USD, EUR)"),
    start_date: Optional[str] = Query(None, description="Filter expenses from this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter expenses up to this date (YYYY-MM-DD)"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum expense amount"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum expense amount"),
    sort_by: str = Query("date", description="Sort by field: date, amount, category, description, currency"),
    sort_order: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$", description="Sort direction: asc or desc"),
    limit: int = Query(100, ge=1, le=500, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """Search, filter, and sort expenses."""
    with get_db() as conn:
        items, total_count = get_expenses(
            conn=conn,
            search=search,
            category=category,
            currency=currency,
            start_date=start_date,
            end_date=end_date,
            min_amount=min_amount,
            max_amount=max_amount,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )
        page_count = (total_count + limit - 1) // limit if total_count > 0 else 0
        return {
            "items": items,
            "total_count": total_count,
            "page_count": page_count
        }

@app.post("/api/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def add_expense(expense: ExpenseCreate):
    """Create and persist a new expense record."""
    with get_db() as conn:
        return create_expense(conn, expense)

@app.get("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int):
    """Retrieve an expense by its unique identifier."""
    with get_db() as conn:
        expense = get_expense_by_id(conn, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        return expense

@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def modify_expense(expense_id: int, update_data: ExpenseUpdate):
    """Update an existing expense record with validated fields."""
    with get_db() as conn:
        updated = update_expense(conn, expense_id, update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        return updated

@app.delete("/api/expenses/{expense_id}")
def remove_expense(expense_id: int):
    """Delete an expense record."""
    with get_db() as conn:
        deleted = delete_expense(conn, expense_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        return {"success": True, "deleted_id": expense_id, "message": "Expense successfully deleted"}

@app.get("/api/dashboard", response_model=DashboardSummary)
def dashboard_summary(
    currency: Optional[str] = Query(None, description="Optional currency filter for dashboard"),
    month: Optional[str] = Query(None, description="Optional month filter (YYYY-MM) for dashboard")
):
    """
    Retrieve dashboard statistics, summaries, and monthly totals.
    Guarantees strict multi-currency isolation: currencies are never summed together.
    """
    with get_db() as conn:
        return get_dashboard_summary(conn, filter_currency=currency, filter_month=month)

@app.post("/api/seed")
def seed_data():
    """Seed the database with realistic multi-currency sample expenses for testing and demonstration."""
    with get_db() as conn:
        count = seed_test_data(conn)
        return {
            "success": True,
            "message": f"Successfully seeded {count} sample expense records across multiple currencies",
            "count": count
        }

@app.post("/api/reset")
def reset_database():
    """Clear all expense records for testing purposes."""
    with get_db() as conn:
        reset_all_data(conn)
        return {"success": True, "message": "All expense records have been reset"}
