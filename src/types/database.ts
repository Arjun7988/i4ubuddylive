export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color?: string;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
          balance: number;
          currency: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
          balance?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
          balance?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          amount: number;
          type: 'income' | 'expense';
          description: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          amount: number;
          type: 'income' | 'expense';
          description?: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          amount?: number;
          type?: 'income' | 'expense';
          description?: string;
          date?: string;
          created_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          period?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          created_at?: string;
        };
      };
      recurring_rules: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          amount: number;
          type: 'income' | 'expense';
          description: string;
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          amount: number;
          type: 'income' | 'expense';
          description?: string;
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          amount?: number;
          type?: 'income' | 'expense';
          description?: string;
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      split_expenses: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          date: string;
          total_amount: number;
          payer_type: 'me' | 'friend';
          payer_friend_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          date?: string;
          total_amount: number;
          payer_type: 'me' | 'friend';
          payer_friend_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          date?: string;
          total_amount?: number;
          payer_type?: 'me' | 'friend';
          payer_friend_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      split_expense_participants: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          participant_type: 'me' | 'friend';
          friend_id: string | null;
          share_amount: number;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          participant_type: 'me' | 'friend';
          friend_id?: string | null;
          share_amount: number;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          participant_type?: 'me' | 'friend';
          friend_id?: string | null;
          share_amount?: number;
        };
      };
      split_settlements: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          from_type: 'me' | 'friend';
          from_friend_id: string | null;
          to_type: 'me' | 'friend';
          to_friend_id: string | null;
          amount: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          from_type: 'me' | 'friend';
          from_friend_id?: string | null;
          to_type: 'me' | 'friend';
          to_friend_id?: string | null;
          amount: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          from_type?: 'me' | 'friend';
          from_friend_id?: string | null;
          to_type?: 'me' | 'friend';
          to_friend_id?: string | null;
          amount?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
