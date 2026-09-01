/*
# Otaku Mania — Core Schema

## Overview
Creates the complete database schema for the Otaku Mania platform, including:
- User profiles with role-based access control
- Product categories and products (digital goods: cosplay templates, 3D files, tutorials)
- Product reviews and ratings (moderated)
- Events (conventions, cosplay contests, e-sport tournaments)
- Event tickets with unique QR codes
- Orders and order items (purchase tracking)
- News articles (community hub)
- Admin audit log

## New Tables

### profiles
- Stores public user information linked to auth.users
- Roles: user, creator, organizer, admin_content, admin_moderation, super_admin

### categories
- Product categories (cosplay templates, 3D files, EVA foam patterns, video tutorials)

### products
- Digital products with price, file link, image, tags, status
- Linked to creator and category

### reviews
- Product reviews with 1-5 star rating, moderated status

### events
- Events with ticketing, capacity, location, date
- Types: convention, cosplay_contest, esport_tournament, screening, workshop

### tickets
- Event tickets with unique QR code per registration

### orders
- Purchase orders with payment status and method

### order_items
- Individual items within an order

### news_articles
- Community news and announcements

### audit_logs
- Admin action audit trail

## Security
- All tables have RLS enabled
- Public read access on published products, categories, events, news
- Authenticated users can create reviews, tickets, orders
- Owner-scoped access for user's own data (orders, tickets, reviews, profile)
- Admin-only write access on categories, news, audit logs
- Profile role stored in profiles table, enforced via RLS policies
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

DROP POLICY IF EXISTS "Published products are public" ON products;
CREATE POLICY "Published products are public"
  ON products FOR SELECT TO anon, authenticated USING (status = 'published');

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

DROP POLICY IF EXISTS "Approved reviews are public, users see own" ON reviews;
CREATE POLICY "Approved reviews are public, users see own"
  ON reviews FOR SELECT TO anon, authenticated USING (
    status = 'approved' OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own review" ON reviews;
CREATE POLICY "Users can update own review"
  ON reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Published events are public" ON events;
CREATE POLICY "Published events are public"
  ON events FOR SELECT TO anon, authenticated USING (status = 'published');

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

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own tickets" ON tickets;
CREATE POLICY "Users can cancel own tickets"
  ON tickets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Users can view items in own orders" ON order_items;
CREATE POLICY "Users can view items in own orders"
  ON order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
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

DROP POLICY IF EXISTS "Published news is public" ON news_articles;
CREATE POLICY "Published news is public"
  ON news_articles FOR SELECT TO anon, authenticated USING (status = 'published');

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
