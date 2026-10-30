# Booking, cancellation, and notification workflow

Run `npm install` and `npm test`. The tests use disposable in-memory PostgreSQL; they do not contact Neon or PayMongo.

## Running the app

Provide `DATABASE_URL` (or `NEON_DATABASE_URL` / `NETLIFY_DATABASE_URL`), `JWT_SECRET`, and the PayMongo configuration in the server environment. Create the base tables with `schema.sql` on a new database. `npm start` serves TripMate on port 3000.

The server applies `booking-migration.sql` in one transaction on its first database-backed request. This adds policy snapshots, cancellation review, notification events, and a PostgreSQL constraint preventing overlapping pending, confirmed, or cancellation-requested stays. Existing overlapping bookings cause migration to fail without deleting records; resolve those conflicts deliberately before retrying. Adjacent checkout/check-in dates are allowed. Unpaid reservations remain held until cancelled; returning from a cancelled checkout releases an eligible unpaid reservation.

Netlify includes the migration file through `netlify.toml`. The Neon SQL connection is required for these transactional operations; the REST-only configuration is insufficient.

## User flows

- Guests see an exact paid amount, cancellation fee, and wallet refund before requesting cancellation. Paid requests stay reserved until admin approval. Unpaid cancellations are immediate.
- Admin → Bookings contains the cancellation review queue. Approving cancels and credits the wallet atomically; declining retains the booking. Host/admin initiated cancellations refund the full amount paid.
- Admin → Settings edits the free-cancellation days and late-fee nights for new bookings. Existing bookings retain their rules. Deadlines use Philippine calendar dates, and guests cannot initiate cancellation after the check-in date.
- Refunds are TripMate Wallet credits. No original-payment-method payout, wallet withdrawal, or wallet checkout redemption is implemented.
- Booking, review decision, and refund notifications are persisted per account. The inbox refreshes every 30 seconds while visible and when the page regains focus. Mark-as-read is persisted and scoped to the account. Guest booking/payment notification preferences apply; admins always receive booking events requiring review. These are in-app notifications, not email, SMS, or device push.
- Online prices and active promotion discounts are calculated on the server. Admin promotion changes are now stored in the database; old browser-only custom promotions must be saved again to publish them.

Use `node mobile-app/scripts/build-web.mjs` to sync web changes into the mobile assets. Building/installing a new APK is a separate step.
