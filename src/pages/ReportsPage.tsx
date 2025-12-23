import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlowingCard } from '../components/GlowingCard';
import { Money } from '../components/Money';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function ReportsPage() {
  const { user } = useAuthStore();
  const { transactions, categories, setTransactions, setCategories } = useDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [txResult, catResult] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);

      if (txResult.data) setTransactions(txResult.data);
      if (catResult.data) setCategories(catResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const categoryBreakdown = categories.map(cat => {
    const spent = transactions
      .filter(tx => tx.category_id === cat.id)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      name: cat.name,
      amount: spent,
      type: cat.type,
      color: cat.color,
    };
  }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

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
            <span className="text-white font-medium">Reports</span>
          </nav>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Reports</h1>
            <p className="text-gray-400">Visualize your financial data and trends</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-6">
            Top Income Sources
          </h2>
          <div className="space-y-4">
            {categoryBreakdown
              .filter(cat => cat.type === 'income')
              .slice(0, 5)
              .map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-300">{cat.name}</span>
                  </div>
                  <Money amount={cat.amount} className="text-lg" />
                </div>
              ))}
          </div>
        </GlowingCard>

        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-6">
            Top Expense Categories
          </h2>
          <div className="space-y-4">
            {categoryBreakdown
              .filter(cat => cat.type === 'expense')
              .slice(0, 5)
              .map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-300">{cat.name}</span>
                  </div>
                  <Money amount={cat.amount} className="text-lg" />
                </div>
              ))}
          </div>
        </GlowingCard>
          </div>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
