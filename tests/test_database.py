"""
Unit Tests for Database Initialization and Constraints.
"""

import os
import tempfile
import sqlite3
import pytest
from backend.database import init_db, get_db

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)

def test_database_initialization(temp_db):
    """Verify that tables and indices are created successfully."""
    with get_db(temp_db) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row["name"] for row in cursor.fetchall()}
        assert "expenses" in tables
        assert "categories" in tables

        # Verify indices
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indices = {row["name"] for row in cursor.fetchall()}
        assert "idx_expenses_date" in indices
        assert "idx_expenses_currency" in indices
        assert "idx_expenses_category" in indices

def test_default_categories_seeded(temp_db):
    """Verify default categories are populated on fresh database."""
    with get_db(temp_db) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        count = cursor.fetchone()["count"]
        assert count >= 10

def test_amount_check_constraint(temp_db):
    """Verify SQLite CHECK constraint rejects negative or zero amount."""
    with pytest.raises(sqlite3.IntegrityError):
        with get_db(temp_db) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO expenses (amount, currency, category, description, date)
                VALUES (-10.0, 'USD', 'Housing', 'Test', '2026-09-01')
            """)

def test_currency_length_constraint(temp_db):
    """Verify SQLite CHECK constraint rejects currency code with length != 3."""
    with pytest.raises(sqlite3.IntegrityError):
        with get_db(temp_db) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO expenses (amount, currency, category, description, date)
                VALUES (50.0, 'US', 'Housing', 'Test', '2026-09-01')
            """)
