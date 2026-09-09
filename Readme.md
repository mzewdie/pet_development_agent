# Personal Expense Tracker — Day 1 Developer Onboarding & Architecture Guide

Welcome to the **Personal Expense Tracker** project! This document is designed for any engineer joining the project on **Day 1** to enable immediate, autonomous development, testing, and extension without requiring hand-holding or undocumented local setup steps.

---

## 1. Executive Overview & System Architecture

The Personal Expense Tracker is a full-stack financial record management system with **strict multi-currency isolation**, built using:

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Backend**: Python 3.11, FastAPI, Pydantic v2.
- **Persistence**: SQLite (with WAL mode, foreign keys, and integrity constraints).
- **Communication**: RESTful API over HTTP with JSON schemas.

```
┌───────────────────────────────────────────────────────────┐
│                    Browser Client                         │
│   (React 19 SPA + Tailwind CSS + Lucide React)            │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP / JSON
                              ▼
┌───────────────────────────────────────────────────────────┐
│               Vite Dev Server / Proxy (Port 3000)          │
│   - Serves React assets                                   │
│   - Proxies /api/*, /docs, /openapi.json to port 8001      │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP Reverse Proxy
                              ▼
┌───────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8001)                   │
│   - Pydantic validation (amount, date, currency, etc.)    │
│   - Multi-currency mathematical segregation               │
│   - Search, filter, and sort query engine                 │
└─────────────────────────────┬─────────────────────────────┘
                              │ Direct Thread-Safe Connection
                              ▼
┌───────────────────────────────────────────────────────────┐
│              SQLite Database (expenses.db)                │
│   - Tables: expenses, categories                          │
│   - Constraints: CHECK(amount > 0), CHECK(len(curr)=3)    │
│   - Indices: date, currency, category, amount             │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principle: Multi-Currency Isolation

> [!IMPORTANT]
> **No Blind Currency Aggregation:** A fundamental requirement of this application is that **different currencies are never summed together into an arbitrary single total**. Adding $100 USD to €100 EUR and saying the total is "200" is mathematically invalid and misleading to the user.

- Every expense record stores an explicit 3-letter ISO currency code (`USD`, `EUR`, `GBP`, `CAD`, `JPY`, etc.).
- Summary queries (`/api/dashboard`) compute totals and monthly aggregates **grouped strictly by currency**.
- Visual breakdowns and cards on the dashboard present independent financial metrics for each currency.

---

## 3. Quick Start (Day 1 Developer Workflow)

### Prerequisites

- **Node.js**: v18 or later (Node 20+ recommended)
- **Python**: v3.10 or v3.11
- **SQLite3**: Built into Python standard library

### Initial Setup (One-time)

1. **Clone the repository and enter the directory**:
   ```bash
   cd /path/to/project
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Install Python backend dependencies**:
   ```bash
   python3.11 -m pip install --break-system-packages fastapi uvicorn pydantic pytest httpx
   ```

### Running the Application

You can start the full stack with a single command:

```bash
npm run dev
```

- **Frontend URL**: `http://localhost:3000`
- **Interactive OpenAPI / Swagger Docs**: `http://localhost:3000/docs`
- **API Health Check**: `http://localhost:3000/api/health`

*Note*: During development, Vite automatically launches the FastAPI Python backend process on `http://127.0.0.1:8001` via the custom `fastapiDevPlugin` defined in `vite.config.ts`, and proxies all `/api/*` traffic transparently.

---

## 4. Developer Verification & Testing

Every code change must pass developer verification before committing.

### Running Backend Unit & Integration Tests

Run the complete test suite:

```bash
python3.11 -m pytest tests/ -v
```
or via the npm script:
```bash
npm test
```

The test suite covers:
1. `tests/test_database.py`: Table schema initialization, default categories, and SQLite CHECK constraints.
2. `tests/test_api_crud.py`: Full CRUD flow, status codes (201 Created, 200 OK, 404 Not Found).
3. `tests/test_validation.py`: Rejecting negative amounts, zero amounts, invalid dates, malformed currencies, and missing fields.
4. `tests/test_search_filter_sort.py`: Text search, category filtering, currency filtering, date ranges, and sorting (asc/desc).
5. `tests/test_currencies_and_summary.py`: Verifying multi-currency mathematical isolation and dashboard aggregations.

### Running Frontend Type-Checking & Linting

```bash
npm run lint
```

### Production Build Verification

```bash
npm run build
```

---

## 5. Repository File Structure

```
├── backend/                        # Python / FastAPI backend
│   ├── __init__.py
│   ├── database.py                 # SQLite database setup, connection manager, tables & indices
│   ├── models.py                   # Pydantic validation models for requests and responses
│   ├── crud.py                     # Database query logic (CRUD, filters, aggregations)
│   └── main.py                     # FastAPI routes, CORS, and endpoint handlers
│
├── src/                            # React frontend
│   ├── components/
│   │   ├── Header.tsx              # Navigation bar, brand identity, demo data buttons
│   │   ├── Dashboard.tsx           # Multi-currency financial analytics cards & charts
│   │   ├── ExpenseList.tsx         # Data table, search bar, advanced filter drawer, sorting
│   │   ├── ExpenseModal.tsx        # Accessible dialog for creating and editing expenses
│   │   ├── DeleteModal.tsx         # Safe confirmation modal before record deletion
│   │   └── Toast.tsx               # Non-intrusive feedback notifications
│   ├── api.ts                      # Client-side API client functions with error parsing
│   ├── types.ts                    # TypeScript types, interfaces, and currency utilities
│   ├── App.tsx                     # Main state container and view orchestration
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Tailwind CSS import
│
├── tests/                          # Automated backend test suite
│   ├── test_database.py            # SQLite schema and constraint validation
│   ├── test_api_crud.py            # REST endpoint functional tests
│   ├── test_validation.py          # Edge-case input validation tests
│   ├── test_search_filter_sort.py  # Query filtering and sorting tests
│   └── test_currencies_and_summary.py # Multi-currency isolation tests
│
├── server.ts                       # Production custom server entry point (Express + proxy)
├── vite.config.ts                  # Vite development server configuration and backend runner
├── metadata.json                   # Applet metadata and permission declarations
├── package.json                    # Node dependencies and build scripts
├── Specification_Prompt.md         # Full project specification requirements
└── Readme.md                       # This onboarding and architecture document
```

---

## 6. Database Schema & Data Integrity

The application uses an SQLite file named `expenses.db` (located at the root, or specified via `EXPENSE_DB_PATH`).

### Tables

#### `categories`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | UNIQUE NOT NULL | Category name (e.g. Housing, Groceries) |
| `description` | TEXT | NULLABLE | Human-readable explanation |
| `color` | TEXT | DEFAULT '#64748B' | Hex color code for UI badges |
| `created_at` | TEXT | DEFAULT (datetime('now')) | ISO timestamp |

#### `expenses`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique expense identifier |
| `amount` | REAL | NOT NULL, CHECK(amount > 0) | Positive expense value |
| `currency` | TEXT | NOT NULL, CHECK(length(currency) = 3) | 3-letter currency code |
| `category` | TEXT | NOT NULL | Category name |
| `description` | TEXT | NOT NULL | Expense notes/title |
| `date` | TEXT | NOT NULL, CHECK(length(date) = 10) | YYYY-MM-DD date |
| `created_at` | TEXT | DEFAULT (datetime('now')) | Creation timestamp |
| `updated_at` | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

### Indices
- `idx_expenses_date` on `expenses(date)`
- `idx_expenses_currency` on `expenses(currency)`
- `idx_expenses_category` on `expenses(category)`
- `idx_expenses_amount` on `expenses(amount)`

---

## 7. REST API Reference

### Health & Diagnostics
- `GET /api/health`
  - Returns database status and current expense count.
  - Response: `{"status": "healthy", "service": "Personal Expense Tracker API", "version": "1.0.0", "database": "SQLite", "expense_count": 25}`

### Expense Management
- `GET /api/expenses`
  - Query parameters:
    - `search`: Filter matching description or category.
    - `category`: Exact category filter.
    - `currency`: 3-letter currency code filter.
    - `start_date`: From date (`YYYY-MM-DD`).
    - `end_date`: To date (`YYYY-MM-DD`).
    - `min_amount`: Minimum amount threshold.
    - `max_amount`: Maximum amount threshold.
    - `sort_by`: `date` | `amount` | `category` | `description` | `currency` (default: `date`).
    - `sort_order`: `asc` | `desc` (default: `desc`).
    - `limit`: Number of items (default 100).
    - `offset`: Pagination offset (default 0).
  - Response: `{"items": [...], "total_count": 25, "page_count": 1}`

- `POST /api/expenses` (Status: 201 Created)
  - Body:
    ```json
    {
      "amount": 84.50,
      "currency": "USD",
      "category": "Groceries & Food",
      "description": "Weekly grocery run",
      "date": "2026-09-09"
    }
    ```

- `GET /api/expenses/{id}`
  - Returns the single expense matching the specified ID or 404 if not found.

- `PUT /api/expenses/{id}`
  - Modifies fields of an existing expense. Accepts partial updates for `amount`, `currency`, `category`, `description`, `date`.

- `DELETE /api/expenses/{id}`
  - Permanently removes the expense record from SQLite.

### Categories
- `GET /api/categories`
  - Returns all registered categories.
- `POST /api/categories` (Status: 201 Created)
  - Creates a new custom category (`{"name": "...", "description": "...", "color": "..."}`).

### Dashboard Analytics
- `GET /api/dashboard`
  - Query parameters: optional `currency`, `month`.
  - Returns:
    - `totals_by_currency`: Array of `{currency, total_amount, expense_count}`.
    - `monthly_totals`: Array of `{month, currency, total_amount, expense_count}`.
    - `category_totals`: Array of `{category, currency, total_amount, expense_count, percentage_of_currency}`.
    - `recent_expenses`: 6 most recent records.
    - `total_expense_records`: Total transaction count.
    - `multi_currency_policy`: Confirmation of mathematical isolation.

### Seed & Reset Endpoints
- `POST /api/seed`
  - Clears existing records and seeds realistic multi-currency test expenses spanning USD, EUR, GBP, and JPY across various dates and categories.
- `POST /api/reset`
  - Clears all expenses from SQLite persistence (for fresh clean-slate testing). Resets autoincrement ID sequences.

### Settings & Database Lifecycle Management
- **Settings Modal (`src/components/SettingsModal.tsx`)**: Accessed via the top navigation **Settings** button. Displays live SQLite engine diagnostics (WAL mode, total records, active currencies count, storage health).
- **Empty Database with In-App Confirmation (`src/components/ClearConfirmModal.tsx`)**: An in-app dialog (avoiding standard browser alerts that can be blocked in iframes) requiring explicit user confirmation before wiping transaction history.
- **On-Demand Demo Seeding**: Allows populating realistic multi-currency sample expenses at any time without unsolicited background resets.
- **Full CRUD Support**: Complete UI controls for Creating, Reading, Updating, and Deleting expenses from both table and dashboard views.

---

## 8. Key Developer Skills & Recommended Knowledge Links

If you are unfamiliar with any of the core libraries or design patterns used in this codebase, consult these recommended resources:

### 1. FastAPI & Pydantic v2
- **Why needed**: Backend routes, validation models (`Field`, `field_validator`), and OpenAPI generation.
- **Recommended Link**: [FastAPI Official Tutorial](https://fastapi.tiangolo.com/tutorial/) & [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/)

### 2. SQLite Architecture & Thread Safety
- **Why needed**: To understand SQLite WAL mode, CHECK constraints, connection pooling with `check_same_thread=False`, and PRAGMAs.
- **Recommended Link**: [SQLite Official Documentation](https://www.sqlite.org/docs.html) & [Python sqlite3 Module Guide](https://docs.python.org/3/library/sqlite3.html)

### 3. Starlette & Pytest TestClient
- **Why needed**: Writing synchronous API integration tests against FastAPI without needing an active live network port.
- **Recommended Link**: [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/) & [Pytest Documentation](https://docs.pytest.org/en/stable/)

### 4. React 19 & Functional State Patterns
- **Why needed**: Managing state with hooks (`useState`, `useEffect`, `useCallback`), optimistic UI updates, and modal dialogues.
- **Recommended Link**: [React Official Documentation](https://react.dev/)

### 5. Tailwind CSS Utility Styling
- **Why needed**: Styling components consistently using responsive prefixes (`sm:`, `md:`, `lg:`) and color palettes.
- **Recommended Link**: [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 6. Reverse Proxy & Child Process Management
- **Why needed**: Understanding how `vite.config.ts` and `server.ts` spawn the Python backend and route `/api/*` traffic via `http-proxy-middleware`.
- **Recommended Link**: [Vite Server Proxy Configuration](https://vite.dev/config/server-options.html#server-proxy) & [Node.js child_process documentation](https://nodejs.org/api/child_process.html)

---

## 9. Common Tasks for Day 1

### How do I add a new expense field (e.g. `payment_method` or `receipt_url`)?
1. **Update SQLite schema** in `backend/database.py`:
   Add the column to `CREATE TABLE IF NOT EXISTS expenses (...)` or run an `ALTER TABLE` query.
2. **Update Pydantic models** in `backend/models.py`:
   Add the field to `ExpenseBase` and `ExpenseUpdate`.
3. **Update CRUD methods** in `backend/crud.py`:
   Include the new field in `create_expense`, `update_expense`, and `get_expenses` queries.
4. **Update TypeScript types** in `src/types.ts`:
   Add the field to `Expense` and `ExpenseInput`.
5. **Update Frontend UI** in `src/components/ExpenseModal.tsx` and `src/components/ExpenseList.tsx`.
6. **Update Automated Tests** in `tests/test_api_crud.py`.

### How do I add a new currency symbol?
Open `src/types.ts` and add the currency to `SUPPORTED_CURRENCIES` with its 3-letter code, display symbol, and full label.

---

## 10. Summary Checklist for Pull Requests

Before submitting your changes:
- [ ] Automated tests pass: `python3.11 -m pytest tests/ -v`
- [ ] TypeScript linter succeeds: `npm run lint`
- [ ] Production build compiles: `npm run build`
- [ ] Multi-currency totals remain strictly separated (no blind aggregate sums)
- [ ] Documentation updated if REST endpoints changed
