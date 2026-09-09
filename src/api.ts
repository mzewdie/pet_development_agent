import {
  Expense,
  ExpenseInput,
  ExpenseListResponse,
  ExpenseFilterParams,
  Category,
  DashboardSummary
} from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else {
          errorDetail = String(errJson.detail);
        }
      } else if (errJson.error) {
        errorDetail = String(errJson.error);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; expense_count: number }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function fetchExpenses(params: ExpenseFilterParams = {}): Promise<ExpenseListResponse> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.currency && params.currency !== 'all') query.set('currency', params.currency);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (params.min_amount !== undefined && params.min_amount !== '') query.set('min_amount', String(params.min_amount));
  if (params.max_amount !== undefined && params.max_amount !== '') query.set('max_amount', String(params.max_amount));
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_order) query.set('sort_order', params.sort_order);

  const res = await fetch(`${API_BASE}/expenses?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchExpense(id: number): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${id}`);
  return handleResponse(res);
}

export async function createExpense(data: ExpenseInput): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateExpense(id: number, data: Partial<ExpenseInput>): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteExpense(id: number): Promise<{ success: boolean; deleted_id: number }> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  return handleResponse(res);
}

export async function createCategory(name: string, description?: string, color?: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, color }),
  });
  return handleResponse(res);
}

export async function fetchDashboard(currency?: string, month?: string): Promise<DashboardSummary> {
  const query = new URLSearchParams();
  if (currency && currency !== 'all') query.set('currency', currency);
  if (month && month !== 'all') query.set('month', month);

  const res = await fetch(`${API_BASE}/dashboard?${query.toString()}`);
  return handleResponse(res);
}

export async function seedTestData(): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
  });
  return handleResponse(res);
}

export async function resetExpenses(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
  });
  return handleResponse(res);
}
