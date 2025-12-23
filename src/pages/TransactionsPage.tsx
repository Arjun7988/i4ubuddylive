import { useEffect, useState } from 'react';
import { Plus, Receipt, TrendingUp, TrendingDown, List, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { PageBanner } from '../components/PageBanner';
import { Money } from '../components/Money';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { TransactionForm } from '../components/TransactionForm';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function TransactionsPage() {
  const { user } = useAuthStore();
  const { transactions, setTransactions } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      setTransactions(transactions.filter(tx => tx.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
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
            <span className="text-white font-medium">Transactions</span>
          </nav>

          <PageBanner
            title="Transaction History"
            description="Track every dollar in and out. View, manage, and analyze all your financial transactions in one centralized location."
            icon={Receipt}
            gradient="primary"
            pattern="grid"
            action={{
              label: 'Add Transaction',
              onClick: () => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              },
            }}
            stats={[
              { label: 'Total Transactions', value: transactions.length, icon: List },
              { label: 'Income Entries', value: transactions.filter(t => t.type === 'income').length, icon: TrendingUp },
              { label: 'Expense Entries', value: transactions.filter(t => t.type === 'expense').length, icon: TrendingDown },
            ]}
          />

      <GlowingCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          {filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  return (
                    <tr key={tx.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {tx.description || 'Transaction'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs capitalize ${
                            tx.type === 'income'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Money
                          amount={tx.type === 'expense' ? -Number(tx.amount) : Number(tx.amount)}
                          showSign
                        />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsModalOpen(true);
                          }}
                          className="text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No transactions found. Add your first transaction to get started!
            </div>
          )}
        </div>
      </GlowingCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
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
