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
  category_id: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, 'Start date is required'),
});

type FormData = z.infer<typeof schema>;

interface BudgetFormProps {
  budget?: any;
  onSuccess: () => void;
}

export function BudgetForm({ budget, onSuccess }: BudgetFormProps) {
  const { user } = useAuthStore();
  const { categories, addBudget, updateBudget } = useDataStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: budget
      ? {
          category_id: budget.category_id,
          amount: String(budget.amount),
          period: budget.period,
          start_date: budget.start_date,
        }
      : {
          period: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
        },
  });

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const onSubmit = async (data: FormData) => {
    try {
      if (budget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category_id: data.category_id,
            amount: parseFloat(data.amount),
            period: data.period,
            start_date: data.start_date,
          })
          .eq('id', budget.id);

        if (error) throw error;
        updateBudget(budget.id, {
          ...data,
          amount: parseFloat(data.amount),
        } as any);
      } else {
        const { data: newBudget, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user!.id,
            category_id: data.category_id,
            amount: parseFloat(data.amount),
            period: data.period,
            start_date: data.start_date,
          })
          .select()
          .single();

        if (error) throw error;
        if (newBudget) addBudget(newBudget);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        {...register('category_id')}
        label="Category"
        options={[
          { value: '', label: 'Select category' },
          ...expenseCategories.map(cat => ({ value: cat.id, label: cat.name })),
        ]}
        error={errors.category_id?.message}
      />

      <Input
        {...register('amount')}
        type="number"
        step="0.01"
        label="Budget Amount"
        placeholder="0.00"
        error={errors.amount?.message}
      />

      <Select
        {...register('period')}
        label="Period"
        options={[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
        error={errors.period?.message}
      />

      <Input
        {...register('start_date')}
        type="date"
        label="Start Date"
        error={errors.start_date?.message}
      />

      <div className="flex space-x-3 pt-4">
        <GradientButton type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : budget ? 'Update' : 'Add'} Budget
        </GradientButton>
      </div>
    </form>
  );
}
