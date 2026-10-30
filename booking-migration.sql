CREATE TABLE IF NOT EXISTS booking_promotions (id integer PRIMARY KEY CHECK (id=1), entries jsonb NOT NULL);
INSERT INTO booking_promotions VALUES (1, '[{"code":"TRIPMATE10","discount":10,"active":true,"expiresAt":""},{"code":"WELCOME05","discount":5,"active":true,"expiresAt":""}]') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS cancellation_policy (
    id integer PRIMARY KEY CHECK (id = 1),
    free_cancel_days integer NOT NULL CHECK (free_cancel_days BETWEEN 0 AND 365),
    late_fee_nights integer NOT NULL CHECK (late_fee_nights BETWEEN 0 AND 30)
);
INSERT INTO cancellation_policy VALUES (1, 7, 1) ON CONFLICT DO NOTHING;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS free_cancel_days integer NOT NULL DEFAULT 7;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS late_fee_nights integer NOT NULL DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_previous_status text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee numeric(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id integer REFERENCES bookings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

-- Ranges use PostgreSQL's built-in GiST operators; no extension is required.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap' AND conrelid = 'bookings'::regclass) THEN
        ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
            int4range(listing_id, listing_id, '[]') WITH &&,
            daterange(check_in, check_out, '[)') WITH &&
        ) WHERE (status IN ('pending', 'confirmed', 'cancellation_requested'));
    END IF;
END $$;

-- Preserve the old fee basis when a delayed payment reaches a previously cancelled booking.
UPDATE bookings SET cancelled_at = updated_at,
    cancellation_fee = CASE WHEN check_in >= (updated_at AT TIME ZONE 'Asia/Manila')::date + free_cancel_days THEN 0
        ELSE subtotal / greatest(1, check_out - check_in) * late_fee_nights END
WHERE status = 'cancelled' AND cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION tripmate_notification_enabled(user_key integer, category text) RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE preferences jsonb;
BEGIN
    SELECT message::jsonb INTO preferences FROM notifications WHERE user_id=user_key AND notification_type='preferences' ORDER BY id DESC LIMIT 1;
    RETURN coalesce((preferences ->> category)::boolean, true);
EXCEPTION WHEN invalid_text_representation THEN RETURN true;
END $$;

CREATE OR REPLACE FUNCTION tripmate_credit_refund(booking_key integer) RETURNS void LANGUAGE sql AS $$
    INSERT INTO wallet_transactions (user_id, booking_id, amount, description)
    SELECT b.guest_id, b.id, round(greatest(0, sum(p.amount) - coalesce(b.cancellation_fee, 0)), 2),
        'Cancellation refund for booking #' || b.id
    FROM bookings b JOIN payments p ON p.booking_id = b.id AND p.status = 'paid'
    WHERE b.id = booking_key AND b.status = 'cancelled'
    GROUP BY b.id
    HAVING sum(p.amount) > coalesce(b.cancellation_fee, 0)
    ON CONFLICT (booking_id) DO UPDATE SET amount = EXCLUDED.amount
        WHERE wallet_transactions.amount < EXCLUDED.amount;
$$;

CREATE OR REPLACE FUNCTION tripmate_booking_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE event_title text; event_message text; host_key integer;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN RETURN NEW; END IF;
    SELECT host_id INTO host_key FROM listings WHERE id = NEW.listing_id;
    event_title := CASE NEW.status
        WHEN 'pending' THEN 'Booking pending payment'
        WHEN 'confirmed' THEN 'Booking confirmed'
        WHEN 'cancellation_requested' THEN 'Cancellation awaiting admin review'
        WHEN 'cancelled' THEN 'Booking cancelled'
        WHEN 'completed' THEN 'Stay completed'
        ELSE 'Booking updated' END;
    IF TG_OP = 'UPDATE' AND OLD.status = 'cancellation_requested' AND NEW.status <> 'cancelled' THEN
        event_title := 'Cancellation request declined';
    END IF;
    event_message := 'Booking #' || NEW.id || ': ' || event_title || '.';
    INSERT INTO notifications (user_id, booking_id, title, message, notification_type)
    SELECT id, NEW.id, event_title, event_message, 'booking' FROM users
    WHERE role = 'admin' OR (id IN (NEW.guest_id, host_key) AND tripmate_notification_enabled(id, 'booking'));
    IF NEW.status = 'cancelled' THEN PERFORM tripmate_credit_refund(NEW.id); END IF;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tripmate_booking_event ON bookings;
CREATE TRIGGER tripmate_booking_event AFTER INSERT OR UPDATE OF status ON bookings
    FOR EACH ROW EXECUTE FUNCTION tripmate_booking_event();

CREATE OR REPLACE FUNCTION tripmate_refund_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF tripmate_notification_enabled(NEW.user_id, 'payment') THEN
    INSERT INTO notifications (user_id, booking_id, title, message, notification_type)
    VALUES (NEW.user_id, NEW.booking_id, 'Refund credited',
        'Your TripMate Wallet refund for booking #' || NEW.booking_id || ' is PHP ' || NEW.amount || '.', 'payment');
    END IF;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tripmate_refund_event ON wallet_transactions;
CREATE TRIGGER tripmate_refund_event AFTER INSERT OR UPDATE OF amount ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION tripmate_refund_event();

CREATE OR REPLACE FUNCTION tripmate_cancellation_quote(booking_key integer)
RETURNS TABLE (paid_amount numeric, fee numeric, refund numeric) LANGUAGE sql STABLE AS $$
    SELECT p.amount, least(p.amount, f.amount), greatest(0, p.amount - f.amount)
    FROM bookings b
    CROSS JOIN LATERAL (SELECT coalesce(sum(amount), 0) AS amount FROM payments WHERE booking_id = b.id AND status = 'paid') p
    CROSS JOIN LATERAL (SELECT coalesce(b.cancellation_fee,
        CASE WHEN b.check_in >= (now() AT TIME ZONE 'Asia/Manila')::date + b.free_cancel_days THEN 0
        ELSE b.subtotal / greatest(1, b.check_out - b.check_in) * b.late_fee_nights END) AS amount) f
    WHERE b.id = booking_key;
$$;

CREATE OR REPLACE FUNCTION tripmate_cancel_booking(booking_key integer, actor_key integer, actor_role text,
    action text, expected_refund numeric DEFAULT NULL) RETURNS bookings LANGUAGE plpgsql AS $$
DECLARE b bookings; q record; host_key integer; today date := (now() AT TIME ZONE 'Asia/Manila')::date; fee numeric;
BEGIN
    SELECT * INTO b FROM bookings WHERE id = booking_key FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002'; END IF;
    SELECT host_id INTO host_key FROM listings WHERE id = b.listing_id;
    IF NOT (actor_role = 'admin' OR (action = 'request' AND b.guest_id = actor_key)
        OR (action = 'cancel' AND actor_role = 'host' AND host_key = actor_key)) THEN
        RAISE EXCEPTION 'You cannot change this booking.' USING ERRCODE = '42501';
    END IF;
    IF action NOT IN ('request', 'approve', 'reject', 'cancel') THEN
        RAISE EXCEPTION 'Invalid cancellation action.' USING ERRCODE = '22023';
    END IF;
    IF action IN ('approve', 'reject') AND actor_role <> 'admin' THEN
        RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
    END IF;
    IF b.status = 'cancelled' AND action <> 'reject' THEN RETURN b; END IF;
    IF action IN ('approve', 'reject') AND b.status <> 'cancellation_requested' THEN
        RAISE EXCEPTION 'There is no pending cancellation request.' USING ERRCODE = '22023';
    END IF;
    IF action IN ('request', 'cancel') AND (b.status = 'completed' OR b.check_out <= today
        OR (action = 'request' AND b.check_in < today)) THEN
        RAISE EXCEPTION 'This booking can no longer be cancelled online.' USING ERRCODE = '22023';
    END IF;
    IF action = 'request' AND b.status = 'cancellation_requested' THEN RETURN b; END IF;
    SELECT * INTO q FROM tripmate_cancellation_quote(b.id);
    IF action IN ('request', 'approve', 'cancel') AND (expected_refund IS NULL OR
        round(expected_refund, 2) <> round(CASE WHEN action = 'cancel' THEN q.paid_amount ELSE q.refund END, 2)) THEN
        RAISE EXCEPTION 'Refund amount changed. Review the latest cancellation quote.' USING ERRCODE = '40001';
    END IF;
    IF action = 'reject' THEN
        UPDATE bookings SET status = CASE WHEN q.paid_amount > 0 THEN 'confirmed' ELSE coalesce(cancellation_previous_status, 'pending') END,
            cancellation_requested_at = NULL, cancellation_previous_status = NULL, cancellation_fee = NULL, updated_at = now()
        WHERE id = b.id RETURNING * INTO b;
    ELSE
        fee := CASE WHEN action = 'cancel' THEN 0 ELSE coalesce(b.cancellation_fee,
            CASE WHEN b.check_in >= today + b.free_cancel_days THEN 0
            ELSE b.subtotal / greatest(1, b.check_out - b.check_in) * b.late_fee_nights END) END;
        UPDATE bookings SET
            status = CASE WHEN action = 'request' AND q.paid_amount > 0 THEN 'cancellation_requested' ELSE 'cancelled' END,
            cancellation_previous_status = CASE WHEN action = 'request' THEN b.status ELSE b.cancellation_previous_status END,
            cancellation_requested_at = coalesce(b.cancellation_requested_at, now()), cancellation_fee = round(fee, 2),
            cancelled_at = CASE WHEN action = 'request' AND q.paid_amount > 0 THEN NULL ELSE now() END, updated_at = now()
        WHERE id = b.id RETURNING * INTO b;
    END IF;
    RETURN b;
END $$;

CREATE OR REPLACE FUNCTION tripmate_verify_payment(payment_key integer) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE b bookings; p payments;
BEGIN
    SELECT * INTO p FROM payments WHERE id = payment_key;
    SELECT * INTO b FROM bookings WHERE id = p.booking_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002'; END IF;
    UPDATE payments SET status = 'paid', paid_at = coalesce(paid_at, now()) WHERE id = p.id;
    IF b.status = 'cancelled' THEN
        PERFORM tripmate_credit_refund(b.id);
        RETURN false;
    END IF;
    IF b.status = 'pending' THEN
        UPDATE bookings SET status = 'confirmed', updated_at = now() WHERE id = b.id;
    END IF;
    RETURN b.status IN ('pending', 'confirmed', 'cancellation_requested');
END $$;
