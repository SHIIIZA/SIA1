CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name varchar(150) NOT NULL,
    email varchar(250) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role varchar(20) NOT NULL DEFAULT 'guest',
    business_name varchar(200),
    phone varchar(40),
    avatar text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    host_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    description text,
    property_type varchar(50) NOT NULL,
    location varchar(255) NOT NULL,
    price_per_night numeric(10,2) NOT NULL CHECK (price_per_night >= 0),
    max_guests integer NOT NULL CHECK (max_guests > 0),
    bedrooms integer NOT NULL DEFAULT 1,
    bathrooms integer NOT NULL DEFAULT 1,
    cleaning_fee numeric(10,2) NOT NULL DEFAULT 0,
    status varchar(30) NOT NULL DEFAULT 'draft',
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    guest_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id integer NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    check_in date NOT NULL,
    check_out date NOT NULL,
    guest_count integer NOT NULL CHECK (guest_count > 0),
    subtotal numeric(10,2) NOT NULL DEFAULT 0,
    cleaning_fee numeric(10,2) NOT NULL DEFAULT 0,
    service_fee numeric(10,2) NOT NULL DEFAULT 0,
    taxes numeric(10,2) NOT NULL DEFAULT 0,
    total_amount numeric(10,2) NOT NULL DEFAULT 0,
    payment_method varchar(30),
    special_requests text,
    terms_accepted boolean NOT NULL DEFAULT false,
    status varchar(30) NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (check_out > check_in)
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS payments (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    booking_id integer NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method varchar(30) NOT NULL,
    amount numeric(10,2) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'pending',
    transaction_reference varchar(255),
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id integer NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    message text NOT NULL,
    notification_type varchar(50),
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id integer NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    booking_id integer NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    host_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id integer NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'pending',
    requested_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS saved_searches (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_name varchar(150),
    filters jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_guest_id_idx ON bookings (guest_id);
CREATE INDEX IF NOT EXISTS bookings_listing_id_idx ON bookings (listing_id);
CREATE INDEX IF NOT EXISTS listings_host_id_idx ON listings (host_id);
