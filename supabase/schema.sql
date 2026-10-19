/*
# Otaku Mania — Schéma complet (consolidé)

Ce script regroupe toutes les migrations du projet en un seul fichier idempotent.
À exécuter une seule fois sur un nouveau projet Supabase via le SQL Editor du dashboard.

Contenu :
1. Tables : profiles, categories, products, reviews, events, tickets, orders,
   order_items, news_articles, audit_logs, payments
2. Politiques RLS (lecture publique, écriture propriétaire, accès admins)
3. Sécurité : colonne role verrouillée, fonction set_user_role()
4. Fonctions : update_order_from_payment(), increment_registered_count(),
   handle_new_user() + trigger auto profil / super_admin pour jokad312@gmail.com
5. Buckets de stockage : admin-images, admin-files, avatars
6. Index
*/

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'user' CHECK (
    role IN ('user', 'creator', 'organizer', 'admin_content', 'admin_moderation', 'super_admin')
  ),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are visible" ON profiles;
CREATE POLICY "Public profiles are visible"
  ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Super admin can update all profiles" ON profiles;
CREATE POLICY "Super admin can update all profiles"
  ON profiles FOR UPDATE TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (username, full_name, avatar_url, bio) ON profiles TO authenticated;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Package',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'pdf',
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all products" ON products;
CREATE POLICY "Admins can read all products"
  ON products FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Creators and admins can insert products" ON products;
CREATE POLICY "Creators and admins can insert products"
  ON products FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'creator'))
  );

DROP POLICY IF EXISTS "Creators manage own products, admins manage all" ON products;
CREATE POLICY "Creators manage own products, admins manage all"
  ON products FOR UPDATE TO authenticated USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  ) WITH CHECK (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE TO authenticated USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_reviews_immediate" ON reviews;
CREATE POLICY "select_all_reviews_immediate" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can moderate reviews" ON reviews;
CREATE POLICY "Admins can moderate reviews"
  ON reviews FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_moderation'))
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_moderation'))
  );

DROP POLICY IF EXISTS "Users can delete own review, admins can delete any" ON reviews;
CREATE POLICY "Users can delete own review, admins can delete any"
  ON reviews FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_moderation'))
  );

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Côte d''Ivoire',
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  venue text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT 'convention' CHECK (
    event_type IN ('convention', 'cosplay_contest', 'esport_tournament', 'screening', 'workshop')
  ),
  is_free boolean NOT NULL DEFAULT false,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  capacity integer NOT NULL DEFAULT 100,
  registered_count integer NOT NULL DEFAULT 0,
  organizer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all events" ON events;
CREATE POLICY "Admins can read all events"
  ON events FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'organizer'))
  );

DROP POLICY IF EXISTS "Organizers and admins can insert events" ON events;
CREATE POLICY "Organizers and admins can insert events"
  ON events FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'organizer'))
  );

DROP POLICY IF EXISTS "Organizers manage own events, admins manage all" ON events;
CREATE POLICY "Organizers manage own events, admins manage all"
  ON events FOR UPDATE TO authenticated USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  ) WITH CHECK (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Admins and organizers can delete events" ON events;
CREATE POLICY "Admins and organizers can delete events"
  ON events FOR DELETE TO authenticated USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_code text UNIQUE NOT NULL,
  qr_data text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all tickets" ON tickets;
CREATE POLICY "Admins can read all tickets"
  ON tickets FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'admin_moderation'))
  );

DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update ticket status" ON tickets;
CREATE POLICY "Admins can update ticket status"
  ON tickets FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text NOT NULL DEFAULT 'card',
  payment_id text,
  payment_external_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'admin_moderation')
    )
  );

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_external_id
  ON orders(payment_external_id)
  WHERE payment_external_id IS NOT NULL;

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Users can insert items in own orders" ON order_items;
CREATE POLICY "Users can insert items in own orders"
  ON order_items FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ============================================
-- NEWS ARTICLES
-- ============================================
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all news" ON news_articles;
CREATE POLICY "Admins can read all news"
  ON news_articles FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

DROP POLICY IF EXISTS "Admins can manage news" ON news_articles;
CREATE POLICY "Admins can manage news"
  ON news_articles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_moderation'))
  );

DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpay_id text UNIQUE NOT NULL,
  external_id text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  provider text,
  country text,
  phone_number text,
  reference text,
  provider_reference text,
  gateway_url text,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_creator ON products(creator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_payments_kpay_id ON payments(kpay_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION set_user_role(p_target_user uuid, p_new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Not authorized to change user roles';
  END IF;

  IF p_new_role NOT IN ('user', 'creator', 'organizer', 'admin_content', 'admin_moderation', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;

  UPDATE profiles SET role = p_new_role WHERE id = p_target_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION update_order_from_payment(
  p_kpay_id text,
  p_external_id text,
  p_status text,
  p_amount numeric,
  p_currency text DEFAULT NULL,
  p_provider text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_provider_reference text DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL,
  p_failed_at timestamptz DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_current_status text;
  v_new_order_status text;
BEGIN
  SELECT id INTO v_order_id
  FROM orders
  WHERE payment_external_id = p_external_id OR payment_id = p_external_id
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RETURN;
  END IF;

  v_new_order_status := CASE p_status
    WHEN 'COMPLETED' THEN 'paid'
    WHEN 'FAILED' THEN 'failed'
    WHEN 'CANCELLED' THEN 'failed'
    ELSE NULL
  END;

  INSERT INTO payments (
    kpay_id, external_id, order_id, status, amount, currency,
    provider, country, phone_number, reference, provider_reference,
    completed_at, failed_at, failure_reason, updated_at
  ) VALUES (
    p_kpay_id, p_external_id, v_order_id, p_status, p_amount, p_currency,
    p_provider, p_country, p_phone_number, p_reference, p_provider_reference,
    p_completed_at, p_failed_at, p_failure_reason, now()
  )
  ON CONFLICT (kpay_id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    currency = COALESCE(EXCLUDED.currency, payments.currency),
    provider = COALESCE(EXCLUDED.provider, payments.provider),
    country = COALESCE(EXCLUDED.country, payments.country),
    phone_number = COALESCE(EXCLUDED.phone_number, payments.phone_number),
    reference = COALESCE(EXCLUDED.reference, payments.reference),
    provider_reference = COALESCE(EXCLUDED.provider_reference, payments.provider_reference),
    completed_at = COALESCE(EXCLUDED.completed_at, payments.completed_at),
    failed_at = COALESCE(EXCLUDED.failed_at, payments.failed_at),
    failure_reason = COALESCE(EXCLUDED.failure_reason, payments.failure_reason),
    updated_at = now();

  IF v_new_order_status IS NOT NULL THEN
    SELECT status INTO v_current_status FROM orders WHERE id = v_order_id;
    IF v_current_status = 'pending' THEN
      UPDATE orders SET status = v_new_order_status, payment_id = p_kpay_id
      WHERE id = v_order_id;
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_order_from_payment(
  text, text, text, numeric, text, text, text, text, text, text,
  timestamptz, timestamptz, text
) FROM anon;
REVOKE EXECUTE ON FUNCTION update_order_from_payment(
  text, text, text, numeric, text, text, text, text, text, text,
  timestamptz, timestamptz, text
) FROM authenticated;

CREATE OR REPLACE FUNCTION increment_registered_count(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE events
  SET registered_count = registered_count + 1
  WHERE id = p_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_registered_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION increment_registered_count(uuid) TO authenticated;

-- ============================================
-- AUTO PROFILE + SUPER ADMIN TRIGGER
-- ============================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

UPDATE public.profiles p
SET role = 'super_admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'jokad312@gmail.com';

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-images', 'admin-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-files', 'admin-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload admin images" ON storage.objects;
CREATE POLICY "Authenticated can upload admin images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-images');

DROP POLICY IF EXISTS "Public can read admin images" ON storage.objects;
CREATE POLICY "Public can read admin images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'admin-images');

DROP POLICY IF EXISTS "Authenticated can delete admin images" ON storage.objects;
CREATE POLICY "Authenticated can delete admin images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-images');

DROP POLICY IF EXISTS "Authenticated can upload admin files" ON storage.objects;
CREATE POLICY "Authenticated can upload admin files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-files');

DROP POLICY IF EXISTS "Public can read admin files" ON storage.objects;
CREATE POLICY "Public can read admin files"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'admin-files');

DROP POLICY IF EXISTS "Authenticated can delete admin files" ON storage.objects;
CREATE POLICY "Authenticated can delete admin files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-files');

DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatar_read_public" ON storage.objects;
CREATE POLICY "avatar_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
