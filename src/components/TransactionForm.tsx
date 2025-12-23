import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './Input';
import { Select } from './Select';
import { GradientButton } from './GradientButton';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

type FormData = z.infer<typeof schema>;

interface TransactionFormProps {
  transaction?: any;
  onSuccess: () => void;
}

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
  const { user } = useAuthStore();
  const { addTransaction, updateTransaction } = useDataStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          amount: String(transaction.amount),
          type: transaction.type,
          description: transaction.description,
          date: transaction.date,
        }
      : {
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
        },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (transaction) {
        const { error } = await supabase
          .from('transactions')
          .update({
            amount: parseFloat(data.amount),
            type: data.type,
            description: data.description,
            date: data.date,
          })
          .eq('id', transaction.id);

        if (error) throw error;
        updateTransaction(transaction.id, {
          ...data,
          amount: parseFloat(data.amount),
        } as any);
      } else {
        const { data: newTx, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user!.id,
            amount: parseFloat(data.amount),
            type: data.type,
            description: data.description,
            date: data.date,
          })
          .select()
          .single();

        if (error) throw error;
        if (newTx) addTransaction(newTx);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        {...register('type')}
        label="Type"
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        error={errors.type?.message}
      />

      <Input
        {...register('amount')}
        type="number"
        step="0.01"
        label="Amount"
        placeholder="0.00"
        error={errors.amount?.message}
      />

      <Input
        {...register('description')}
        label="Description"
        placeholder="e.g., Grocery shopping"
        error={errors.description?.message}
      />

      <Input
        {...register('date')}
        type="date"
        label="Date"
        error={errors.date?.message}
      />

      <div className="flex space-x-3 pt-4">
        <GradientButton type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Add'} Transaction
        </GradientButton>
      </div>
    </form>
  );
}
