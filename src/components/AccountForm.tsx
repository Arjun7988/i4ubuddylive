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
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash']),
  balance: z.string().min(1, 'Balance is required'),
  currency: z.string().default('USD'),
});

type FormData = z.infer<typeof schema>;

interface AccountFormProps {
  account?: any;
  onSuccess: () => void;
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const { user } = useAuthStore();
  const { addAccount, updateAccount } = useDataStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          balance: String(account.balance),
          currency: account.currency,
        }
      : {
          type: 'checking',
          currency: 'USD',
          balance: '0',
        },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (account) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: data.name,
            type: data.type,
            balance: parseFloat(data.balance),
            currency: data.currency,
          })
          .eq('id', account.id);

        if (error) throw error;
        updateAccount(account.id, {
          ...data,
          balance: parseFloat(data.balance),
        } as any);
      } else {
        const { data: newAccount, error } = await supabase
          .from('accounts')
          .insert({
            user_id: user!.id,
            name: data.name,
            type: data.type,
            balance: parseFloat(data.balance),
            currency: data.currency,
          })
          .select()
          .single();

        if (error) throw error;
        if (newAccount) addAccount(newAccount);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Failed to save account');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name')}
        label="Account Name"
        placeholder="e.g., Main Checking"
        error={errors.name?.message}
      />

      <Select
        {...register('type')}
        label="Account Type"
        options={[
          { value: 'checking', label: 'Checking' },
          { value: 'savings', label: 'Savings' },
          { value: 'credit_card', label: 'Credit Card' },
          { value: 'investment', label: 'Investment' },
          { value: 'cash', label: 'Cash' },
        ]}
        error={errors.type?.message}
      />

      <Input
        {...register('balance')}
        type="number"
        step="0.01"
        label="Current Balance"
        placeholder="0.00"
        error={errors.balance?.message}
      />

      <Input
        {...register('currency')}
        label="Currency"
        placeholder="USD"
        error={errors.currency?.message}
      />

      <div className="flex space-x-3 pt-4">
        <GradientButton type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : account ? 'Update' : 'Add'} Account
        </GradientButton>
      </div>
    </form>
  );
}
