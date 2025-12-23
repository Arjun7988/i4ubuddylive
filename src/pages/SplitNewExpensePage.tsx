import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
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

export function SplitNewExpensePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      payer_type: 'me',
    },
  });

  const payerType = watch('payer_type');
  const totalAmount = watch('total_amount');

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user!.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
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

  const onSubmit = async (data: ExpenseFormData) => {
    try {
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

      navigate(`/split?created=${expenseData.id}`);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const shareAmount = totalAmount && selectedParticipants.size > 0
    ? (totalAmount / selectedParticipants.size).toFixed(2)
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
        <div className="space-y-6 max-w-2xl mx-auto">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Link to="/split" className="text-gray-400 hover:text-primary-400 transition-colors">
              Split Bills
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">New Expense</span>
          </nav>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/split')}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">New Expense</h1>
          <p className="text-gray-400">Split a bill with friends</p>
        </div>
      </div>

      <GlowingCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            </div>
            {errors.participants && (
              <p className="text-sm text-red-400 mt-2">{errors.participants.message}</p>
            )}
          </div>

          {selectedParticipants.size > 0 && (
            <div className="p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
              <p className="text-gray-300 text-sm">
                Split equally among {selectedParticipants.size} participant(s)
              </p>
              <p className="text-white text-lg font-bold mt-1">
                ${shareAmount} per person
              </p>
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
              onClick={() => navigate('/split')}
              className="flex-1"
            >
              Cancel
            </GradientButton>
            <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </GradientButton>
          </div>
        </form>
      </GlowingCard>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
