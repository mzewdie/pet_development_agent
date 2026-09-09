import React from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  Settings
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'expenses';
  onTabChange: (tab: 'dashboard' | 'expenses') => void;
  onOpenCreateModal: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateModal,
  onOpenSettings,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & App Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Personal Expense Tracker</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SQLite
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Multi-Currency
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Track, filter, and analyze personal expenses with strict currency isolation
              </p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* View Switcher Tabs */}
            <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 flex items-center">
              <button
                id="tab-dashboard-btn"
                onClick={() => onTabChange('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                id="tab-expenses-btn"
                onClick={() => onTabChange('expenses')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'expenses'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                <span>Expenses</span>
              </button>
            </div>

            {/* Settings Button */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              title="Database & Application Settings (Empty DB, Seed Data, Info)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Settings</span>
            </button>

            {/* Primary Action Button (Create Expense) */}
            <button
              id="new-expense-btn"
              onClick={onOpenCreateModal}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
