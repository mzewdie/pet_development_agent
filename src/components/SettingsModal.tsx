import React from 'react';
import {
  Settings,
  Database,
  Trash2,
  RefreshCw,
  X,
  Server,
  Layers,
  Coins,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DashboardSummary } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DashboardSummary | null;
  expenseCount: number;
  onOpenClearConfirm: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  summary,
  expenseCount,
  onOpenClearConfirm,
  onSeedData,
  isSeeding,
}) => {
  if (!isOpen) return null;

  const currencyCount = summary?.available_currencies.length || 0;
  const categoryCount = summary?.available_categories.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Application & Database Settings</h2>
              <p className="text-2xs text-slate-400">Manage SQLite storage, persistence, and data lifecycle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Storage Information Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Storage & Persistence Status</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-2xs text-slate-400">Database Engine</span>
                <div className="flex items-center space-x-1.5 text-sm font-bold text-white">
                  <span>SQLite</span>
                  <span className="px-1.5 py-0.2 rounded text-2xs bg-emerald-500/20 text-emerald-400 font-mono">WAL</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-2xs text-slate-400">Total Recorded Expenses</span>
                <div className="text-sm font-bold text-white font-mono">
                  {expenseCount} {expenseCount === 1 ? 'item' : 'items'}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-2xs text-slate-400">Currencies Tracked</span>
                <div className="text-sm font-bold text-white font-mono">
                  {currencyCount} {currencyCount === 1 ? 'currency' : 'currencies'}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-2xs text-slate-400">Categories Available</span>
                <div className="text-sm font-bold text-white font-mono">
                  {categoryCount} categories
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start space-x-2 text-2xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-white">Data Persistence Guarantee:</span> All CRUD operations are written synchronously to persistent SQLite storage. Data survives application and browser reloads.
              </p>
            </div>
          </div>

          {/* Database Actions Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Lifecycle Management</span>
            </h3>

            {/* Empty Database Option */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Empty Database (Clear All Expenses)</span>
                </h4>
                <p className="text-2xs text-slate-400 max-w-sm leading-relaxed">
                  Permanently deletes all expense records from SQLite, resetting the system to a clean 0-record slate. Requires explicit confirmation.
                </p>
              </div>

              <button
                id="settings-empty-db-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClearConfirm();
                }}
                disabled={expenseCount === 0}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Database</span>
              </button>
            </div>

            {/* Seed Sample Data Option */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Load Multi-Currency Sample Data</span>
                </h4>
                <p className="text-2xs text-slate-400 max-w-sm leading-relaxed">
                  Populate realistic demonstration expenses across multiple currencies (USD, EUR, GBP, JPY) and diverse categories for testing.
                </p>
              </div>

              <button
                id="settings-seed-data-btn"
                type="button"
                onClick={() => {
                  onSeedData();
                  onClose();
                }}
                disabled={isSeeding}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Loading...' : 'Load Sample Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-800/40 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
