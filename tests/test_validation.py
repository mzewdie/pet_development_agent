"""
Validation Tests for Input Data and Edge Cases.
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

def test_negative_or_zero_amount_rejected(client):
    """Verify negative and zero amounts return 422 Unprocessable Entity."""
    res_zero = client.post("/api/expenses", json={
        "amount": 0.0,
        "currency": "USD",
        "category": "Housing",
        "description": "Zero test",
        "date": "2026-09-01"
    })
    assert res_zero.status_code == 422

    res_neg = client.post("/api/expenses", json={
        "amount": -50.0,
        "currency": "USD",
        "category": "Housing",
        "description": "Negative test",
        "date": "2026-09-01"
    })
    assert res_neg.status_code == 422

def test_invalid_date_format_rejected(client):
    """Verify invalid date strings return 422."""
    res_bad_format = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "USD",
        "category": "Housing",
        "description": "Invalid date test",
        "date": "09-01-2026"  # Not YYYY-MM-DD
    })
    assert res_bad_format.status_code == 422

    res_impossible_date = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "USD",
        "category": "Housing",
        "description": "Impossible date test",
        "date": "2026-02-31"  # Invalid calendar day
    })
    assert res_impossible_date.status_code == 422

def test_invalid_currency_rejected(client):
    """Verify currency codes that are not 3 uppercase letters return 422."""
    res_short = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "US",
        "category": "Housing",
        "description": "Short currency test",
        "date": "2026-09-01"
    })
    assert res_short.status_code == 422

    res_numbers = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "123",
        "category": "Housing",
        "description": "Numeric currency test",
        "date": "2026-09-01"
    })
    assert res_numbers.status_code == 422

def test_empty_or_whitespace_strings_rejected(client):
    """Verify empty description and whitespace-only description are rejected."""
    res_empty_desc = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "USD",
        "category": "Housing",
        "description": "   ",
        "date": "2026-09-01"
    })
    assert res_empty_desc.status_code == 422

    res_empty_cat = client.post("/api/expenses", json={
        "amount": 100.0,
        "currency": "USD",
        "category": "",
        "description": "Valid description",
        "date": "2026-09-01"
    })
    assert res_empty_cat.status_code == 422

def test_missing_required_fields(client):
    """Verify omitting any required field returns 422."""
    res = client.post("/api/expenses", json={
        "amount": 50.0
    })
    assert res.status_code == 422
