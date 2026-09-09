"""
Tests for Searching, Filtering, and Sorting Expenses.
"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import init_db
import backend.database as db_mod

@pytest.fixture
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    old_env = os.environ.get("EXPENSE_DB_PATH")
    os.environ["EXPENSE_DB_PATH"] = path
    init_db(path)
    
    with TestClient(app) as test_client:
        # Populate known data
        test_client.post("/api/expenses", json={"amount": 10.0, "currency": "USD", "category": "Groceries & Food", "description": "Apple & Banana", "date": "2026-09-01"})
        test_client.post("/api/expenses", json={"amount": 50.0, "currency": "USD", "category": "Transportation", "description": "Gasoline fuel refill", "date": "2026-09-03"})
        test_client.post("/api/expenses", json={"amount": 120.0, "currency": "EUR", "category": "Housing", "description": "Apartment repairs", "date": "2026-09-05"})
        test_client.post("/api/expenses", json={"amount": 35.0, "currency": "GBP", "category": "Entertainment & Leisure", "description": "Concert ticket", "date": "2026-08-20"})
        yield test_client
        
    if old_env is not None:
        os.environ["EXPENSE_DB_PATH"] = old_env
    else:
        os.environ.pop("EXPENSE_DB_PATH", None)
    if os.path.exists(path):
        os.remove(path)

def test_search_by_description(client):
    """Verify text search matches descriptions."""
    res = client.get("/api/expenses?search=fuel")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 1
    assert "Gasoline fuel refill" in data["items"][0]["description"]

def test_filter_by_currency(client):
    """Verify filtering by currency code."""
    res = client.get("/api/expenses?currency=EUR")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 1
    assert data["items"][0]["currency"] == "EUR"

def test_filter_by_category(client):
    """Verify filtering by category."""
    res = client.get("/api/expenses?category=Transportation")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 1
    assert data["items"][0]["category"] == "Transportation"

def test_filter_by_date_range(client):
    """Verify filtering expenses within a date interval."""
    res = client.get("/api/expenses?start_date=2026-09-01&end_date=2026-09-04")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 2
    dates = [item["date"] for item in data["items"]]
    assert all("2026-09-01" <= d <= "2026-09-04" for d in dates)

def test_sort_by_amount_asc_and_desc(client):
    """Verify sorting by amount in ascending and descending directions."""
    res_desc = client.get("/api/expenses?sort_by=amount&sort_order=desc")
    assert res_desc.status_code == 200
    items_desc = res_desc.json()["items"]
    amounts_desc = [i["amount"] for i in items_desc]
    assert amounts_desc == sorted(amounts_desc, reverse=True)

    res_asc = client.get("/api/expenses?sort_by=amount&sort_order=asc")
    assert res_asc.status_code == 200
    items_asc = res_asc.json()["items"]
    amounts_asc = [i["amount"] for i in items_asc]
    assert amounts_asc == sorted(amounts_asc)
