"""
Tests for Multi-Currency Isolation, Dashboard Summaries, and Data Seeding.
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
        yield test_client
        
    if old_env is not None:
        os.environ["EXPENSE_DB_PATH"] = old_env
    else:
        os.environ.pop("EXPENSE_DB_PATH", None)
    if os.path.exists(path):
        os.remove(path)

def test_seed_and_reset_data(client):
    """Verify seeding test data populates expenses and reset clears them."""
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    assert seed_res.json()["count"] > 0

    health_res = client.get("/api/health")
    assert health_res.json()["expense_count"] > 0

    reset_res = client.post("/api/reset")
    assert reset_res.status_code == 200

    health_empty = client.get("/api/health")
    assert health_empty.json()["expense_count"] == 0

def test_multi_currency_isolation(client):
    """
    CRITICAL REQUIREMENT:
    Where totals involve multiple currencies, do not present a mathematically
    misleading aggregate as though currencies were interchangeable.
    """
    # Insert 100 USD, 50 USD, 200 EUR, 50 GBP
    client.post("/api/expenses", json={"amount": 100.0, "currency": "USD", "category": "Groceries & Food", "description": "USD 1", "date": "2026-09-01"})
    client.post("/api/expenses", json={"amount": 50.0, "currency": "USD", "category": "Housing", "description": "USD 2", "date": "2026-09-02"})
    client.post("/api/expenses", json={"amount": 200.0, "currency": "EUR", "category": "Travel & Vacation", "description": "EUR 1", "date": "2026-09-03"})
    client.post("/api/expenses", json={"amount": 50.0, "currency": "GBP", "category": "Transportation", "description": "GBP 1", "date": "2026-09-04"})

    res = client.get("/api/dashboard")
    assert res.status_code == 200
    dash = res.json()

    totals_by_curr = {item["currency"]: item["total_amount"] for item in dash["totals_by_currency"]}
    
    # Check separate totals
    assert totals_by_curr["USD"] == 150.0
    assert totals_by_curr["EUR"] == 200.0
    assert totals_by_curr["GBP"] == 50.0

    # Ensure no combined single aggregate sums them into 400 without currency separation
    assert "Multi-Currency Isolation" in dash["multi_currency_policy"]
    
    # Check monthly totals are also segregated by currency
    for mt in dash["monthly_totals"]:
        assert mt["currency"] in {"USD", "EUR", "GBP"}
        assert mt["month"] == "2026-09"

    # Check category totals are segregated by currency
    for ct in dash["category_totals"]:
        assert ct["currency"] in {"USD", "EUR", "GBP"}
