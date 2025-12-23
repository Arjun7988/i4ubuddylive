import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Receipt, ArrowLeftRight, Home, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Money } from '../components/Money';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const settlementSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string(),
  notes: z.string().optional(),
});

type SettlementFormData = z.infer<typeof settlementSchema>;

interface Friend {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  date: string;
  total_amount: number;
  payer_type: 'me' | 'friend';
  my_share: number;
}

interface Settlement {
  id: string;
  date: string;
  amount: number;
  from_type: 'me' | 'friend';
  notes: string | null;
}

export function SplitFriendLedgerPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (user && friendId) {
      loadData();
    }
  }, [user, friendId]);

  const loadData = async () => {
    try {
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', friendId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (friendError) throw friendError;
      if (!friendData) {
        alert('Friend not found');
        navigate('/split');
        return;
      }

      setFriend(friendData);

      const { data: expensesData, error: expensesError } = await supabase
        .from('split_expenses')
        .select('*, split_expense_participants(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      const relevantExpenses: Expense[] = [];
      let runningBalance = 0;

      (expensesData || []).forEach((expense) => {
        const participants = expense.split_expense_participants || [];
        const myParticipant = participants.find((p: any) => p.participant_type === 'me');
        const friendParticipant = participants.find(
          (p: any) => p.participant_type === 'friend' && p.friend_id === friendId
        );

        if (myParticipant && friendParticipant) {
          relevantExpenses.push({
            id: expense.id,
            description: expense.description,
            date: expense.date,
            total_amount: expense.total_amount,
            payer_type: expense.payer_type,
            my_share: myParticipant.share_amount,
          });

          if (expense.payer_type === 'me') {
            runningBalance += friendParticipant.share_amount;
          } else if (expense.payer_type === 'friend' && expense.payer_friend_id === friendId) {
            runningBalance -= myParticipant.share_amount;
          }
        }
      });

      setExpenses(relevantExpenses);

      const { data: settlementsData, error: settlementsError } = await supabase
        .from('split_settlements')
        .select('*')
        .eq('user_id', user!.id)
        .or(`from_friend_id.eq.${friendId},to_friend_id.eq.${friendId}`)
        .order('date', { ascending: false });

      if (settlementsError) throw settlementsError;

      const relevantSettlements: Settlement[] = [];
      (settlementsData || []).forEach((settlement) => {
        if (settlement.from_type === 'me' && settlement.to_friend_id === friendId) {
          relevantSettlements.push({
            id: settlement.id,
            date: settlement.date,
            amount: settlement.amount,
            from_type: 'me',
            notes: settlement.notes,
          });
          runningBalance -= settlement.amount;
        } else if (settlement.from_type === 'friend' && settlement.from_friend_id === friendId) {
          relevantSettlements.push({
            id: settlement.id,
            date: settlement.date,
            amount: settlement.amount,
            from_type: 'friend',
            notes: settlement.notes,
          });
          runningBalance += settlement.amount;
        }
      });

      setSettlements(relevantSettlements);
      setBalance(runningBalance);
    } catch (error) {
      console.error('Error loading ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSettleSubmit = async (data: SettlementFormData) => {
    try {
      const settlementData = {
        user_id: user!.id,
        date: data.date,
        from_type: balance < 0 ? ('me' as const) : ('friend' as const),
        from_friend_id: balance < 0 ? null : friendId,
        to_type: balance < 0 ? ('friend' as const) : ('me' as const),
        to_friend_id: balance < 0 ? friendId : null,
        amount: data.amount,
        notes: data.notes || null,
      };

      const { error } = await supabase.from('split_settlements').insert(settlementData);

      if (error) throw error;

      alert('Settlement recorded successfully!');
      setIsSettleModalOpen(false);
      reset();
      loadData();
    } catch (error) {
      console.error('Error recording settlement:', error);
      alert('Failed to record settlement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!friend) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/split')}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">{friend.name}</h1>
          <p className="text-gray-400">Expense history and balance</p>
        </div>
      </div>

      <GlowingCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">
                {balance === 0
                  ? 'Settled up'
                  : balance > 0
                  ? `${friend.name} owes you`
                  : `You owe ${friend.name}`}
              </p>
              <Money
                amount={Math.abs(balance)}
                className={`text-3xl font-bold ${
                  balance === 0
                    ? 'text-gray-400'
                    : balance > 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              />
            </div>
          </div>
          {balance !== 0 && (
            <GradientButton onClick={() => setIsSettleModalOpen(true)}>
              Settle Up
            </GradientButton>
          )}
        </div>
      </GlowingCard>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Activity</h2>
        {expenses.length === 0 && settlements.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No shared expenses yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...expenses, ...settlements]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item) => {
                if ('total_amount' in item) {
                  const expense = item as Expense;
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(expense.date).toLocaleDateString()} •{' '}
                            {expense.payer_type === 'me' ? 'You paid' : `${friend.name} paid`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Money
                          amount={expense.total_amount}
                          className="text-white font-medium"
                        />
                        <p className="text-sm text-gray-400">
                          Your share: <Money amount={expense.my_share} />
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  const settlement = item as Settlement;
                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-green-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <ArrowLeftRight className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {settlement.from_type === 'me'
                              ? `You paid ${friend.name}`
                              : `${friend.name} paid you`}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(settlement.date).toLocaleDateString()}
                            {settlement.notes && ` • ${settlement.notes}`}
                          </p>
                        </div>
                      </div>
                      <Money
                        amount={settlement.amount}
                        className="text-green-400 font-bold"
                      />
                    </div>
                  );
                }
              })}
          </div>
        )}
      </GlowingCard>

      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          reset();
        }}
        title="Settle Up"
      >
        <form onSubmit={handleSubmit(onSettleSubmit)} className="space-y-4">
          <div className="p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
            <p className="text-gray-300 text-sm">
              {balance > 0
                ? `${friend.name} owes you`
                : `You owe ${friend.name}`}
            </p>
            <Money
              amount={Math.abs(balance)}
              className="text-2xl font-bold text-white mt-1"
            />
          </div>

          <Input
            {...register('amount')}
            label="Settlement Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
          />

          <Input
            {...register('date')}
            label="Date"
            type="date"
            error={errors.date?.message}
          />

          <Input
            {...register('notes')}
            label="Notes (optional)"
            placeholder="Add any details"
          />

          <div className="flex gap-3 pt-4">
            <GradientButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSettleModalOpen(false);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </GradientButton>
            <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </GradientButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
