"""
Pydantic Models and Request/Response Schemas for Personal Expense Tracker.
"""

from datetime import datetime, date
import re
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

SUPPORTED_CURRENCIES = {
    "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "NZD", "SGD", "BRL", "MXN", "ZAR", "SEK", "NOK"
}

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Category name")
    description: Optional[str] = Field(None, max_length=200, description="Optional category description")
    color: Optional[str] = Field("#64748B", pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", description="Hex color")

class CategoryCreate(CategoryBase):
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Category name cannot be blank")
        return trimmed

class CategoryResponse(CategoryBase):
    id: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount (must be strictly positive)")
    currency: str = Field(..., min_length=3, max_length=3, description="3-letter ISO currency code, e.g. USD, EUR, GBP")
    category: str = Field(..., min_length=1, max_length=100, description="Expense category")
    description: str = Field(..., min_length=1, max_length=255, description="Description of the expense")
    date: str = Field(..., description="Date in YYYY-MM-DD format")

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        code = v.strip().upper()
        if not re.match(r"^[A-Z]{3}$", code):
            raise ValueError("Currency must be a 3-letter alphabetic code (e.g., USD, EUR)")
        return code

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Description cannot be empty or only whitespace")
        return trimmed

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Category cannot be empty or only whitespace")
        return trimmed

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        v = v.strip()
        try:
            parsed = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Date must be a valid calendar date in YYYY-MM-DD format")
        # Ensure year is reasonable
        if parsed.year < 1900 or parsed.year > 2100:
            raise ValueError("Date year must be between 1900 and 2100")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        if v > 100_000_000:
            raise ValueError("Amount exceeds maximum supported limit (100,000,000)")
        return round(v, 2)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[str] = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        code = v.strip().upper()
        if not re.match(r"^[A-Z]{3}$", code):
            raise ValueError("Currency must be a 3-letter alphabetic code (e.g., USD, EUR)")
        return code

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Description cannot be empty or only whitespace")
        return trimmed

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Category cannot be empty or only whitespace")
        return trimmed

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        try:
            parsed = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Date must be a valid calendar date in YYYY-MM-DD format")
        if parsed.year < 1900 or parsed.year > 2100:
            raise ValueError("Date year must be between 1900 and 2100")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        if v > 100_000_000:
            raise ValueError("Amount exceeds maximum supported limit (100,000,000)")
        return round(v, 2)

class ExpenseResponse(ExpenseBase):
    id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total_count: int
    page_count: int

class CurrencyTotal(BaseModel):
    currency: str
    total_amount: float
    expense_count: int

class MonthlyCurrencyTotal(BaseModel):
    month: str  # YYYY-MM
    currency: str
    total_amount: float
    expense_count: int

class CategoryCurrencyTotal(BaseModel):
    category: str
    currency: str
    total_amount: float
    expense_count: int
    percentage_of_currency: Optional[float] = 0.0

class DashboardSummary(BaseModel):
    totals_by_currency: List[CurrencyTotal]
    monthly_totals: List[MonthlyCurrencyTotal]
    category_totals: List[CategoryCurrencyTotal]
    recent_expenses: List[ExpenseResponse]
    total_expense_records: int
    available_currencies: List[str]
    available_categories: List[str]
    multi_currency_policy: str = (
        "Multi-Currency Isolation: Totals and summaries are grouped strictly by currency. "
        "Currencies are never treated as interchangeable or mathematically summed without explicit conversion."
    )
