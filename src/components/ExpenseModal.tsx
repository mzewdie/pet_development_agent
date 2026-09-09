import React, { useState, useEffect, useRef } from 'react';
import {
  Expense,
  ExpenseInput,
  Category,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol
} from '../types';
import { X, AlertCircle, Check, Calendar, Receipt, PlusCircle, Sparkles } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExpenseInput) => Promise<void>;
  expenseToEdit: Expense | null;
  categories: Category[];
}

const QUICK_DESCRIPTIONS = ['Supermarket', 'Bakery', 'Coffee', 'Dining Out', 'Pharmacy'];

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

  const dateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Helper to reliably find the default Groceries & Food category
  const resolveDefaultCategory = (): string => {
    if (!categories || categories.length === 0) return 'Groceries & Food';
    const match = categories.find((c) =>
      c.name.toLowerCase().includes('grocer') || c.name.toLowerCase().includes('food')
    );
    return match ? match.name : (categories[0]?.name || 'Groceries & Food');
  };

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
        const exists = categories.some((c) => c.name === expenseToEdit.category);
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
        // Defaults for recording new expense: default currency is EUR (€), category is Groceries & Food
        setAmount('');
        setCurrency(DEFAULT_CURRENCY);
        setCategory(resolveDefaultCategory());
        setIsCustomCategory(false);
        setCustomCategory('');
        setDescription('');
        // Format today's date YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);

        // Auto-focus amount field in next frame
        setTimeout(() => {
          amountInputRef.current?.focus();
        }, 80);
      }
    }
  }, [isOpen, expenseToEdit, categories]);

  if (!isOpen) return null;

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      if ('showPicker' in dateInputRef.current) {
        try {
          (dateInputRef.current as any).showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const setTodayDate = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDate(todayStr);
  };

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
      setError('Currency must be a 3-letter code (e.g. EUR, USD).');
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Compact Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {expenseToEdit ? <Receipt className="w-3.5 h-3.5" /> : <PlusCircle className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {expenseToEdit ? 'Edit Expense' : 'Record New Expense'}
              </h2>
              <p className="text-2xs text-slate-400">
                {expenseToEdit ? 'Modify recorded expense details' : 'Enter amount, category, date and note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form - Optimized for compact data collection in a small window */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Amount & Currency */}
          <div className="grid grid-cols-12 gap-2.5">
            {/* Amount */}
            <div className="col-span-7">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-emerald-400 text-sm font-bold select-none">
                  {activeSymbol}
                </span>
                <input
                  ref={amountInputRef}
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="col-span-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Currency <span className="text-red-400">*</span>
              </label>
              <select
                id="expense-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category & Date (Side-by-side for compact data collection) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-2xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isCustomCategory ? 'List' : '+ Custom'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  id="expense-custom-category-input"
                  type="text"
                  placeholder="Category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  id="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date with Highly Visible Calendar Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Date <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={setTodayDate}
                  className="text-2xs text-slate-400 hover:text-emerald-400 font-medium"
                >
                  Today
                </button>
              </div>

              {/* Date Input with Distinct, High-Contrast Calendar Button */}
              <div className="relative flex items-center">
                <input
                  ref={dateInputRef}
                  id="expense-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-2.5 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Prominent, Clearly Visible Calendar Icon Button */}
                <button
                  type="button"
                  id="expense-calendar-picker-btn"
                  onClick={handleOpenCalendar}
                  title="Open calendar picker"
                  className="absolute right-1 p-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Description <span className="text-red-400">*</span>
              </label>
              <span className="text-2xs text-slate-500">{description.length}/255</span>
            </div>
            <input
              id="expense-description-input"
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Supermarket, dinner, fresh fruits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Quick description suggestions */}
            {!expenseToEdit && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-2xs text-slate-500 flex items-center space-x-1 mr-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Quick:</span>
                </span>
                {QUICK_DESCRIPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDescription(item)}
                    className="px-1.5 py-0.5 rounded text-2xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compact Form Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-expense-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{expenseToEdit ? 'Update Expense' : `Save Expense (${activeSymbol})`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
