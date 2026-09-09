export interface Expense {
  id: number;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
}

export interface CurrencyTotal {
  currency: string;
  total_amount: number;
  expense_count: number;
}

export interface MonthlyCurrencyTotal {
  month: string;
  currency: string;
  total_amount: number;
  expense_count: number;
}

export interface CategoryCurrencyTotal {
  category: string;
  currency: string;
  total_amount: number;
  expense_count: number;
  percentage_of_currency?: number;
}

export interface DashboardSummary {
  totals_by_currency: CurrencyTotal[];
  monthly_totals: MonthlyCurrencyTotal[];
  category_totals: CategoryCurrencyTotal[];
  recent_expenses: Expense[];
  total_expense_records: number;
  available_currencies: string[];
  available_categories: string[];
  multi_currency_policy: string;
}

export interface ExpenseFilterParams {
  search?: string;
  category?: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number | '';
  max_amount?: number | '';
  sort_by?: 'date' | 'amount' | 'category' | 'description' | 'currency';
  sort_order?: 'asc' | 'desc';
}

export interface ExpenseListResponse {
  items: Expense[];
  total_count: number;
  page_count: number;
}

export const DEFAULT_CURRENCY = 'EUR';

export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'SGD', symbol: 'SG$', label: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
];

export function getCurrencySymbol(code: string): string {
  const match = SUPPORTED_CURRENCIES.find(c => c.code === code.toUpperCase());
  return match ? match.symbol : code;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
