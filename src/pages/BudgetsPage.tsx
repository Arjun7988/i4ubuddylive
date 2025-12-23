import { useEffect, useState } from 'react';
import { Plus, PieChart, Target, DollarSign, TrendingDown, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { PageBanner } from '../components/PageBanner';
import { Money } from '../components/Money';
import { PercentBar } from '../components/PercentBar';
import { Modal } from '../components/Modal';
import { BudgetForm } from '../components/BudgetForm';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function BudgetsPage() {
  const { user } = useAuthStore();
  const { budgets, transactions, categories, setBudgets, setTransactions, setCategories } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [budgetResult, txResult, catResult] = await Promise.all([
        supabase.from('budgets').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('categories').select('*'),
      ]);

      if (budgetResult.data) setBudgets(budgetResult.data);
      if (txResult.data) setTransactions(txResult.data);
      if (catResult.data) setCategories(catResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;

      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget');
    }
  };

  const getBudgetProgress = (budget: any) => {
    const now = new Date();
    const spent = transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return (
          tx.category_id === budget.category_id &&
          tx.type === 'expense' &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      spent,
      remaining: Number(budget.amount) - spent,
      percent: (spent / Number(budget.amount)) * 100,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
        <div className="space-y-6">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">Budgets</span>
          </nav>

          <PageBanner
            title="Budget Management"
            description="Take control of your spending with smart budgets. Set limits, track progress, and achieve your financial goals with ease."
            icon={PieChart}
            gradient="sunset"
            pattern="waves"
            action={{
              label: 'Create Budget',
              onClick: () => {
                setEditingBudget(null);
                setIsModalOpen(true);
              },
            }}
            stats={[
              { label: 'Active Budgets', value: budgets.length, icon: Target },
              { label: 'Total Allocated', value: `$${budgets.reduce((sum, b) => sum + Number(b.amount), 0).toFixed(0)}`, icon: DollarSign },
            ]}
          />

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.category_id);
            const { spent, remaining, percent } = getBudgetProgress(budget);

            return (
              <GlowingCard key={budget.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      <span className="text-xl" style={{ color: category?.color }}>
                        {category?.icon || '💰'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {category?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setIsModalOpen(true);
                      }}
                      className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400">Spent</span>
                    <Money amount={spent} className="text-xl" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400">Budget</span>
                    <Money amount={Number(budget.amount)} className="text-xl" />
                  </div>
                  <PercentBar percent={percent} />
                  <div className="flex justify-between text-sm">
                    <span className={remaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {remaining >= 0 ? 'Remaining' : 'Over budget'}
                    </span>
                    <Money amount={Math.abs(remaining)} />
                  </div>
                </div>
              </GlowingCard>
            );
          })}
        </div>
      ) : (
        <GlowingCard>
          <div className="text-center py-12 text-gray-500">
            No budgets yet. Create your first budget to start tracking your spending!
          </div>
        </GlowingCard>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? 'Edit Budget' : 'Add Budget'}
      >
        <BudgetForm
          budget={editingBudget}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
            loadData();
          }}
        />
      </Modal>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
