import React, { useState } from 'react';
import {
  Expense,
  ExpenseFilterParams,
  formatCurrency,
  getCurrencySymbol,
  Category
} from '../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  X,
  Edit2,
  Trash2,
  Coins,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  totalCount: number;
  isLoading: boolean;
  filters: ExpenseFilterParams;
  onFilterChange: (newFilters: Partial<ExpenseFilterParams>) => void;
  onResetFilters: () => void;
  categories: Category[];
  availableCurrencies: string[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onOpenCreateModal: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  totalCount,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  availableCurrencies,
  onEditExpense,
  onDeleteExpense,
  onOpenCreateModal,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick helper to check if any non-default filter is active
  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.category && filters.category !== 'all') ||
    (filters.currency && filters.currency !== 'all') ||
    filters.start_date ||
    filters.end_date ||
    filters.min_amount ||
    filters.max_amount
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="expense-search-input"
              type="text"
              placeholder="Search by description or category..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Filter Dropdown */}
          <div className="w-full sm:w-48">
            <select
              id="expense-category-filter"
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="w-full py-2 px-3 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Currency Filter Dropdown */}
          <div className="w-full sm:w-36">
            <select
              id="expense-currency-filter"
              value={filters.currency || 'all'}
              onChange={(e) => onFilterChange({ currency: e.target.value })}
              className="w-full py-2 px-3 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
            >
              <option value="all">All Currencies</option>
              {availableCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr} ({getCurrencySymbol(curr)})
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter Toggle Button */}
          <button
            id="toggle-advanced-filters-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">From Date</label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => onFilterChange({ start_date: e.target.value })}
                className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">To Date</label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => onFilterChange({ end_date: e.target.value })}
                className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Min Amount</label>
              <input
                id="filter-min-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={filters.min_amount !== undefined ? filters.min_amount : ''}
                onChange={(e) => onFilterChange({ min_amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Max Amount</label>
              <input
                id="filter-max-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1000.00"
                value={filters.max_amount !== undefined ? filters.max_amount : ''}
                onChange={(e) => onFilterChange({ max_amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Sort Controls & Active Filter Clearer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span>Sort by:</span>
            <select
              id="expense-sort-by"
              value={filters.sort_by || 'date'}
              onChange={(e) => onFilterChange({ sort_by: e.target.value as any })}
              className="py-1 px-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
              <option value="description">Description</option>
              <option value="currency">Currency</option>
            </select>

            <button
              id="expense-sort-order-toggle"
              onClick={() => onFilterChange({ sort_order: filters.sort_order === 'asc' ? 'desc' : 'asc' })}
              className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white flex items-center space-x-1"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="uppercase">{filters.sort_order || 'desc'}</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              id="reset-filters-btn"
              onClick={onResetFilters}
              className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400 font-medium">
          Showing {expenses.length} of {totalCount} {totalCount === 1 ? 'expense' : 'expenses'}
        </span>
        {filters.currency && filters.currency !== 'all' && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            Filtered by: {filters.currency}
          </span>
        )}
      </div>

      {/* Expenses Table (Desktop) & Cards (Mobile) */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading expenses from SQLite...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Expenses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No expense records matched your active search and filter criteria. Try adjusting or resetting filters.'
              : 'There are no expenses in the database. Add an expense to get started.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={onResetFilters}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
            >
              Add New Expense
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Description</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Currency</th>
                  <th className="py-3 px-4 font-medium text-right">Amount</th>
                  <th className="py-3 px-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-md">
                      {expense.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold text-2xs border border-slate-700/60">
                        {expense.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white font-mono text-sm whitespace-nowrap">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`edit-expense-${expense.id}`}
                          onClick={() => onEditExpense(expense)}
                          title="Edit Expense"
                          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-expense-${expense.id}`}
                          onClick={() => onDeleteExpense(expense)}
                          title="Delete Expense"
                          className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-800">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-white">{expense.description}</p>
                    <div className="flex items-center space-x-2 text-2xs text-slate-400">
                      <span className="font-mono">{expense.date}</span>
                      <span>•</span>
                      <span>{expense.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-white font-mono">
                      {formatCurrency(expense.amount, expense.currency)}
                    </div>
                    <span className="text-2xs text-slate-400 font-mono uppercase">{expense.currency}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => onEditExpense(expense)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteExpense(expense)}
                    className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 text-xs font-medium flex items-center space-x-1 border border-rose-500/20"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
