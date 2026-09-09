import React from 'react';
import { Expense, formatCurrency } from '../types';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  expense,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-white">Delete Expense Record?</h3>
          <p className="text-xs text-slate-400">
            This action will permanently remove this record from SQLite persistence:
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Description:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">{expense.description}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Amount:</span>
            <span className="font-bold text-white">{formatCurrency(expense.amount, expense.currency)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Date:</span>
            <span className="font-mono text-slate-400">{expense.date}</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            {isDeleting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
