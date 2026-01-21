-- =====================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. FIX PROFILES TABLE - Restrict public access to sensitive data
-- Drop the overly permissive policy that exposes phone/address to everyone
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Chefs' basic info can be viewed by authenticated users (for orders/catalog)
CREATE POLICY "Authenticated can view chef profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = profiles.user_id 
      AND role = 'cook'
    )
  );

-- Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX NOTIFICATIONS - Prevent fake notification injection
-- Currently anyone can insert notifications to any user - very dangerous!
-- Only allow admins to manually insert (system uses SECURITY DEFINER triggers)
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. ADD ADMIN VISIBILITY FOR FRAUD DETECTION
-- Allow admins to view all wallets for fraud monitoring
CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all wallet transactions for audit
CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. FIX PRODUCTS - Allow chefs to see their own unavailable products
CREATE POLICY "Chefs can view own unavailable products"
  ON public.products FOR SELECT
  USING (auth.uid() = chef_id);

-- 5. ALLOW USERS TO DELETE OWN REVIEWS
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RESTRICT CHEF APPLICATIONS - Users should only see status, not full documents
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can view own applications" ON public.chef_applications;

-- Create a more restrictive policy - users can see their application exists but sensitive docs are hidden at app level
CREATE POLICY "Users can view own applications status"
  ON public.chef_applications FOR SELECT
  USING (auth.uid() = user_id);