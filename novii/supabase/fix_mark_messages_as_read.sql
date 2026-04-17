-- Fix: unread message counter never resets.
--
-- Root cause: the existing RLS policy on `messages` only allows the SENDER to
-- update a row ("Users can update own sent messages"). The client-side
-- `markMessagesAsRead` is called by the RECEIVER, so the UPDATE silently
-- affects 0 rows under RLS. As a result `is_read` stays `false` forever and
-- the conversations list shows the total received count instead of the unread
-- count.
--
-- Fix: expose a SECURITY DEFINER RPC that lets the authenticated receiver
-- mark only their *received* messages as read. This avoids loosening the RLS
-- policy (which would let recipients edit other columns too).

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_sender_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.messages
     SET is_read = TRUE
   WHERE sender_id   = p_sender_id
     AND receiver_id = v_user_id
     AND (is_read IS DISTINCT FROM TRUE);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_messages_as_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(uuid) TO authenticated;
