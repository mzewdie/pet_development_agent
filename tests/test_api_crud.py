"""
API Integration Tests for Expense CRUD Endpoints.
"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import init_db, DB_PATH
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

def test_health_check(client):
    """Verify health check endpoint returns 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "SQLite"

def test_create_and_get_expense(client):
    """Verify complete creation and retrieval of an expense."""
    payload = {
        "amount": 125.75,
        "currency": "USD",
        "category": "Groceries & Food",
        "description": "Weekly organic vegetables and groceries",
        "date": "2026-09-08"
    }
    create_res = client.post("/api/expenses", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["id"] is not None
    assert created["amount"] == 125.75
    assert created["currency"] == "USD"
    assert created["category"] == "Groceries & Food"
    assert created["description"] == "Weekly organic vegetables and groceries"
    assert created["date"] == "2026-09-08"

    # Get by ID
    get_res = client.get(f"/api/expenses/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == created["id"]

def test_update_expense(client):
    """Verify modifying an existing expense."""
    create_res = client.post("/api/expenses", json={
        "amount": 50.00,
        "currency": "EUR",
        "category": "Transportation",
        "description": "Bus ticket",
        "date": "2026-09-05"
    })
    exp_id = create_res.json()["id"]

    # Update amount and description
    update_res = client.put(f"/api/expenses/{exp_id}", json={
        "amount": 65.50,
        "description": "Train ticket to Lyon"
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["amount"] == 65.50
    assert updated["description"] == "Train ticket to Lyon"
    assert updated["currency"] == "EUR"  # Unchanged

def test_delete_expense(client):
    """Verify deleting an expense and handling subsequent 404."""
    create_res = client.post("/api/expenses", json={
        "amount": 25.00,
        "currency": "GBP",
        "category": "Entertainment & Leisure",
        "description": "Cinema ticket",
        "date": "2026-09-02"
    })
    exp_id = create_res.json()["id"]

    del_res = client.delete(f"/api/expenses/{exp_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Check 404 on deleted
    get_res = client.get(f"/api/expenses/{exp_id}")
    assert get_res.status_code == 404

def test_nonexistent_expense_404(client):
    """Verify 404 on nonexistent expense ID."""
    res = client.get("/api/expenses/99999")
    assert res.status_code == 404
    del_res = client.delete("/api/expenses/99999")
    assert del_res.status_code == 404
