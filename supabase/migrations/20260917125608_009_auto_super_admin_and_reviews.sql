/*
# Auto super_admin for jokad312@gmail.com + reviews without moderation

1. Creates a trigger that auto-assigns super_admin role to jokad312@gmail.com
   on signup, and creates the profile row automatically.
2. Ensures reviews are visible immediately (no moderation filter needed).
3. Upgrades existing jokad312@gmail.com user if already registered.
*/

-- 1. Create the function that handles new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'jokad312@gmail.com' THEN 'super_admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. If jokad312@gmail.com already has a profile, upgrade it to super_admin
UPDATE public.profiles p
SET role = 'super_admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'jokad312@gmail.com';

-- 4. Drop the "Approved reviews are public" policy and replace with a permissive one
-- so ALL reviews are visible immediately without moderation.
DROP POLICY IF EXISTS "Approved reviews are public, users see own" ON reviews;
DROP POLICY IF EXISTS "select_all_reviews_immediate" ON reviews;
CREATE POLICY "select_all_reviews_immediate" ON reviews
  FOR SELECT TO anon, authenticated USING (true);
