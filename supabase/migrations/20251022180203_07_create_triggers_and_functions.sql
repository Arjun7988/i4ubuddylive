-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to seed default categories for new users
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, type, color, icon, is_default)
  VALUES
    (p_user_id, 'Salary', 'income', '#22C55E', 'dollar-sign', true),
    (p_user_id, 'Freelance', 'income', '#10B981', 'briefcase', true),
    (p_user_id, 'Investments', 'income', '#06B6D4', 'trending-up', true),
    (p_user_id, 'Other Income', 'income', '#14B8A6', 'plus-circle', true),
    (p_user_id, 'Groceries', 'expense', '#F59E0B', 'shopping-cart', true),
    (p_user_id, 'Dining Out', 'expense', '#EF4444', 'utensils', true),
    (p_user_id, 'Transportation', 'expense', '#8B5CF6', 'car', true),
    (p_user_id, 'Housing', 'expense', '#6366F1', 'home', true),
    (p_user_id, 'Utilities', 'expense', '#EC4899', 'zap', true),
    (p_user_id, 'Entertainment', 'expense', '#F97316', 'tv', true),
    (p_user_id, 'Healthcare', 'expense', '#14B8A6', 'heart', true),
    (p_user_id, 'Shopping', 'expense', '#A855F7', 'shopping-bag', true),
    (p_user_id, 'Other Expenses', 'expense', '#64748B', 'more-horizontal', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;