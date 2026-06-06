-- Remove paid-tier gating from member-center features.
-- Run this in Supabase SQL Editor after member_center_full_deploy.sql has been applied.

CREATE OR REPLACE FUNCTION require_premium_member(input_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF input_account_id IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION require_premium_member(UUID) FROM PUBLIC, anon, authenticated;
