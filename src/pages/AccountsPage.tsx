import { useEffect, useState } from 'react';
import { Plus, Wallet, DollarSign, CreditCard, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { PageBanner } from '../components/PageBanner';
import { Money } from '../components/Money';
import { Modal } from '../components/Modal';
import { AccountForm } from '../components/AccountForm';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function AccountsPage() {
  const { user } = useAuthStore();
  const { accounts, setAccounts } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw error;
      if (data) setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;

      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

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
            <span className="text-white font-medium">Accounts</span>
          </nav>

          <PageBanner
            title="Account Management"
            description="Organize all your financial accounts in one place. Track balances, monitor changes, and get a complete picture of your wealth."
            icon={Wallet}
            gradient="cyan"
            pattern="grid"
            action={{
              label: 'Add Account',
              onClick: () => {
                setEditingAccount(null);
                setIsModalOpen(true);
              },
            }}
            stats={[
              { label: 'Total Balance', value: `$${totalBalance.toFixed(2)}`, icon: DollarSign },
              { label: 'Accounts', value: accounts.length, icon: CreditCard },
            ]}
          />

          <GlowingCard className="bg-gradient-primary">
            <div className="text-center py-8">
              <p className="text-white/80 mb-2">Total Net Worth</p>
              <Money amount={totalBalance} className="text-4xl font-bold text-white" />
            </div>
          </GlowingCard>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <GlowingCard key={account.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                        <p className="text-sm text-gray-400 capitalize">
                          {account.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-400">Balance</span>
                      <Money amount={Number(account.balance)} className="text-2xl" />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setEditingAccount(account);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm text-primary-400 hover:bg-surface rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="flex-1 px-3 py-2 text-sm text-red-400 hover:bg-surface rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </GlowingCard>
              ))}
            </div>
          ) : (
            <GlowingCard>
              <div className="text-center py-12 text-gray-500">
                No accounts yet. Add your first account to get started!
              </div>
            </GlowingCard>
          )}

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingAccount(null);
            }}
            title={editingAccount ? 'Edit Account' : 'Add Account'}
          >
            <AccountForm
              account={editingAccount}
              onSuccess={() => {
                setIsModalOpen(false);
                setEditingAccount(null);
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
