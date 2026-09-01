/*
# Separate Admin and User Profiles — Secure Role Management

## Overview
This migration enforces a strict separation between admin and user profiles:
- The `role` column on `profiles` is no longer directly writable by users through the data API.
- Only a `super_admin` can change another user's role, via a SECURITY DEFINER function.
- Admins cannot create orders (orders are blocked for admin roles at the policy level).

## Changes
1. Revoke UPDATE on `profiles.role` from `authenticated` — users can no longer change their own or anyone's role.
2. Grant UPDATE only on user-editable columns (username, full_name, avatar_url, bio).
3. Create `set_user_role()` SECURITY DEFINER function — only super_admin can call it, validates the new role.
4. Revoke INSERT on `orders` for admin roles — admins don't need to buy products.
5. Add order INSERT policy that excludes admin roles.

## Security
- Role column is server-controlled; no client can forge a role change.
- The SECURITY DEFINER function checks `auth.uid()` against the caller's own profile, not a parameter.
- Admins are blocked from creating orders at the database level.
*/

-- ============================================
-- 1. Lock down the role column on profiles
-- ============================================
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (username, full_name, avatar_url, bio) ON profiles TO authenticated;

-- ============================================
-- 2. Create set_user_role() function
-- ============================================
CREATE OR REPLACE FUNCTION set_user_role(p_target_user uuid, p_new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Get the CALLER's role (not a parameter)
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Not authorized to change user roles';
  END IF;

  -- Validate the new role value
  IF p_new_role NOT IN ('user', 'creator', 'organizer', 'admin_content', 'admin_moderation', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;

  -- Update the target user's role
  UPDATE profiles SET role = p_new_role WHERE id = p_target_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text) TO authenticated;

-- ============================================
-- 3. Block admins from creating orders
-- ============================================
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
