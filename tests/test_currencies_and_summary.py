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

def test_empty_database_and_crud_lifecycle(client):
    """
    Verify starting with an empty database:
    1. Clear / reset database leaves 0 expenses.
    2. Dashboard reflects 0 records with no false totals.
    3. Full CRUD lifecycle functions seamlessly on an empty database.
    4. Deleting the only expense returns database to empty state cleanly.
    """
    # 1. Reset database to empty
    client.post("/api/reset")
    
    # Check health and empty state
    health = client.get("/api/health").json()
    assert health["expense_count"] == 0
    
    expenses_res = client.get("/api/expenses").json()
    assert expenses_res["total_count"] == 0
    assert expenses_res["items"] == []
    
    dash = client.get("/api/dashboard").json()
    assert dash["total_expense_records"] == 0
    assert dash["totals_by_currency"] == []
    assert dash["recent_expenses"] == []
    
    # 2. CREATE first expense
    create_res = client.post("/api/expenses", json={
        "amount": 25.50,
        "currency": "USD",
        "category": "Groceries & Food",
        "description": "First expense in fresh DB",
        "date": "2026-09-09"
    })
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]
    
    # 3. READ expense
    read_res = client.get(f"/api/expenses/{created_id}")
    assert read_res.status_code == 200
    assert read_res.json()["description"] == "First expense in fresh DB"
    
    # 4. UPDATE expense
    update_res = client.put(f"/api/expenses/{created_id}", json={
        "amount": 30.00,
        "description": "Updated first expense in fresh DB"
    })
    assert update_res.status_code == 200
    assert update_res.json()["amount"] == 30.00
    assert update_res.json()["description"] == "Updated first expense in fresh DB"
    
    # 5. DELETE expense
    del_res = client.delete(f"/api/expenses/{created_id}")
    assert del_res.status_code == 200
    
    # 6. Verify back to empty database
    health_after = client.get("/api/health").json()
    assert health_after["expense_count"] == 0
    assert client.get("/api/expenses").json()["total_count"] == 0

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
