import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  expenseCount: number;
  isClearing: boolean;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  expenseCount,
  isClearing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white">Empty Entire Database?</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to permanently clear all expense records from SQLite persistence?
          </p>
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-400 space-y-1 mt-3">
            <div className="flex justify-between text-slate-300">
              <span>Records to be deleted:</span>
              <span className="font-bold text-rose-400">{expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Database outcome:</span>
              <span className="font-medium text-emerald-400">Empty clean slate (0 records)</span>
            </div>
            <p className="text-slate-500 text-2xs pt-1 border-t border-slate-700/60 text-left">
              * Categories will be preserved so you can immediately record new expenses.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            id="cancel-clear-db-btn"
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-clear-db-btn"
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            {isClearing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Emptying...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
