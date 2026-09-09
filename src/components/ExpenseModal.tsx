import React, { useState, useEffect } from 'react';
import {
  Expense,
  ExpenseInput,
  Category,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol
} from '../types';
import { X, AlertCircle, Check, Plus } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExpenseInput) => Promise<void>;
  expenseToEdit: Expense | null;
  categories: Category[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  categories,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [category, setCategory] = useState<string>('Groceries & Food');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form state when opened or when expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (expenseToEdit) {
        setAmount(String(expenseToEdit.amount));
        setCurrency(expenseToEdit.currency);
        setDescription(expenseToEdit.description);
        setDate(expenseToEdit.date);
        
        // Check if category exists in list
        const exists = categories.some(c => c.name === expenseToEdit.category);
        if (exists) {
          setCategory(expenseToEdit.category);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setCategory('custom');
          setIsCustomCategory(true);
          setCustomCategory(expenseToEdit.category);
        }
      } else {
        // Defaults for new expense
        setAmount('');
        setCurrency(DEFAULT_CURRENCY);
        setCategory(categories[0]?.name || 'Groceries & Food');
        setIsCustomCategory(false);
        setCustomCategory('');
        setDescription('');
        // Format today's date YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
      }
    }
  }, [isOpen, expenseToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setError('Please select or specify an expense category.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('Please provide a description for the expense.');
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    if (!currency || currency.trim().length !== 3) {
      setError('Currency must be a 3-letter uppercase code (e.g. USD, EUR).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        amount: Math.round(numAmount * 100) / 100,
        currency: currency.trim().toUpperCase(),
        category: finalCategory,
        description: trimmedDesc,
        date: date.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSymbol = getCurrencySymbol(currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {expenseToEdit ? 'Edit Expense Record' : 'Record New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Currency in one row */}
          <div className="grid grid-cols-5 gap-3">
            {/* Amount */}
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  {activeSymbol}
                </span>
                <input
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Currency <span className="text-red-400">*</span>
              </label>
              <select
                id="expense-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Category <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-2xs text-blue-400 hover:text-blue-300"
              >
                {isCustomCategory ? 'Choose from list' : '+ Custom category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                id="expense-custom-category-input"
                type="text"
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                id="expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Description <span className="text-red-400">*</span>
              </label>
              <span className="text-2xs text-slate-500">{description.length}/255</span>
            </div>
            <input
              id="expense-description-input"
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Monthly subway pass or supermarket"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              id="expense-date-input"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-expense-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{expenseToEdit ? 'Update Expense' : 'Save Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
