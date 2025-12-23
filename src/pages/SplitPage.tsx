import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Users, ArrowUpRight, ArrowDownLeft, Receipt, Edit2, Trash2, X, User as UserIcon, Copy, Check, Share2, Split as SplitIcon, Home, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { PageBanner } from '../components/PageBanner';
import { Money } from '../components/Money';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const expenseSchema = z.object({
  description: z.string().min(2, 'Description is required'),
  total_amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string(),
  payer_type: z.enum(['me', 'friend']),
  payer_friend_id: z.string().optional(),
  notes: z.string().optional(),
  participants: z.array(z.string()).min(1, 'Select at least one participant'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Friend {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  participant_type: 'me' | 'friend';
  friend_id: string | null;
  share_amount: number;
}

interface Expense {
  id: string;
  description: string;
  date: string;
  total_amount: number;
  payer_type: 'me' | 'friend';
  payer_friend_id: string | null;
  notes: string | null;
  share_token: string | null;
  participants: Participant[];
}

export function SplitPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareExpense, setShareExpense] = useState<Expense | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inlineNewFriends, setInlineNewFriends] = useState<string[]>([]);
  const [savingInlineFriends, setSavingInlineFriends] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  const payerType = watch('payer_type');
  const totalAmount = watch('total_amount');

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const createdExpenseId = searchParams.get('created');
    if (createdExpenseId && expenses.length > 0) {
      const expense = expenses.find(e => e.id === createdExpenseId);
      if (expense) {
        setShareExpense(expense);
        setShowShareModal(true);
        setSearchParams({});
      }
    }
  }, [expenses, searchParams]);

  const loadData = async () => {
    try {
      const [friendsRes, expensesRes] = await Promise.all([
        supabase.from('friends').select('*').eq('user_id', user!.id),
        supabase
          .from('split_expenses')
          .select('*, split_expense_participants(*)')
          .eq('user_id', user!.id)
          .order('date', { ascending: false }),
      ]);

      if (friendsRes.error) throw friendsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setFriends(friendsRes.data || []);

      const expensesWithParticipants = (expensesRes.data || []).map((expense: any) => ({
        ...expense,
        participants: expense.split_expense_participants || [],
      }));
      setExpenses(expensesWithParticipants);
    } catch (error) {
      console.error('Error loading split data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totalOwed = 0;
    let totalOwe = 0;

    expenses.forEach((expense) => {
      const participants = expense.participants || [];
      const myShare = participants.find((p) => p.participant_type === 'me');

      if (expense.payer_type === 'me') {
        participants.forEach((p) => {
          if (p.participant_type === 'friend') {
            totalOwed += p.share_amount;
          }
        });
      } else if (expense.payer_type === 'friend' && myShare) {
        totalOwe += myShare.share_amount;
      }
    });

    return { totalOwed, totalOwe };
  };

  const { totalOwed, totalOwe } = calculateTotals();

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDetailModalOpen(false);

    const participantIds = expense.participants.map((p) =>
      p.participant_type === 'me' ? 'me' : p.friend_id!
    );
    setSelectedParticipants(new Set(participantIds));

    reset({
      description: expense.description,
      total_amount: expense.total_amount,
      date: expense.date,
      payer_type: expense.payer_type,
      payer_friend_id: expense.payer_friend_id || undefined,
      notes: expense.notes || '',
      participants: participantIds,
    });

    setIsEditModalOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const { error } = await supabase.from('split_expenses').delete().eq('id', expenseId);

      if (error) throw error;

      alert('Expense deleted successfully!');
      setIsDetailModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const toggleParticipant = (participantId: string) => {
    const newSet = new Set(selectedParticipants);
    if (newSet.has(participantId)) {
      newSet.delete(participantId);
    } else {
      newSet.add(participantId);
    }
    setSelectedParticipants(newSet);
    setValue('participants', Array.from(newSet));
  };

  const generateShareToken = () => {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
      .replace(/[+/=]/g, '')
      .substring(0, 16);
  };

  const addInlineFriendField = () => {
    setInlineNewFriends([...inlineNewFriends, '']);
  };

  const updateInlineFriendName = (index: number, name: string) => {
    const updated = [...inlineNewFriends];
    updated[index] = name;
    setInlineNewFriends(updated);
  };

  const removeInlineFriendField = (index: number) => {
    const updated = inlineNewFriends.filter((_, i) => i !== index);
    setInlineNewFriends(updated);
  };

  const saveInlineFriends = async () => {
    if (!user) return;

    const validNames = inlineNewFriends.filter(name => name.trim().length > 0);
    if (validNames.length === 0) return;

    setSavingInlineFriends(true);
    try {
      const friendsToInsert = validNames.map(name => ({
        user_id: user.id,
        name: name.trim(),
      }));

      const { data, error } = await supabase
        .from('friends')
        .insert(friendsToInsert)
        .select();

      if (error) throw error;

      setInlineNewFriends([]);
      await loadData();
    } catch (error) {
      console.error('Error saving friends:', error);
      alert('Failed to save friends');
    } finally {
      setSavingInlineFriends(false);
    }
  };

  const onAddSubmit = async (data: ExpenseFormData) => {
    try {
      await saveInlineFriends();

      const numParticipants = selectedParticipants.size;
      const shareAmount = data.total_amount / numParticipants;

      const { data: expenseData, error: expenseError } = await supabase
        .from('split_expenses')
        .insert({
          user_id: user!.id,
          description: data.description,
          total_amount: data.total_amount,
          date: data.date,
          payer_type: data.payer_type,
          payer_friend_id: data.payer_type === 'friend' ? data.payer_friend_id : null,
          notes: data.notes || null,
          share_token: generateShareToken(),
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      const participants = Array.from(selectedParticipants).map((participantId) => {
        if (participantId === 'me') {
          return {
            expense_id: expenseData.id,
            user_id: user!.id,
            participant_type: 'me' as const,
            friend_id: null,
            share_amount: shareAmount,
          };
        } else {
          return {
            expense_id: expenseData.id,
            user_id: user!.id,
            participant_type: 'friend' as const,
            friend_id: participantId,
            share_amount: shareAmount,
          };
        }
      });

      const { error: participantsError } = await supabase
        .from('split_expense_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      setIsAddModalOpen(false);
      setSelectedParticipants(new Set());
      reset();

      const expenseWithParticipants: Expense = {
        ...expenseData,
        participants: participants.map(p => ({
          id: crypto.randomUUID(),
          expense_id: expenseData.id,
          user_id: p.user_id,
          participant_type: p.participant_type,
          friend_id: p.friend_id,
          share_amount: p.share_amount,
        })),
      };

      setShareExpense(expenseWithParticipants);
      setShowShareModal(true);

      await loadData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const onEditSubmit = async (data: ExpenseFormData) => {
    if (!editingExpense) return;

    try {
      await saveInlineFriends();

      const numParticipants = selectedParticipants.size;
      const shareAmount = data.total_amount / numParticipants;

      const { error: expenseError } = await supabase
        .from('split_expenses')
        .update({
          description: data.description,
          total_amount: data.total_amount,
          date: data.date,
          payer_type: data.payer_type,
          payer_friend_id: data.payer_type === 'friend' ? data.payer_friend_id : null,
          notes: data.notes || null,
        })
        .eq('id', editingExpense.id);

      if (expenseError) throw expenseError;

      await supabase
        .from('split_expense_participants')
        .delete()
        .eq('expense_id', editingExpense.id);

      const participants = Array.from(selectedParticipants).map((participantId) => {
        if (participantId === 'me') {
          return {
            expense_id: editingExpense.id,
            user_id: user!.id,
            participant_type: 'me' as const,
            friend_id: null,
            share_amount: shareAmount,
          };
        } else {
          return {
            expense_id: editingExpense.id,
            user_id: user!.id,
            participant_type: 'friend' as const,
            friend_id: participantId,
            share_amount: shareAmount,
          };
        }
      });

      const { error: participantsError } = await supabase
        .from('split_expense_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      alert('Expense updated successfully!');
      setIsEditModalOpen(false);
      setEditingExpense(null);
      setSelectedParticipants(new Set());
      reset();
      loadData();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense');
    }
  };

  const getFriendName = (friendId: string | null) => {
    if (!friendId) return 'Unknown';
    return friends.find((f) => f.id === friendId)?.name || 'Unknown';
  };

  const copyShareLink = async () => {
    if (!shareExpense?.share_token) return;

    const shareLink = `${window.location.origin}/split/share/${shareExpense.share_token}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const totalParticipants = selectedParticipants.size + inlineNewFriends.filter(name => name.trim().length > 0).length;
  const shareAmount =
    totalAmount && totalParticipants > 0
      ? (totalAmount / totalParticipants).toFixed(2)
      : '0.00';

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
            <span className="text-white font-medium">Split Bills</span>
          </nav>

          {user ? (
            <PageBanner
              title="Split Bills & Expenses"
              description="Share costs fairly with friends. Track who paid what, split bills evenly, and settle up with ease."
              icon={SplitIcon}
              gradient="magenta"
              pattern="dots"
              stats={[
                { label: 'You Are Owed', value: `$${totalOwed.toFixed(2)}`, icon: ArrowDownLeft },
                { label: 'You Owe', value: `$${totalOwe.toFixed(2)}`, icon: ArrowUpRight },
                { label: 'Friends', value: friends.length, icon: Users },
              ]}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">Split Bills & Expenses</h1>
                <p className="text-gray-400">Share costs fairly with friends</p>
              </div>
            </div>
          )}

          {!user ? (
            <div className="space-y-8">
              <GlowingCard>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="inline-block p-3 bg-gradient-to-br from-pink-500/20 to-magenta-500/20 rounded-2xl">
                      <SplitIcon className="w-12 h-12 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">
                        Split Expenses Effortlessly
                      </h2>
                      <p className="text-gray-300 leading-relaxed mb-6">
                        Share costs with friends and roommates. Track who owes what, split bills evenly or unevenly,
                        and settle debts without the awkwardness. Perfect for group trips, shared apartments, and nights out.
                      </p>
                      <GradientButton onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                        Start Splitting Bills
                      </GradientButton>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ArrowDownLeft className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-white font-semibold mb-1">Track Money Owed</h3>
                          <p className="text-gray-400 text-sm">See exactly who owes you and how much at a glance</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-magenta-500/10 to-transparent border border-magenta-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Receipt className="w-6 h-6 text-magenta-400 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-white font-semibold mb-1">Split Any Way You Want</h3>
                          <p className="text-gray-400 text-sm">Divide equally, by percentage, or custom amounts per person</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Users className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-white font-semibold mb-1">Manage Friend Groups</h3>
                          <p className="text-gray-400 text-sm">Keep track of expenses with different friend circles and groups</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowingCard>

              <div className="grid md:grid-cols-3 gap-6">
                <GlowingCard>
                  <div className="text-center space-y-3">
                    <div className="inline-block p-4 bg-gradient-to-br from-pink-500/20 to-magenta-500/20 rounded-2xl">
                      <Receipt className="w-8 h-8 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Simple Expense Tracking</h3>
                    <p className="text-gray-400 text-sm">
                      Add expenses in seconds. Include descriptions, dates, and who participated in the cost.
                    </p>
                  </div>
                </GlowingCard>

                <GlowingCard>
                  <div className="text-center space-y-3">
                    <div className="inline-block p-4 bg-gradient-to-br from-magenta-500/20 to-pink-500/20 rounded-2xl">
                      <ArrowUpRight className="w-8 h-8 text-magenta-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Settlement Reminders</h3>
                    <p className="text-gray-400 text-sm">
                      Keep track of outstanding balances and settle up when it's convenient for everyone.
                    </p>
                  </div>
                </GlowingCard>

                <GlowingCard>
                  <div className="text-center space-y-3">
                    <div className="inline-block p-4 bg-gradient-to-br from-pink-500/20 to-magenta-500/20 rounded-2xl">
                      <Share2 className="w-8 h-8 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Easy Sharing</h3>
                    <p className="text-gray-400 text-sm">
                      Share expense details with friends via a simple link. No sign-up required for them to view.
                    </p>
                  </div>
                </GlowingCard>
              </div>

              <GlowingCard>
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Stop Doing Math. Start Splitting Smart.
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Whether it's rent, groceries, or a group vacation, i4uBuddy makes splitting expenses
                    simple and stress-free. Join now and never lose track of shared expenses again.
                  </p>
                  <GradientButton onClick={() => navigate('/auth')} size="lg">
                    Sign In to Begin
                  </GradientButton>
                </div>
              </GlowingCard>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <GradientButton
                  onClick={() => navigate('/split/friends')}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Friends
                </GradientButton>
                <GradientButton
                  onClick={() => {
                    reset({
                      date: new Date().toISOString().split('T')[0],
                      payer_type: 'me',
                    });
                    setSelectedParticipants(new Set());
                    setInlineNewFriends([]);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Expense
                </GradientButton>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlowingCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">You are owed</p>
              <Money amount={totalOwed} className="text-2xl font-bold text-green-400" />
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </GlowingCard>

        <GlowingCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">You owe</p>
              <Money amount={totalOwe} className="text-2xl font-bold text-red-400" />
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </GlowingCard>
      </div>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">All Expenses</h2>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No expenses yet</p>
            <GradientButton onClick={() => {
              reset({
                date: new Date().toISOString().split('T')[0],
                payer_type: 'me',
              });
              setSelectedParticipants(new Set());
              setInlineNewFriends([]);
              setIsAddModalOpen(true);
            }}>
              Add Your First Expense
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const participants = expense.participants || [];
              const numParticipants = participants.length;
              const payerName =
                expense.payer_type === 'me' ? 'You' : getFriendName(expense.payer_friend_id);

              return (
                <div
                  key={expense.id}
                  onClick={() => handleExpenseClick(expense)}
                  className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(expense.date).toLocaleDateString()} • {payerName} paid •{' '}
                        {numParticipants} {numParticipants === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>
                  <Money amount={expense.total_amount} className="text-white font-bold" />
                </div>
              );
            })}
          </div>
        )}
      </GlowingCard>
            </>
          )}

      {user && selectedExpense && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedExpense(null);
          }}
          title="Expense Details"
        >
          <div className="space-y-4">
            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {selectedExpense.description}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                <Money
                  amount={selectedExpense.total_amount}
                  className="text-2xl font-bold text-white"
                />
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Paid by</span>
                  <span className="text-white font-medium">
                    {selectedExpense.payer_type === 'me'
                      ? 'You'
                      : getFriendName(selectedExpense.payer_friend_id)}
                  </span>
                </div>

                {selectedExpense.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Notes</span>
                    <span className="text-white">{selectedExpense.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Split with</h4>
              <div className="space-y-2">
                {selectedExpense.participants.map((participant) => {
                  const name =
                    participant.participant_type === 'me'
                      ? 'You'
                      : getFriendName(participant.friend_id);

                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-surface/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white">{name}</span>
                      </div>
                      <Money amount={participant.share_amount} className="text-white font-medium" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-border">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                }}
                className="px-4 py-2.5 bg-surface/50 hover:bg-surface border border-border rounded-lg text-white text-sm font-medium transition-colors"
              >
                View Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareExpense(selectedExpense);
                    setShowShareModal(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-surface/50 hover:bg-surface border border-border rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(selectedExpense);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-surface/50 hover:bg-surface border border-border rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(selectedExpense.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 hover:text-purple-300 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {user && (
        <Modal
          isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedParticipants(new Set());
          setInlineNewFriends([]);
          reset();
        }}
        title="Add Expense"
      >
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          <Input
            {...register('description')}
            label="Description"
            placeholder="e.g., Dinner at restaurant"
            error={errors.description?.message}
          />

          <Input
            {...register('total_amount')}
            label="Total Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.total_amount?.message}
          />

          <Input
            {...register('date')}
            label="Date"
            type="date"
            error={errors.date?.message}
          />

          <Select
            {...register('payer_type')}
            label="Who Paid?"
            options={[
              { value: 'me', label: 'Me' },
              { value: 'friend', label: 'A Friend' },
            ]}
            error={errors.payer_type?.message}
          />

          {payerType === 'friend' && (
            <Select
              {...register('payer_friend_id')}
              label="Which Friend Paid?"
              options={friends.map((f) => ({ value: f.id, label: f.name }))}
              error={errors.payer_friend_id?.message}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Split With (including you)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedParticipants.has('me')}
                  onChange={() => toggleParticipant('me')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-white font-medium">Me (You)</span>
              </label>
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(friend.id)}
                    onChange={() => toggleParticipant(friend.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-white font-medium">{friend.name}</span>
                </label>
              ))}

              {inlineNewFriends.map((name, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg border border-primary-500/50">
                  <Input
                    value={name}
                    onChange={(e) => updateInlineFriendName(index, e.target.value)}
                    placeholder="Enter friend name"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeInlineFriendField(index)}
                    className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addInlineFriendField}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary-500/10 rounded-lg border border-primary-500/50 text-primary-400 hover:bg-primary-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Add Friend</span>
                </button>
                {inlineNewFriends.length > 0 && (
                  <button
                    type="button"
                    onClick={saveInlineFriends}
                    disabled={savingInlineFriends}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-medium">{savingInlineFriends ? 'Saving...' : 'Save Friends'}</span>
                  </button>
                )}
              </div>
            </div>
            {errors.participants && (
              <p className="text-sm text-red-400 mt-2">{errors.participants.message}</p>
            )}
          </div>

          {totalParticipants > 0 && (
            <div className="p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
              <p className="text-gray-300 text-sm">
                Split equally among {totalParticipants} participant(s)
              </p>
              <p className="text-white text-lg font-bold mt-1">${shareAmount} per person</p>
            </div>
          )}

          <Input
            {...register('notes')}
            label="Notes (optional)"
            placeholder="Add any additional details"
          />

          <div className="flex gap-3 pt-4">
            <GradientButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setSelectedParticipants(new Set());
                setInlineNewFriends([]);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </GradientButton>
            <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </GradientButton>
          </div>
        </form>
      </Modal>
      )}

      {user && editingExpense && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
            setSelectedParticipants(new Set());
            setInlineNewFriends([]);
            reset();
          }}
          title="Edit Expense"
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <Input
              {...register('description')}
              label="Description"
              placeholder="e.g., Dinner at restaurant"
              error={errors.description?.message}
            />

            <Input
              {...register('total_amount')}
              label="Total Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.total_amount?.message}
            />

            <Input
              {...register('date')}
              label="Date"
              type="date"
              error={errors.date?.message}
            />

            <Select
              {...register('payer_type')}
              label="Who Paid?"
              options={[
                { value: 'me', label: 'Me' },
                { value: 'friend', label: 'A Friend' },
              ]}
              error={errors.payer_type?.message}
            />

            {payerType === 'friend' && (
              <Select
                {...register('payer_friend_id')}
                label="Which Friend Paid?"
                options={friends.map((f) => ({ value: f.id, label: f.name }))}
                error={errors.payer_friend_id?.message}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Split With (including you)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has('me')}
                    onChange={() => toggleParticipant('me')}
                    className="w-5 h-5 rounded border-gray-600 bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-white font-medium">Me (You)</span>
                </label>
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(friend.id)}
                      onChange={() => toggleParticipant(friend.id)}
                      className="w-5 h-5 rounded border-gray-600 bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-white font-medium">{friend.name}</span>
                  </label>
                ))}

                {inlineNewFriends.map((name, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg border border-primary-500/50">
                    <Input
                      value={name}
                      onChange={(e) => updateInlineFriendName(index, e.target.value)}
                      placeholder="Enter friend name"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeInlineFriendField(index)}
                      className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addInlineFriendField}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary-500/10 rounded-lg border border-primary-500/50 text-primary-400 hover:bg-primary-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Add Friend</span>
                  </button>
                  {inlineNewFriends.length > 0 && (
                    <button
                      type="button"
                      onClick={saveInlineFriends}
                      disabled={savingInlineFriends}
                      className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span className="font-medium">{savingInlineFriends ? 'Saving...' : 'Save Friends'}</span>
                    </button>
                  )}
                </div>
              </div>
              {errors.participants && (
                <p className="text-sm text-red-400 mt-2">{errors.participants.message}</p>
              )}
            </div>

            {totalParticipants > 0 && (
              <div className="p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
                <p className="text-gray-300 text-sm">
                  Split equally among {totalParticipants} participant(s)
                </p>
                <p className="text-white text-lg font-bold mt-1">${shareAmount} per person</p>
              </div>
            )}

            <Input
              {...register('notes')}
              label="Notes (optional)"
              placeholder="Add any additional details"
            />

            <div className="flex gap-3 pt-4">
              <GradientButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                  setSelectedParticipants(new Set());
                  setInlineNewFriends([]);
                  reset();
                }}
                className="flex-1"
              >
                Cancel
              </GradientButton>
              <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Updating...' : 'Update Expense'}
              </GradientButton>
            </div>
          </form>
        </Modal>
      )}

      {user && (
        <Modal
          isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareExpense(null);
          setCopiedLink(false);
        }}
        title="Expense Created Successfully!"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">Share this expense</h3>
              <p className="text-sm text-gray-400">Send this link to your friends to view the expense details</p>
            </div>
          </div>

          {shareExpense?.share_token && (
            <div className="space-y-3">
              <div className="p-3 bg-surface border border-border rounded-lg break-all text-sm text-gray-300">
                {`${window.location.origin}/split/share/${shareExpense.share_token}`}
              </div>
              <GradientButton onClick={copyShareLink} className="w-full flex items-center justify-center gap-2">
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </GradientButton>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <GradientButton
              variant="secondary"
              onClick={() => {
                setShowShareModal(false);
                setShareExpense(null);
                setCopiedLink(false);
              }}
              className="w-full"
            >
              Close
            </GradientButton>
          </div>
        </div>
      </Modal>
      )}
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
