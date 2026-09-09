import React, { useState } from 'react';
import {
  DashboardSummary,
  Expense,
  formatCurrency,
  getCurrencySymbol
} from '../types';
import {
  Coins,
  Calendar,
  PieChart,
  History,
  TrendingUp,
  Info,
  ArrowUpRight,
  PlusCircle,
  Database
} from 'lucide-react';

interface DashboardProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onSelectExpense: (expense: Expense) => void;
  onViewAllExpenses: () => void;
  onSeedData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  isLoading,
  onOpenCreateModal,
  onSelectExpense,
  onViewAllExpenses,
  onSeedData,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading persisted expense analytics...</p>
      </div>
    );
  }

  if (!summary || summary.total_expense_records === 0) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
          <Coins className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No Expenses Recorded Yet</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Your expense database is currently empty. Start recording your expenses or populate realistic demo data to see the multi-currency dashboard in action.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="empty-add-expense-btn"
            onClick={onOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Expense</span>
          </button>
          <button
            id="empty-seed-data-btn"
            onClick={onSeedData}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Load Multi-Currency Sample Data</span>
          </button>
        </div>
      </div>
    );
  }

  const { totals_by_currency, monthly_totals, category_totals, recent_expenses } = summary;

  // Filter monthly and category totals by selected currency if not 'all'
  const filteredMonthly = selectedCurrency === 'all'
    ? monthly_totals
    : monthly_totals.filter(m => m.currency === selectedCurrency);

  const filteredCategories = selectedCurrency === 'all'
    ? category_totals
    : category_totals.filter(c => c.currency === selectedCurrency);

  return (
    <div className="space-y-8 pb-12">
      {/* Policy Callout Banner for Multi-Currency Integrity */}
      <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-4 flex items-start space-x-3 text-slate-300 text-xs sm:text-sm">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-white">Multi-Currency Mathematical Separation</p>
          <p className="text-slate-400 leading-relaxed">
            Expenses are tracked explicitly in their native currency. Totals and monthly analytics are calculated independently per currency rather than combined into a mathematically invalid aggregate sum.
          </p>
        </div>
      </div>

      {/* Currency Totals Overview Grid */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Totals by Currency</span>
          </h2>
          <span className="text-xs text-slate-400">
            {totals_by_currency.length} active {totals_by_currency.length === 1 ? 'currency' : 'currencies'} • {summary.total_expense_records} total transactions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {totals_by_currency.map((c) => {
            const avg = c.expense_count > 0 ? c.total_amount / c.expense_count : 0;
            const isSelected = selectedCurrency === c.currency;
            return (
              <div
                key={c.currency}
                onClick={() => setSelectedCurrency(isSelected ? 'all' : c.currency)}
                className={`cursor-pointer bg-slate-900 border rounded-xl p-5 transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm text-white border border-slate-700">
                      {getCurrencySymbol(c.currency)}
                    </span>
                    <span className="font-semibold text-sm text-slate-300">{c.currency}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {c.expense_count} {c.expense_count === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(c.total_amount, c.currency)}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                    <span>Average per item:</span>
                    <span className="font-medium text-slate-300">{formatCurrency(avg, c.currency)}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Currency Filter Tabs for Breakdown Sections */}
      {totals_by_currency.length > 1 && (
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <span className="text-xs font-medium text-slate-400 mr-2">Filter View:</span>
          <button
            onClick={() => setSelectedCurrency('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCurrency === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            All Currencies
          </button>
          {totals_by_currency.map(c => (
            <button
              key={c.currency}
              onClick={() => setSelectedCurrency(c.currency)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                selectedCurrency === c.currency
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{c.currency}</span>
              <span className="text-xs opacity-75">({getCurrencySymbol(c.currency)})</span>
            </button>
          ))}
        </div>
      )}

      {/* Monthly & Category Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Monthly Totals {selectedCurrency !== 'all' ? `(${selectedCurrency})` : ''}</span>
            </h3>
            <span className="text-xs text-slate-400">{filteredMonthly.length} monthly aggregates</span>
          </div>

          <div className="space-y-3">
            {filteredMonthly.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No monthly records found for this selection.</p>
            ) : (
              filteredMonthly.map((m, idx) => (
                <div
                  key={`${m.month}-${m.currency}-${idx}`}
                  className="bg-slate-800/50 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-white">{m.month}</span>
                      <span className="px-1.5 py-0.5 text-2xs rounded bg-slate-700 text-slate-300 font-mono">
                        {m.currency}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {m.expense_count} {m.expense_count === 1 ? 'expense' : 'expenses'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-white">
                      {formatCurrency(m.total_amount, m.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Category Breakdown {selectedCurrency !== 'all' ? `(${selectedCurrency})` : ''}</span>
            </h3>
            <span className="text-xs text-slate-400">{filteredCategories.length} categories</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No category records found for this selection.</p>
            ) : (
              filteredCategories.map((c, idx) => {
                const pct = c.percentage_of_currency || 0;
                return (
                  <div key={`${c.category}-${c.currency}-${idx}`} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-200">{c.category}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-2xs font-mono">
                          {c.currency}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">
                          {formatCurrency(c.total_amount, c.currency)}
                        </span>
                        <span className="text-slate-400 text-2xs">({pct}%)</span>
                      </div>
                    </div>
                    {/* Progress visual bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Recent Expenses</h3>
          </div>
          <button
            onClick={onViewAllExpenses}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
          >
            <span>View All & Search</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Currency</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recent_expenses.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectExpense(item)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 text-slate-300 whitespace-nowrap font-mono">{item.date}</td>
                  <td className="py-2.5 text-white font-medium max-w-xs truncate">{item.description}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-mono text-slate-300 font-semibold">{item.currency}</span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-white whitespace-nowrap">
                    {formatCurrency(item.amount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
