"""
SQLite Database Connection and Initialization for Personal Expense Tracker.
"""

import os
import sqlite3
from typing import Generator, Optional
from contextlib import contextmanager

# Database file location can be overridden via environment variable
DB_PATH = os.environ.get("EXPENSE_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "expenses.db"))

DEFAULT_CATEGORIES = [
    ("Housing", "Home rent, mortgage, maintenance, repairs", "#3B82F6"),
    ("Groceries & Food", "Supermarket, dining out, coffee, groceries", "#10B981"),
    ("Transportation", "Public transit, fuel, rideshare, parking", "#F59E0B"),
    ("Utilities", "Electricity, water, gas, internet, mobile", "#6366F1"),
    ("Healthcare & Medical", "Doctor, pharmacy, health insurance, fitness", "#EC4899"),
    ("Entertainment & Leisure", "Movies, games, subscriptions, streaming", "#8B5CF6"),
    ("Shopping & Clothing", "Apparel, electronics, personal care", "#14B8A6"),
    ("Travel & Vacation", "Flights, hotels, tourism, car rental", "#F97316"),
    ("Education & Books", "Courses, tuition, textbooks, training", "#06B6D4"),
    ("General & Miscellaneous", "Other miscellaneous personal expenses", "#64748B"),
]

def get_db_path() -> str:
    return os.environ.get("EXPENSE_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "expenses.db"))

def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Creates a new SQLite database connection with row factory enabled."""
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

@contextmanager
def get_db(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    """Context manager for obtaining a database connection safely."""
    target_path = db_path or get_db_path()
    conn = get_db_connection(target_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: str = DB_PATH) -> None:
    """Initializes the SQLite tables for expenses and categories."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    with get_db(db_path) as conn:
        cursor = conn.cursor()
        
        # Categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#64748B',
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        
        # Expenses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL CHECK(amount > 0),
                currency TEXT NOT NULL DEFAULT 'EUR' CHECK(length(currency) = 3),
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL CHECK(length(date) = 10),
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Indices for optimal query performance on filtering and sorting
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount)")

        # Seed default categories if empty
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        if cursor.fetchone()["count"] == 0:
            cursor.executemany(
                "INSERT INTO categories (name, description, color) VALUES (?, ?, ?)",
                DEFAULT_CATEGORIES
            )

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
