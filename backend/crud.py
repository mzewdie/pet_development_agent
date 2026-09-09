"""
CRUD Operations for Personal Expense Tracker using SQLite.
"""

import sqlite3
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, date, timedelta
from backend.models import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    CategoryCreate, CategoryResponse,
    CurrencyTotal, MonthlyCurrencyTotal, CategoryCurrencyTotal, DashboardSummary
)

def create_expense(conn: sqlite3.Connection, expense: ExpenseCreate) -> Dict[str, Any]:
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO expenses (amount, currency, category, description, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (expense.amount, expense.currency, expense.category, expense.description, expense.date, now, now))
    expense_id = cursor.lastrowid
    
    # Also ensure category exists in categories table if new
    cursor.execute("SELECT id FROM categories WHERE name = ?", (expense.category,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (expense.category,))
        
    return get_expense_by_id(conn, expense_id)

def get_expense_by_id(conn: sqlite3.Connection, expense_id: int) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return dict(row)

def get_expenses(
    conn: sqlite3.Connection,
    search: Optional[str] = None,
    category: Optional[str] = None,
    currency: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0
) -> Tuple[List[Dict[str, Any]], int]:
    cursor = conn.cursor()
    
    query = "SELECT * FROM expenses WHERE 1=1"
    count_query = "SELECT COUNT(*) as cnt FROM expenses WHERE 1=1"
    params: List[Any] = []
    count_params: List[Any] = []

    if search:
        search_pattern = f"%{search.strip()}%"
        query += " AND (description LIKE ? OR category LIKE ?)"
        count_query += " AND (description LIKE ? OR category LIKE ?)"
        params.extend([search_pattern, search_pattern])
        count_params.extend([search_pattern, search_pattern])

    if category:
        query += " AND category = ?"
        count_query += " AND category = ?"
        params.append(category.strip())
        count_params.append(category.strip())

    if currency:
        query += " AND currency = ?"
        count_query += " AND currency = ?"
        params.append(currency.strip().upper())
        count_params.append(currency.strip().upper())

    if start_date:
        query += " AND date >= ?"
        count_query += " AND date >= ?"
        params.append(start_date)
        count_params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        count_query += " AND date <= ?"
        params.append(end_date)
        count_params.append(end_date)

    if min_amount is not None:
        query += " AND amount >= ?"
        count_query += " AND amount >= ?"
        params.append(min_amount)
        count_params.append(min_amount)

    if max_amount is not None:
        query += " AND amount <= ?"
        count_query += " AND amount <= ?"
        params.append(max_amount)
        count_params.append(max_amount)

    # Allowed sort columns to prevent SQL injection
    valid_sort_cols = {
        "date": "date",
        "amount": "amount",
        "category": "category",
        "description": "description",
        "currency": "currency",
        "created_at": "created_at"
    }
    col = valid_sort_cols.get(sort_by.lower(), "date")
    order = "ASC" if sort_order.lower() == "asc" else "DESC"

    query += f" ORDER BY {col} {order}, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()["cnt"]

    cursor.execute(query, params)
    rows = cursor.fetchall()
    return [dict(row) for row in rows], total_count

def update_expense(conn: sqlite3.Connection, expense_id: int, update_data: ExpenseUpdate) -> Optional[Dict[str, Any]]:
    existing = get_expense_by_id(conn, expense_id)
    if not existing:
        return None

    update_fields = []
    params = []
    
    if update_data.amount is not None:
        update_fields.append("amount = ?")
        params.append(update_data.amount)
    if update_data.currency is not None:
        update_fields.append("currency = ?")
        params.append(update_data.currency)
    if update_data.category is not None:
        update_fields.append("category = ?")
        params.append(update_data.category)
    if update_data.description is not None:
        update_fields.append("description = ?")
        params.append(update_data.description)
    if update_data.date is not None:
        update_fields.append("date = ?")
        params.append(update_data.date)

    if not update_fields:
        return existing

    update_fields.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    params.append(expense_id)

    query = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = ?"
    cursor = conn.cursor()
    cursor.execute(query, params)

    # Ensure category exists in categories table
    if update_data.category:
        cursor.execute("SELECT id FROM categories WHERE name = ?", (update_data.category,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (update_data.category,))

    return get_expense_by_id(conn, expense_id)

def delete_expense(conn: sqlite3.Connection, expense_id: int) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    return cursor.rowcount > 0

def get_categories(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name ASC")
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

def create_category(conn: sqlite3.Connection, cat: CategoryCreate) -> Dict[str, Any]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE name = ?", (cat.name,))
    existing = cursor.fetchone()
    if existing:
        return dict(existing)
    
    cursor.execute(
        "INSERT INTO categories (name, description, color) VALUES (?, ?, ?)",
        (cat.name, cat.description, cat.color or "#64748B")
    )
    cat_id = cursor.lastrowid
    cursor.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
    return dict(cursor.fetchone())

def get_dashboard_summary(
    conn: sqlite3.Connection,
    filter_currency: Optional[str] = None,
    filter_month: Optional[str] = None
) -> Dict[str, Any]:
    cursor = conn.cursor()

    # 1. Total expenses count
    cursor.execute("SELECT COUNT(*) as count FROM expenses")
    total_records = cursor.fetchone()["count"]

    # 2. Distinct currencies
    cursor.execute("SELECT DISTINCT currency FROM expenses ORDER BY currency ASC")
    distinct_currencies = [r["currency"] for r in cursor.fetchall()]

    # 3. Distinct categories
    cursor.execute("SELECT DISTINCT category FROM expenses ORDER BY category ASC")
    distinct_categories = [r["category"] for r in cursor.fetchall()]

    # Base WHERE filters for summaries if requested
    where_clauses = ["1=1"]
    where_params: List[Any] = []
    if filter_currency:
        where_clauses.append("currency = ?")
        where_params.append(filter_currency.strip().upper())
    if filter_month:
        where_clauses.append("substr(date, 1, 7) = ?")
        where_params.append(filter_month.strip())
        
    where_str = " AND ".join(where_clauses)

    # 4. Totals strictly by currency (never summed together)
    cursor.execute(f"""
        SELECT currency, ROUND(SUM(amount), 2) as total_amount, COUNT(*) as expense_count
        FROM expenses
        WHERE {where_str}
        GROUP BY currency
        ORDER BY total_amount DESC
    """, where_params)
    totals_by_curr = [dict(r) for r in cursor.fetchall()]

    # Compute lookup of total per currency for percentage calculations
    currency_total_map = {item["currency"]: item["total_amount"] for item in totals_by_curr}

    # 5. Monthly totals strictly separated by month and currency
    cursor.execute(f"""
        SELECT substr(date, 1, 7) as month, currency, ROUND(SUM(amount), 2) as total_amount, COUNT(*) as expense_count
        FROM expenses
        WHERE {where_str}
        GROUP BY month, currency
        ORDER BY month DESC, currency ASC
    """, where_params)
    monthly_totals = [dict(r) for r in cursor.fetchall()]

    # 6. Category totals strictly separated by category and currency
    cursor.execute(f"""
        SELECT category, currency, ROUND(SUM(amount), 2) as total_amount, COUNT(*) as expense_count
        FROM expenses
        WHERE {where_str}
        GROUP BY category, currency
        ORDER BY total_amount DESC
    """, where_params)
    cat_rows = cursor.fetchall()
    category_totals = []
    for r in cat_rows:
        item = dict(r)
        curr_total = currency_total_map.get(item["currency"], 0)
        item["percentage_of_currency"] = round((item["total_amount"] / curr_total * 100), 1) if curr_total > 0 else 0.0
        category_totals.append(item)

    # 7. Recent expenses
    cursor.execute("""
        SELECT * FROM expenses
        ORDER BY date DESC, id DESC
        LIMIT 6
    """)
    recent_expenses = [dict(r) for r in cursor.fetchall()]

    return {
        "totals_by_currency": totals_by_curr,
        "monthly_totals": monthly_totals,
        "category_totals": category_totals,
        "recent_expenses": recent_expenses,
        "total_expense_records": total_records,
        "available_currencies": distinct_currencies,
        "available_categories": distinct_categories,
        "multi_currency_policy": (
            "Multi-Currency Isolation: Totals and summaries are grouped strictly by currency. "
            "Currencies are never treated as interchangeable or mathematically summed without explicit conversion."
        )
    }

def seed_test_data(conn: sqlite3.Connection) -> int:
    """Inserts a realistic set of multi-currency test expenses across dates and categories."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses")
    
    # Calculate dates relative to today for realistic and consistent testing
    today = date.today()
    d0 = today.strftime("%Y-%m-%d")
    d1 = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    d2 = (today - timedelta(days=3)).strftime("%Y-%m-%d")
    d3 = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    d4 = (today - timedelta(days=12)).strftime("%Y-%m-%d")
    d5 = (today - timedelta(days=20)).strftime("%Y-%m-%d")
    d6 = (today - timedelta(days=35)).strftime("%Y-%m-%d")
    d7 = (today - timedelta(days=45)).strftime("%Y-%m-%d")
    d8 = (today - timedelta(days=60)).strftime("%Y-%m-%d")

    sample_expenses = [
        # USD Expenses
        (1200.00, "USD", "Housing", "Monthly Apartment Rent", d6),
        (1200.00, "USD", "Housing", "Monthly Apartment Rent", d3),
        (84.50, "USD", "Groceries & Food", "Trader Joe's Weekly Grocery Shopping", d1),
        (42.80, "USD", "Groceries & Food", "Dinner with Colleagues at Italian Bistro", d0),
        (15.75, "USD", "Entertainment & Leisure", "Streaming Services Monthly Subscription", d2),
        (65.00, "USD", "Transportation", "Subway Metrocard Monthly Refill", d4),
        (120.00, "USD", "Utilities", "High-speed Fiber Internet & Electric Bill", d5),
        (35.90, "USD", "Shopping & Clothing", "Ergonomic Desk Accessories", d3),
        
        # EUR Expenses (Explicitly separate currency)
        (75.50, "EUR", "Groceries & Food", "Supermarché Bio Weekly Provisions", d1),
        (45.00, "EUR", "Transportation", "Regional Train Ticket to Munich", d2),
        (180.00, "EUR", "Travel & Vacation", "Boutique Hotel Accommodation", d5),
        (24.99, "EUR", "Education & Books", "Python Architecture & System Design Book", d4),
        (32.00, "EUR", "Entertainment & Leisure", "Art Museum Entry & Audio Guide", d7),

        # GBP Expenses (Explicitly separate currency)
        (38.50, "GBP", "Groceries & Food", "M&S Food Weekly Treats & Produce", d2),
        (12.40, "GBP", "Transportation", "London Underground Commute", d1),
        (55.00, "GBP", "Healthcare & Medical", "Prescription & Pharmacy Vitamins", d4),
        (95.00, "GBP", "Shopping & Clothing", "Winter Rain Jacket & Umbrella", d8),

        # JPY Expenses
        (3200.00, "JPY", "Groceries & Food", "Tokyo Ramen Dinner & Gyoza", d0),
        (12500.00, "JPY", "Travel & Vacation", "Ryokan Hot Springs Day Pass", d6),
    ]

    now = datetime.utcnow().isoformat()
    cursor.executemany("""
        INSERT INTO expenses (amount, currency, category, description, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [(amt, curr, cat, desc, dt, now, now) for amt, curr, cat, desc, dt in sample_expenses])

    return len(sample_expenses)

def reset_all_data(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='expenses'")
