import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Expense,
  ExpenseInput,
  ExpenseFilterParams,
  Category,
  DashboardSummary
} from './types';
import {
  fetchExpenses,
  fetchCategories,
  fetchDashboard,
  createExpense,
  updateExpense,
  deleteExpense,
  seedTestData,
  resetExpenses,
} from './api';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { DeleteModal } from './components/DeleteModal';
import { SettingsModal } from './components/SettingsModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'expenses'>('dashboard');
  
  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Filters & Sorting state
  const [filters, setFilters] = useState<ExpenseFilterParams>({
    sort_by: 'date',
    sort_order: 'desc',
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load categories once
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Refresh dashboard summary
  const loadDashboard = useCallback(async () => {
    try {
      const summary = await fetchDashboard();
      setDashboardSummary(summary);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    }
  }, []);

  // Refresh expenses with current filters
  const loadExpenses = useCallback(async (currentFilters: ExpenseFilterParams) => {
    setIsLoading(true);
    try {
      const res = await fetchExpenses(currentFilters);
      setExpenses(res.items);
      setTotalCount(res.total_count);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      addToast(err.message || 'Failed to fetch expenses', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadDashboard();
    loadExpenses(filters);
  }, []);

  // Filter updates
  const handleFilterChange = (newFilters: Partial<ExpenseFilterParams>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    loadExpenses(updated);
  };

  const handleResetFilters = () => {
    const defaultFilters: ExpenseFilterParams = {
      sort_by: 'date',
      sort_order: 'desc',
    };
    setFilters(defaultFilters);
    loadExpenses(defaultFilters);
  };

  // Create / Update expense handler
  const handleSaveExpense = async (data: ExpenseInput) => {
    if (expenseToEdit) {
      const updated = await updateExpense(expenseToEdit.id, data);
      addToast(`Updated expense: ${updated.description}`, 'success');
    } else {
      const created = await createExpense(data);
      addToast(`Recorded new expense of ${created.currency} ${created.amount}`, 'success');
    }
    // Refresh both views
    loadExpenses(filters);
    loadDashboard();
    loadCategories();
  };

  // Delete expense handler
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      await deleteExpense(expenseToDelete.id);
      addToast(`Deleted expense: ${expenseToDelete.description}`, 'success');
      setExpenseToDelete(null);
      loadExpenses(filters);
      loadDashboard();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Demo data seeding
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const res = await seedTestData();
      addToast(res.message, 'success');
      loadExpenses(filters);
      loadDashboard();
      loadCategories();
    } catch (err: any) {
      addToast(err.message || 'Failed to seed sample data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Empty/Clear Database Handler (Called from ClearConfirmModal)
  const handleConfirmClearDatabase = async () => {
    try {
      setIsClearing(true);
      await resetExpenses();
      addToast('Database emptied: All expense records cleared from SQLite', 'info');
      setIsClearConfirmOpen(false);
      // Immediately reset client state
      setExpenses([]);
      setTotalCount(0);
      loadExpenses(filters);
      loadDashboard();
    } catch (err: any) {
      addToast(err.message || 'Failed to empty database', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenCreateModal={() => {
          setExpenseToEdit(null);
          setIsModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' ? (
          <Dashboard
            summary={dashboardSummary}
            isLoading={isLoading && !dashboardSummary}
            onOpenCreateModal={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            onSelectExpense={(expense) => {
              setExpenseToEdit(expense);
              setIsModalOpen(true);
            }}
            onViewAllExpenses={() => setCurrentTab('expenses')}
            onSeedData={handleSeedData}
          />
        ) : (
          <ExpenseList
            expenses={expenses}
            totalCount={totalCount}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            categories={categories}
            availableCurrencies={dashboardSummary?.available_currencies || ['USD', 'EUR', 'GBP', 'JPY']}
            onEditExpense={(expense) => {
              setExpenseToEdit(expense);
              setIsModalOpen(true);
            }}
            onDeleteExpense={(expense) => setExpenseToDelete(expense)}
            onOpenCreateModal={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Add / Edit Expense Modal (CRUD: Create & Update) */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />

      {/* Deletion Confirmation Modal (CRUD: Delete) */}
      <DeleteModal
        isOpen={Boolean(expenseToDelete)}
        expense={expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        summary={dashboardSummary}
        expenseCount={totalCount}
        onOpenClearConfirm={() => setIsClearConfirmOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Clear Database Confirmation Modal */}
      <ClearConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClearDatabase}
        expenseCount={totalCount}
        isClearing={isClearing}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
