import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, LayoutDashboard, DollarSign, Calendar, ArrowUpRight, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { GlowingCard } from '../components/GlowingCard';
import { Money } from '../components/Money';
import { PageBanner } from '../components/PageBanner';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { transactions, accounts, categories, setTransactions, setAccounts, setCategories } = useDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [txResult, accResult, catResult] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*'),
        supabase.from('categories').select('*'),
      ]);

      if (txResult.data) setTransactions(txResult.data);
      if (accResult.data) setAccounts(accResult.data);
      if (catResult.data) setCategories(catResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = thisMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const monthlyExpense = thisMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const getLast6Months = () => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
      };
    });
  };

  const monthlyData = getLast6Months().map(({ month, year, monthNum }) => {
    const monthTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === monthNum && txDate.getFullYear() === year;
    });

    const income = monthTxs
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expense = monthTxs
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      month,
      income,
      expense,
      net: income - expense,
    };
  });

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
            <span className="text-white font-medium">Dashboard</span>
          </nav>

          <PageBanner
            title="Financial Dashboard"
            description="Get a complete overview of your finances, track your spending patterns, and make informed decisions about your money."
            icon={LayoutDashboard}
            gradient="rainbow"
            pattern="dots"
            stats={[
              { label: 'Monthly Income', value: `$${monthlyIncome.toFixed(0)}`, icon: TrendingUp },
              { label: 'Monthly Expenses', value: `$${monthlyExpense.toFixed(0)}`, icon: TrendingDown },
              { label: 'Net Savings', value: `$${(monthlyIncome - monthlyExpense).toFixed(0)}`, icon: DollarSign },
              { label: 'This Month', value: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), icon: Calendar },
            ]}
          />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlowingCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Monthly Income</p>
              <Money amount={monthlyIncome} className="text-2xl text-green-400" />
            </div>
            <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlowingCard>

        <GlowingCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Monthly Expenses</p>
              <Money amount={monthlyExpense} className="text-2xl text-red-400" />
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </GlowingCard>

        <GlowingCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Net Income</p>
              <Money amount={monthlyIncome - monthlyExpense} className="text-2xl" showSign />
            </div>
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlowingCard>
      </div>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-4">
          Recent Transactions
        </h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => {
              const category = categories.find(c => c.id === tx.category_id);
              const account = accounts.find(a => a.id === tx.account_id);
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      <span style={{ color: category?.color }}>
                        {tx.type === 'income' ? '+' : '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.description || 'Transaction'}</p>
                      <p className="text-sm text-gray-400">
                        {category?.name} • {account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Money
                      amount={tx.type === 'expense' ? -Number(tx.amount) : Number(tx.amount)}
                      showSign
                    />
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No transactions yet. Start by adding your first transaction!
          </div>
        )}
      </GlowingCard>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">
          Income vs Expenses (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#15161A',
                border: '1px solid #27272A',
                borderRadius: '8px',
                color: '#E5E7EB',
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#00C9A7" name="Income" />
            <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </GlowingCard>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
