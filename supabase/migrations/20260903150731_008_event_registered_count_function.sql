/*
# Increment registered_count function for events

Creates a SECURITY DEFINER function to safely increment the registered_count
on an event when a user registers. This avoids race conditions and ensures
the count stays accurate even with concurrent registrations.
*/

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
