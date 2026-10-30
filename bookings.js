import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const BOOKING_LABELS = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', cancellation_requested: 'Cancellation requested' };
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function validateDates(checkIn, checkOut, today = manilaToday()) {
    for (const date of [checkIn, checkOut]) {
        if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw fail('Choose valid stay dates.');
    }
    if (checkIn < today || checkOut <= checkIn) throw fail('Check-in must be today or later, and check-out must follow check-in.');
}

export function createBookingService(db) {
    let migration;
    const query = async (text, values = []) => {
        if (!db) throw fail('Booking service requires the Neon database connection.', 503);
        try { return await db.query(text, values); }
        catch (error) {
            const messages = {
                '23P01': ['These dates are already booked. Choose different dates.', 409],
                '40001': [error.message, 409], '42501': ['You cannot change this booking.', 403],
                'P0002': ['Booking not found.', 404], '22023': [error.message, 409]
            };
            const mapped = messages[error.code];
            if (mapped) throw fail(...mapped);
            throw error;
        }
    };
    const initialize = () => {
        if (!migration) migration = query(`DO $migration$ BEGIN\nPERFORM pg_advisory_xact_lock(722344, 1);\n${readFileSync(resolve('booking-migration.sql'), 'utf8')}\nEND $migration$;`).catch(error => {
            migration = null;
            throw error;
        });
        return migration;
    };
    const policy = async () => (await query('SELECT free_cancel_days, late_fee_nights FROM cancellation_policy WHERE id = 1'))[0];
    const savePolicy = async (value) => {
        if (!Number.isInteger(value.free_cancel_days) || value.free_cancel_days < 0 || value.free_cancel_days > 365 ||
            !Number.isInteger(value.late_fee_nights) || value.late_fee_nights < 0 || value.late_fee_nights > 30) throw fail('Use 0–365 free-cancellation days and 0–30 late-fee nights.');
        return (await query('UPDATE cancellation_policy SET free_cancel_days = $1, late_fee_nights = $2 WHERE id = 1 RETURNING free_cancel_days, late_fee_nights', [value.free_cancel_days, value.late_fee_nights]))[0];
    };
    const promotions = async () => (await query('SELECT entries FROM booking_promotions WHERE id=1'))[0].entries;
    const savePromotions = async (items) => {
        if (!Array.isArray(items) || items.length > 100 || new Set(items.map(item => item?.code)).size !== items.length ||
            items.some(item => !item || !/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(item.code) || !Number.isInteger(item.discount) || item.discount < 1 || item.discount > 50 ||
                typeof item.active !== 'boolean' || (item.expiresAt && (!/^\d{4}-\d{2}-\d{2}$/.test(item.expiresAt) || !Number.isFinite(Date.parse(item.expiresAt)) || new Date(item.expiresAt).toISOString().slice(0,10) !== item.expiresAt)))) throw fail('Invalid promotion settings.');
        return (await query('UPDATE booking_promotions SET entries=$1::jsonb WHERE id=1 RETURNING entries', [JSON.stringify(items)]))[0].entries;
    };
    const availability = async (listingId, checkIn, checkOut) => {
        validateDates(checkIn, checkOut);
        const rows = await query(`SELECT id FROM bookings WHERE listing_id = $1 AND status IN ('pending','confirmed','cancellation_requested') AND check_in < $3::date AND check_out > $2::date LIMIT 1`, [listingId, checkIn, checkOut]);
        return { available: rows.length === 0 };
    };
    const create = async (body, guestId, admin = false) => {
        validateDates(body.check_in, body.check_out);
        const listingId = Number(body.listing_id), guests = Number(body.guest_count);
        if (!Number.isInteger(listingId) || listingId < 1 || !Number.isInteger(guests) || guests < 1) throw fail('Choose a listing and a valid guest count.');
        const [listing] = await query("SELECT * FROM listings WHERE id = $1 AND status = 'published'", [listingId]);
        if (!listing) throw fail('This stay is no longer available.', 404);
        if (guests > listing.max_guests) throw fail(`This stay allows up to ${listing.max_guests} guests.`);
        if (!admin && (!Number.isInteger(body.cancellation_policy?.free_cancel_days) || !Number.isInteger(body.cancellation_policy?.late_fee_nights))) throw fail('Review the current cancellation policy before booking.', 409);
        if (!admin && body.terms_accepted !== true) throw fail('Accept the booking terms and cancellation policy.');
        const nights = (Date.parse(body.check_out) - Date.parse(body.check_in)) / 86400000;
        const subtotal = Number(listing.price_per_night) * nights, cleaning = Number(listing.cleaning_fee);
        const service = Math.round((subtotal + cleaning) * 0.10), taxes = Math.round(subtotal * 0.1125);
        const beforeDiscount = subtotal + cleaning + service + taxes;
        const code = String(body.promo_code || '').trim().toUpperCase();
        const promotion = code ? (await promotions()).find(item => item.code === code && item.active && (!item.expiresAt || item.expiresAt >= manilaToday())) : null;
        if (code && !promotion) throw fail('This promo code is no longer available. Review your booking total.');
        const total = beforeDiscount - Math.round(beforeDiscount * (promotion ? promotion.discount / 100 : 0));
        if (!admin && Number(body.total_amount) !== total) throw fail('The booking price changed. Review the current price before paying.', 409);
        if (!Number.isFinite(total) || total <= 0) throw fail('This stay does not have a valid booking price.');
        const specialRequests = String(body.special_requests || '').trim();
        if (specialRequests.length > 2000) throw fail('Special requests must be 2,000 characters or fewer.');
        const booking = (await query(`INSERT INTO bookings
            (listing_id, guest_id, check_in, check_out, guest_count, subtotal, cleaning_fee, service_fee, taxes, total_amount,
             payment_method, special_requests, terms_accepted, status, free_cancel_days, late_fee_nights)
            SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'qrph',$11,$12,'pending',free_cancel_days,late_fee_nights FROM cancellation_policy WHERE id=1 AND ($15::boolean OR (free_cancel_days=$13 AND late_fee_nights=$14)) RETURNING *`,
            [listingId, guestId, body.check_in, body.check_out, guests, subtotal, cleaning, service, taxes, total, specialRequests || null, body.terms_accepted === true, body.cancellation_policy?.free_cancel_days ?? null, body.cancellation_policy?.late_fee_nights ?? null, admin]))[0];
        if (!booking) throw fail('The cancellation policy changed. Reload and review the new rules before booking.', 409);
        return booking;
    };
    const quote = async (id, actor) => {
        const [b] = await query(`SELECT b.*, l.host_id, q.paid_amount, round(q.fee,2) AS fee, round(q.refund,2) AS refund
            FROM bookings b JOIN listings l ON l.id=b.listing_id CROSS JOIN LATERAL tripmate_cancellation_quote(b.id) q WHERE b.id=$1`, [id]);
        if (!b || !(actor.role === 'admin' || b.guest_id === actor.id || (actor.role === 'host' && b.host_id === actor.id))) throw fail('Booking not found.', 404);
        return { booking_id: b.id, status: b.status, paid_amount: Number(b.paid_amount), cancellation_fee: Number(b.fee), refund_amount: Number(b.refund),
            requires_approval: Number(b.paid_amount) > 0, free_cancel_days: b.free_cancel_days, late_fee_nights: b.late_fee_nights,
            can_cancel: ['pending','confirmed'].includes(b.status) && String(b.check_in).slice(0,10) >= manilaToday() };
    };
    const cancel = async (id, actor, action, expectedRefund) => {
        if (expectedRefund !== undefined && (typeof expectedRefund !== 'number' || !Number.isFinite(expectedRefund) || expectedRefund < 0)) throw fail('Invalid refund amount.');
        return (await query('SELECT * FROM tripmate_cancel_booking($1,$2,$3,$4,$5)', [id, actor.id, actor.role, action, expectedRefund ?? null]))[0];
    };
    const updateStatus = async (id, status) => {
        if (!['confirmed','completed'].includes(status)) throw fail('Use the cancellation review controls to cancel this booking.');
        const [booking] = await query(`UPDATE bookings b SET status=$2, updated_at=now() WHERE id=$1
            AND (($2='confirmed' AND status='pending' AND EXISTS (SELECT 1 FROM payments WHERE booking_id=b.id AND status='paid'))
                OR ($2='completed' AND status='confirmed' AND check_out <= (now() AT TIME ZONE 'Asia/Manila')::date)) RETURNING *`, [id, status]);
        if (!booking) throw fail('Only paid pending bookings can be confirmed; only confirmed stays that have ended can be completed.', 409);
        return booking;
    };
    return { query, initialize, policy, savePolicy, promotions, savePromotions, availability, create, quote, cancel, updateStatus,
        verifyPayment: async (id) => (await query('SELECT tripmate_verify_payment($1) AS confirmed', [id]))[0].confirmed };
}
