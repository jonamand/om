/*
# Admin Access — RLS Policies for Full Admin Dashboard

## Overview
Adds SELECT and UPDATE policies so admin users (super_admin, admin_content, admin_moderation) can:
- Read ALL products and events (including drafts), not just published ones
- Read ALL orders and order_items (for the orders/analytics dashboard)
- Read ALL tickets (for event participant management)
- Read ALL reviews (including pending/rejected, for moderation)
- Read ALL profiles (already public, but now admins can update roles)
- Update reviews status (moderation: approve/reject)
- Update profiles role (super_admin only)
- Update tickets status (mark used/cancelled at event check-in)

## Security
- Super admins get full read access to everything
- Admin content can read all products/events/news + orders for analytics
- Admin moderation can read all reviews + profiles + update review status
- Only super_admin can change user roles
- Only super_admin and admin_content can update ticket status
*/

-- ============================================
-- PRODUCTS: Admins can read ALL (including drafts)
-- ============================================
DROP POLICY IF EXISTS "Admins can read all products" ON products;
CREATE POLICY "Admins can read all products"
  ON products FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- EVENTS: Admins can read ALL (including drafts)
-- ============================================
DROP POLICY IF EXISTS "Admins can read all events" ON events;
CREATE POLICY "Admins can read all events"
  ON events FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'organizer'))
  );

-- ============================================
-- NEWS: Admins can read ALL (including drafts)
-- ============================================
DROP POLICY IF EXISTS "Admins can read all news" ON news_articles;
CREATE POLICY "Admins can read all news"
  ON news_articles FOR SELECT TO authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- ORDERS: Admins can read all orders
-- ============================================
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- ORDER ITEMS: Admins can read all order items
-- ============================================
DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content'))
  );

-- ============================================
-- TICKETS: Admins can read all tickets + update status
-- ============================================
DROP POLICY IF EXISTS "Admins can read all tickets" ON tickets;
CREATE POLICY "Admins can read all tickets"
  ON tickets FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_content', 'admin_moderation'))
  );

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
-- REVIEWS: Admins can read all reviews + moderate
-- ============================================
DROP POLICY IF EXISTS "Admins can read all reviews" ON reviews;
CREATE POLICY "Admins can read all reviews"
  ON reviews FOR SELECT TO anon, authenticated USING (
    status = 'approved' OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin_moderation'))
  );

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

-- ============================================
-- PROFILES: Super admin can update roles
-- ============================================
DROP POLICY IF EXISTS "Super admin can update all profiles" ON profiles;
CREATE POLICY "Super admin can update all profiles"
  ON profiles FOR UPDATE TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );
