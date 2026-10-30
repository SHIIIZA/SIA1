import { createBookingService, BOOKING_LABELS } from "./bookings.js";
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { neon as neonClient, types as pgTypes } from "@neondatabase/serverless";

// Calendar dates must stay YYYY-MM-DD across server time zones.
pgTypes.setTypeParser(1082, value => value);
const scrypt = promisify(scryptCallback);
const root = process.cwd();
const env = {};
try {
    const text = readFileSync(join(root, ".env"), "utf8");
    text.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    });
} catch { /* Environment variables may be provided by the process. */ }

const config = {
    apiUrl: process.env.NEON_API_URL || env.NEON_API_URL,
    authUrl: process.env.NEON_AUTH_URL || env.NEON_AUTH_URL,
    apiKey: process.env.NEON_API_KEY || env.NEON_API_KEY,
    databaseUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL || env.DATABASE_URL || env.NEON_DATABASE_URL || env.NETLIFY_DATABASE_URL,
    paymongoSecretKey: String(process.env.PAYMONGO_SECRET_KEY || env.PAYMONGO_SECRET_KEY || "").trim(),
    jwtSecret: process.env.JWT_SECRET || env.JWT_SECRET || "change-this-secret",
    port: Number(process.env.PORT || env.PORT || 3000),
    frontendUrl: process.env.FRONTEND_URL || env.FRONTEND_URL || "http://localhost:3000"
};

function isPlaceholder(value) {
    return !value || /(?:replace_with|user:password@host|change-this)/i.test(value);
}

function getFrontendUrl(req) {
    if (!isPlaceholder(config.frontendUrl) && config.frontendUrl !== "http://localhost:3000") {
        return config.frontendUrl.replace(/\/$/, "");
    }

    const forwardedProto = req.headers["x-forwarded-proto"] || "http";
    const protocol = String(forwardedProto).split(",")[0].trim();
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return host ? `${protocol}://${host}`.replace(/\/$/, "") : "http://localhost:3000";
}

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";

const CATALOG_LISTINGS = [
    {
        title: "Happy Hut", property_type: "Cabin", location: "San Felipe, Zambales",
        price_per_night: 2000, max_guests: 4, bedrooms: 1, bathrooms: 1,
        images: ["https://cf.bstatic.com/xdata/images/hotel/max1024x768/630810990.jpg?k=f0a258fd952f19c7285f4e99e64664bc423cd779166b639a29d87037cb90b2ac&o="],
        amenities: ["Wifi", "Kitchen", "Beachfront", "Pet friendly"]
    },
    {
        title: "Baey bogan Homestay", property_type: "House rental", location: "Sagada, Mountain Province",
        price_per_night: 1800, max_guests: 4, bedrooms: 2, bathrooms: 1,
        images: ["https://cf.bstatic.com/xdata/images/hotel/max1024x768/184656762.jpg?k=03df05cdd232e5aec61fb79b29314d5d84e8eb5904f33efa84a05dd9b1800e80&o="],
        amenities: ["Wifi", "Kitchen", "Air conditioning"]
    },
    {
        title: "Baguio Holiday Villas", property_type: "Villa", location: "Baguio City, Benguet",
        price_per_night: 4300, max_guests: 6, bedrooms: 3, bathrooms: 2,
        images: ["https://pix8.agoda.net/hotelImages/275905/0/2bfa720cb4d3471781e35efcbe6c3dfe.jpg?ce=2&s=375x"],
        amenities: ["Wifi", "Kitchen", "Air conditioning", "Pet friendly"]
    },
    {
        title: "Sunset Villa", property_type: "Villa", location: "Coron, Palawan",
        price_per_night: 5200, max_guests: 8, bedrooms: 4, bathrooms: 3,
        images: ["https://discovery.s14-host.com/qkUByrarp5PILHjccAD3jHDhtozxLY-metaU3Vuc2V0LVZpbGxhLURlbHV4ZS1WZXJhbmRhLmpwZw==-.jpg"],
        amenities: ["Wifi", "Pool", "Kitchen", "Beachfront"]
    },
    {
        title: "Kubo Homestay", property_type: "Cabin", location: "El Nido, Palawan",
        price_per_night: 3600, max_guests: 4, bedrooms: 2, bathrooms: 1,
        images: ["https://a0.muscache.com/im/pictures/d64b6a63-3599-4fa3-a6dc-3062a952202b.jpg?im_w=720"],
        amenities: ["Wifi", "Beachfront"]
    },
    {
        title: "Ivatan Stone House", property_type: "House rental", location: "Basco, Batanes",
        price_per_night: 2600, max_guests: 2, bedrooms: 1, bathrooms: 1,
        images: ["https://dynamic-media-cdn.tripadvisor.com/media/photo-o/25/1d/9d/8d/house-of-dakay-in-ivana.jpg?w=900&h=500&s=1"],
        amenities: ["Wifi", "Kitchen", "Pet friendly"]
    }
];

let sql = null;
let databaseConfigError = null;
if (config.databaseUrl) {
    try {
        sql = neonClient(config.databaseUrl);
    } catch {
        databaseConfigError = "Neon database URL is invalid.";
    }
}

const bookingService = createBookingService(sql);

if (!sql && (!config.apiUrl || !config.apiKey)) {
    console.warn("Missing Neon DATABASE_URL/NEON_DATABASE_URL or NEON_API_URL/NEON_API_KEY. Add a Neon connection setting to .env before starting the server.");
}

export function corsHeaders(origin) {
    const configuredOrigin = String(process.env.FRONTEND_URL || env.FRONTEND_URL || "").replace(/\/$/, "");
    const mobileOrigins = new Set(["https://localhost", "http://localhost", "capacitor://localhost"]);
    const requestOrigin = String(origin || "").replace(/\/$/, "");
    const responseOrigin = requestOrigin && (requestOrigin === configuredOrigin || mobileOrigins.has(requestOrigin))
        ? requestOrigin
        : configuredOrigin || "*";
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": responseOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        ...(requestOrigin === responseOrigin && responseOrigin !== "*" ? { Vary: "Origin" } : {})
    };
}

function json(res, status, data) {
    res.writeHead(status, {
        ...corsHeaders(res.requestOrigin),
        "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
            if (body.length > 1_000_000) {
                reject(Object.assign(new Error("Request body is too large."), { status: 413 }));
                req.destroy();
            }
        });
        req.on("end", () => {
            req.rawBody = body;
            try { resolve(body ? JSON.parse(body) : {}); } catch {
                reject(Object.assign(new Error("Invalid JSON body."), { status: 400 }));
            }
        });
        req.on("error", reject);
    });
}

export function findVerifiedPaidCheckoutPayment(event, providerSession, payment) {
    const eventSession = event?.data;
    const session = providerSession?.data;
    const attributes = session?.attributes;
    const bookingReference = attributes?.metadata?.booking_id || attributes?.reference_number;
    if (event?.type !== "checkout_session.payment.paid" ||
        !eventSession?.id ||
        eventSession.id !== session?.id ||
        typeof event.livemode !== "boolean" ||
        event.livemode !== attributes?.livemode ||
        String(bookingReference || "") !== String(payment?.booking_id || "")) {
        return null;
    }

    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) return null;
    return (Array.isArray(attributes.payments) ? attributes.payments : []).find((providerPayment) => {
        const paymentAttributes = providerPayment?.attributes;
        return ["paid", "succeeded"].includes(String(paymentAttributes?.status || "").toLowerCase()) &&
            String(paymentAttributes?.currency || "").toUpperCase() === "PHP" &&
            Number.isFinite(Number(paymentAttributes?.amount)) &&
            Math.round(Number(paymentAttributes.amount)) === expectedAmount;
    }) || null;
}

const SQL_TABLES = new Set(["users", "listings", "bookings", "payments", "wishlists", "notifications", "reviews", "payouts", "saved_searches"]);
const SQL_IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

function sqlValue(value) {
    if (value !== null && typeof value === "object") return JSON.stringify(value);
    return value;
}

async function neonDatabase(path, options = {}) {
    const requestUrl = new URL(path, "https://neon.local");
    const table = requestUrl.pathname.split("/").filter(Boolean)[0];
    if (!SQL_TABLES.has(table)) throw Object.assign(new Error(`Unsupported database table: ${table}`), { status: 500 });

    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : {};
    const params = [];
    const parameter = (value) => { params.push(sqlValue(value)); return `$${params.length}`; };
    const filters = [];
    for (const [key, raw] of requestUrl.searchParams) {
        if (["select", "order"].includes(key) || !SQL_IDENTIFIER.test(key)) continue;
        if (raw.startsWith("eq.")) filters.push(`"${key}" = ${parameter(raw.slice(3))}`);
        if (raw.startsWith("in.(") && raw.endsWith(")")) {
            const values = raw.slice(4, -1).split(",").filter(Boolean).map(parameter);
            if (values.length) filters.push(`"${key}" IN (${values.join(", ")})`);
        }
    }
    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const order = requestUrl.searchParams.get("order");
    const orderSql = order && SQL_IDENTIFIER.test(order.replace(/\.(asc|desc)$/, ""))
        ? ` ORDER BY "${order.replace(/\.(asc|desc)$/, "")}"${order.endsWith(".desc") ? " DESC" : " ASC"}` : "";

    let rows;
    if (method === "GET") {
        rows = await sql.query(`SELECT * FROM "${table}"${where}${orderSql}`, params);
    } else if (method === "POST") {
        const keys = Object.keys(body).filter((key) => SQL_IDENTIFIER.test(key));
        const values = keys.map((key) => parameter(body[key]));
        rows = await sql.query(`INSERT INTO "${table}" (${keys.map((key) => `"${key}"`).join(", ")}) VALUES (${values.join(", ")}) RETURNING *`, params);
    } else if (method === "PATCH") {
        const updates = Object.keys(body).filter((key) => SQL_IDENTIFIER.test(key)).map((key) => `"${key}" = ${parameter(body[key])}`);
        rows = await sql.query(`UPDATE "${table}" SET ${updates.join(", ")}${where} RETURNING *`, params);
    } else if (method === "DELETE") {
        rows = await sql.query(`DELETE FROM "${table}"${where} RETURNING *`, params);
    } else {
        throw Object.assign(new Error("Method not supported"), { status: 405 });
    }

    // The REST adapter supports a few embedded resources used by the admin and host views.
    if (table === "bookings" && requestUrl.searchParams.get("select")?.includes("listings")) {
        const listingIds = [...new Set(rows.map((row) => row.listing_id).filter(Boolean))];
        const listings = listingIds.length ? await sql.query(`SELECT id, title, images, host_id FROM listings WHERE id = ANY($1::int[])`, [listingIds]) : [];
        const listingMap = new Map(listings.map((item) => [item.id, item]));
        rows = rows.map((row) => ({ ...row, listings: listingMap.get(row.listing_id) || null }));
    }
    if (table === "bookings" && requestUrl.searchParams.get("select")?.includes("users")) {
        const guestIds = [...new Set(rows.map((row) => row.guest_id).filter(Boolean))];
        const users = guestIds.length ? await sql.query(`SELECT id, name, email, phone FROM users WHERE id = ANY($1::int[])`, [guestIds]) : [];
        const userMap = new Map(users.map((item) => [item.id, item]));
        rows = rows.map((row) => ({ ...row, users: userMap.get(row.guest_id) || null }));
    }
    if (table === "wishlists" && requestUrl.searchParams.get("select")?.includes("listings")) {
        const listingIds = [...new Set(rows.map((row) => row.listing_id).filter(Boolean))];
        const listings = listingIds.length ? await sql.query(`SELECT * FROM listings WHERE id = ANY($1::int[])`, [listingIds]) : [];
        const listingMap = new Map(listings.map((item) => [item.id, item]));
        rows = rows.map((row) => ({ ...row, listings: listingMap.get(row.listing_id) || null }));
    }
    return rows;
}

async function neon(path, options = {}) {
    if (sql) return neonDatabase(path, options);
    if (!config.apiUrl || !config.apiKey) {
        throw Object.assign(new Error("Neon API configuration is missing."), { status: 503 });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${config.apiUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
            apikey: config.apiKey,
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
            ...(options.headers || {})
        }
    }).catch((error) => {
        if (error.name === "AbortError") {
            throw Object.assign(new Error("Neon Data API request timed out."), { status: 504 });
        }
        throw error;
    }).finally(() => clearTimeout(timeout));
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
    if (!response.ok) {
        const detail = data?.message || data?.hint || data?.details || text || "Neon request failed";
        const error = new Error(`Neon Data API ${response.status}: ${detail}`);
        error.status = response.status;
        throw error;
    }
    return data;
}

async function paymongo(path, options = {}) {
    if (isPlaceholder(config.paymongoSecretKey) || !/^sk_(test|live)_/i.test(config.paymongoSecretKey)) {
        throw Object.assign(new Error("PayMongo is not configured. Set PAYMONGO_SECRET_KEY on the server."), { status: 503 });
    }
    const response = await fetch(`https://api.paymongo.com/v1${path}`, {
        ...options,
        headers: {
            Authorization: `Basic ${Buffer.from(`${config.paymongoSecretKey}:`).toString("base64")}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
    if (!response.ok) {
        const message = data?.errors?.[0]?.detail || data?.error || `PayMongo request failed (${response.status})`;
        throw Object.assign(new Error(message), { status: response.status });
    }
    return data;
}

async function databaseHealth() {
    if (databaseConfigError) return { configured: false, error: databaseConfigError };
    if (sql) {
        try {
            await sql.query("SELECT 1");
            return { configured: true };
        } catch {
            return { configured: false, error: "Neon database connection failed." };
        }
    }
    return { configured: Boolean(config.apiUrl && config.apiKey) };
}

async function creditCancelledBooking(_paymentId, bookingId) {
    await bookingService.query('SELECT tripmate_credit_refund($1)', [bookingId]);
}

async function recordVerifiedPayment(payment) {
    return bookingService.verifyPayment(payment.id);
}

async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derived = await scrypt(password, salt, 64);
    return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, stored) {
    const [, salt, expectedHex] = String(stored || "").split("$");
    if (!salt || !expectedHex) return false;
    const actual = Buffer.from(await scrypt(password, salt, 64));
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ensureAdminAccount() {
    if (!sql && (!config.apiUrl || !config.apiKey)) return;
    if (sql) await sql.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text");
    const existing = await neon(`/users?username=eq.${ADMIN_USERNAME}&select=*`);
    const password_hash = await hashPassword(ADMIN_PASSWORD);
    const payload = {
        name: "Administrator",
        username: ADMIN_USERNAME,
        email: "admin@tripmate.local",
        password_hash,
        role: "admin"
    };
    if (existing[0]) {
        await neon(`/users?id=eq.${existing[0].id}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
        await neon("/users", { method: "POST", body: JSON.stringify(payload) });
    }
}

let adminAccountPromise = null;
export function initializeAdminAccount() {
    if (!adminAccountPromise) adminAccountPromise = ensureAdminAccount();
    return adminAccountPromise;
}

export async function initializeCatalogListings() {
    if (!sql && (!config.apiUrl || !config.apiKey)) return;
    const adminRows = await neon(`/users?username=eq.${ADMIN_USERNAME}&select=id`);
    const hostId = adminRows[0]?.id;
    if (!hostId) return;

    const existing = await neon("/listings?select=title");
    const existingTitles = new Set(existing.map(item => String(item.title || "").toLowerCase()));
    for (const listing of CATALOG_LISTINGS) {
        if (existingTitles.has(listing.title.toLowerCase())) continue;
        await neon("/listings", {
            method: "POST",
            body: JSON.stringify({
                ...listing,
                host_id: hostId,
                description: `A verified TripMate ${listing.property_type.toLowerCase()} in ${listing.location}.`,
                cleaning_fee: 0,
                status: "published",
                rules: {}
            })
        });
    }
}

function signToken(user, rememberMe = false) {
    const sessionDays = rememberMe ? 30 : 7;
    const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + sessionDays * 86400000 })).toString("base64url");
    const signature = createHmac("sha256", config.jwtSecret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

function authUser(req) {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", config.jwtSecret).update(payload).digest("base64url");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString());
        return data.exp > Date.now() ? data : null;
    } catch { return null; }
}

function safeUser(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return {
        ...safe,
        type: safe.role === "host" ? "host" : "guest",
        businessName: safe.business_name || "",
    };
}

function safeAdminUser(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return {
        id: safe.id,
        name: safe.name,
        username: safe.username || "",
        email: safe.email,
        phone: safe.phone || "",
        role: safe.role || "guest",
        businessName: safe.business_name || "",
        verified: Boolean(safe.verified),
        declined: Boolean(safe.declined),
        isActive: safe.is_active !== false,
        createdAt: safe.created_at,
        updatedAt: safe.updated_at
    };
}

export async function routeApi(req, res, url) {
    res.requestOrigin = req.headers.origin;
    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) ? await readBody(req) : {};
    const user = authUser(req);
    if (sql) await bookingService.initialize();
    const requireAuth = () => { if (!user) throw Object.assign(new Error("Authentication required"), { status: 401 }); return user; };
    const requireHost = () => { const current = requireAuth(); if (current.role !== "host" && current.role !== "admin") throw Object.assign(new Error("Host access required"), { status: 403 }); return current; };
    const requireAdmin = () => { const current = requireAuth(); if (current.role !== "admin") throw Object.assign(new Error("Admin access required"), { status: 403 }); return current; };

    if (req.method === "POST" && url.pathname === "/api/webhooks/paymongo") {
        const webhook = body?.data;
        if (webhook?.type !== "checkout_session.payment.paid") {
            return json(res, 200, { received: true, ignored: true });
        }
        const sessionId = webhook?.data?.id;
        if (!sessionId || typeof webhook.livemode !== "boolean") {
            throw Object.assign(new Error("PayMongo webhook is missing its Checkout Session or mode."), { status: 400 });
        }
        const configuredLivemode = config.paymongoSecretKey.startsWith("sk_live_");
        if (webhook.livemode !== configuredLivemode) {
            throw Object.assign(new Error("PayMongo webhook mode does not match the configured API key."), { status: 400 });
        }

        const paymentRows = await neon(`/payments?transaction_reference=eq.${encodeURIComponent(sessionId)}&select=id,booking_id,amount,status`);
        const payment = paymentRows[0];
        if (!payment) throw Object.assign(new Error("Payment record is not available for this Checkout Session yet."), { status: 503 });

        const providerSession = await paymongo(`/checkout_sessions/${encodeURIComponent(sessionId)}?expand[]=payments`);
        if (!findVerifiedPaidCheckoutPayment(webhook, providerSession, payment)) {
            throw Object.assign(new Error("PayMongo has not verified a matching paid Checkout Session."), { status: 409 });
        }
        const bookingRows = await neon(`/bookings?id=eq.${payment.booking_id}&select=id,status`);
        if (!bookingRows[0]) throw Object.assign(new Error("Booking not found for this payment."), { status: 404 });
        await recordVerifiedPayment(payment, bookingRows[0]);
        return json(res, 200, { received: true, booking_id: payment.booking_id });
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
        const database = await databaseHealth();
        const paymongoKeyLoaded = Boolean(config.paymongoSecretKey);
        const paymongoKeyFormatValid = /^sk_(test|live)_/i.test(config.paymongoSecretKey);
        return json(res, 200, {
            ok: true,
            databaseConfigured: database.configured,
            databaseError: database.error || null,
            paymongoConfigured: !isPlaceholder(config.paymongoSecretKey) && paymongoKeyFormatValid,
            paymongoKeyLoaded,
            paymongoKeyFormatValid,
            authConfigured: Boolean(config.authUrl || config.databaseUrl)
        });
    }

    if (req.method === "GET" && url.pathname === "/api/admin/data") {
        const admin = requireAdmin();
        const [listingRows, bookingRows] = await Promise.all([
            neon("/listings?select=*&order=created_at.desc"),
            neon("/bookings?select=*,listings(title),users(name,email,phone)&order=created_at.desc")
        ]);
        return json(res, 200, {
            listings: listingRows.map((item) => ({
                id: String(item.id), name: item.title, description: item.description || "",
                type: item.property_type, location: item.location, price: Number(item.price_per_night),
                maxGuests: item.max_guests, bedrooms: item.bedrooms, bathrooms: item.bathrooms,
                cleaningFee: Number(item.cleaning_fee), status: item.status === "published" ? "Verified" : item.status === "action_required" ? "Action Required" : "Pending Review",
                images: item.images || [], amenities: item.amenities || [], host: String(item.host_id), hostId: item.host_id, createdAt: new Date(item.created_at).getTime()
            })),
            bookings: bookingRows.map((item) => ({
                id: String(item.id), guestName: item.users?.name || String(item.guest_id), guestEmail: item.users?.email || "",
                guestPhone: item.users?.phone || "", listingId: String(item.listing_id), checkIn: item.check_in,
                checkOut: item.check_out, guests: item.guest_count, amount: Number(item.total_amount),
                subtotal: Number(item.subtotal), cleaningFee: Number(item.cleaning_fee), taxes: Number(item.taxes), serviceFee: Number(item.service_fee),
                status: BOOKING_LABELS[item.status] || item.status,
                createdAt: new Date(item.created_at).getTime()
            }))
        });
    }

    const adminUserRoute = url.pathname.match(/^\/api\/admin\/users(?:\/(\d+))?$/);
    if (adminUserRoute) {
        const admin = requireAdmin();
        const userId = adminUserRoute[1];

        if (req.method === "GET") {
            const rows = await neon(`/users${userId ? `?id=eq.${userId}` : "?select=*"}`);
            return json(res, 200, rows.map(safeAdminUser));
        }

        if (req.method === "POST" && !userId) {
            const name = String(body.name || "").trim();
            const email = String(body.email || "").trim().toLowerCase();
            const password = String(body.password || "");
            const role = ["guest", "host", "admin"].includes(body.role) ? body.role : "guest";
            if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: "A valid name and email are required." });
            if (password.length < 8) return json(res, 400, { error: "Password must be at least 8 characters." });
            const existing = await neon(`/users?email=eq.${encodeURIComponent(email)}&select=id`);
            if (existing[0]) return json(res, 409, { error: "A user with that email already exists." });
            const rows = await neon("/users", {
                method: "POST",
                body: JSON.stringify({
                    name, email, username: body.username || null, password_hash: await hashPassword(password), role,
                    business_name: body.businessName || "", phone: body.phone || "", verified: Boolean(body.verified),
                    declined: false, is_active: body.isActive !== false
                })
            });
            return json(res, 201, safeAdminUser(rows[0]));
        }

        if ((req.method === "PATCH" || req.method === "DELETE") && !userId) {
            return json(res, 400, { error: "A user id is required." });
        }

        const currentRows = await neon(`/users?id=eq.${userId}&select=*`);
        const target = currentRows[0];
        if (!target) return json(res, 404, { error: "User not found." });

        if (req.method === "DELETE") {
            if (String(target.id) === String(admin.id)) return json(res, 400, { error: "You cannot delete the account currently in use." });
            if (target.role === "admin") {
                const admins = await neon("/users?role=eq.admin&is_active=eq.true&select=id");
                if (admins.length <= 1) return json(res, 400, { error: "The last active admin cannot be deleted." });
            }
            await neon(`/users?id=eq.${userId}`, { method: "DELETE" });
            return json(res, 200, { ok: true, id: Number(userId) });
        }

        const updates = {};
        ["name", "email", "username", "business_name", "phone", "role", "verified", "declined", "is_active"].forEach((key) => {
            if (body[key] !== undefined) updates[key] = body[key];
        });
        if (updates.role && !["guest", "host", "admin"].includes(updates.role)) return json(res, 400, { error: "Invalid user role." });
        if (updates.email) updates.email = String(updates.email).trim().toLowerCase();
        if (body.password !== undefined) {
            if (String(body.password).length < 8) return json(res, 400, { error: "Password must be at least 8 characters." });
            updates.password_hash = await hashPassword(String(body.password));
        }
        if (String(target.id) === String(admin.id) && updates.role && updates.role !== "admin") return json(res, 400, { error: "You cannot remove your own admin access." });
        if (target.role === "admin" && updates.is_active === false) {
            const admins = await neon("/users?role=eq.admin&is_active=eq.true&select=id");
            if (admins.length <= 1) return json(res, 400, { error: "The last active admin cannot be deactivated." });
        }
        updates.updated_at = new Date().toISOString();
        const rows = await neon(`/users?id=eq.${userId}`, { method: "PATCH", body: JSON.stringify(updates) });
        return json(res, 200, safeAdminUser(rows[0]));
    }

    if (req.method === "POST" && url.pathname === "/api/admin/sync") {
        const admin = requireAdmin();
        const listings = Array.isArray(body.listings) ? body.listings : [];

        const users = await neon("/users?role=eq.host&select=id");
        const defaultHostId = users[0]?.id || admin.id;
        const existingListings = await neon("/listings?select=id");

        const listingIds = new Set(listings.filter((item) => /^\d+$/.test(String(item.id))).map((item) => Number(item.id)));



        for (const item of existingListings) if (!listingIds.has(item.id)) {
            const reservations = await neon(`/bookings?listing_id=eq.${item.id}&select=id`);
            if (reservations.length) throw Object.assign(new Error("A listing with booking history cannot be deleted. Unpublish it instead."), { status: 409 });
            await neon(`/listings?id=eq.${item.id}`, { method: "DELETE" });
        }
        for (const item of listings) {
            const payload = {
                title: item.name, description: item.description || "", property_type: item.type || "House Rental",
                location: item.location, price_per_night: Number(item.price) || 0, max_guests: Number(item.maxGuests) || 1,
                bedrooms: Number(item.bedrooms) || 1, bathrooms: Number(item.bathrooms) || 1,
                cleaning_fee: Number(item.cleaningFee) || 0, status: item.status === "Verified" ? "published" : item.status === "Action Required" ? "action_required" : "pending",
                images: item.images || [], amenities: item.amenities || [], host_id: Number(item.hostId || defaultHostId)
            };
            if (!payload.host_id) continue;
            const path = /^\d+$/.test(String(item.id)) ? `/listings?id=eq.${item.id}` : "/listings";
            await neon(path, { method: /^\d+$/.test(String(item.id)) ? "PATCH" : "POST", body: JSON.stringify(payload) });
        }
        return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/register") {
        const { name, email, password, role = "guest", businessName = "" } = body;
        if (!name || !email || !password || password.length < 8) return json(res, 400, { error: "Name, email, and an 8-character password are required." });
        const password_hash = await hashPassword(password);
        try {
            const rows = await neon("/users", { method: "POST", body: JSON.stringify({ name, email: email.trim().toLowerCase(), password_hash, role: role === "host" ? "host" : "guest", business_name: businessName }) });
            const created = rows[0];
            if (!created) throw new Error("Neon Data API returned no created user.");
            return json(res, 201, { token: signToken(created), user: safeUser(created) });
        } catch (error) { return json(res, error.status || 400, { error: error.message }); }
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
        const identifier = String(body.identifier || body.email || "").trim().toLowerCase();
        const field = identifier.includes("@") ? "email" : "username";
        const rows = await neon(`/users?${field}=eq.${encodeURIComponent(identifier)}&select=*`);
        const found = rows[0];
        if (!found || !(await verifyPassword(body.password, found.password_hash)) || (body.role && found.role !== body.role && found.role !== "admin")) return json(res, 401, { error: "Invalid username/email, password, or account type." });
        return json(res, 200, { token: signToken(found, body.rememberMe === true), user: safeUser(found) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/forgot") {
        return json(res, 501, { error: "Password reset email is not configured yet. Please contact TripMate support." });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
        const current = requireAuth();
        const rows = await neon(`/users?id=eq.${current.id}&select=*`);
        if (!rows[0]) return json(res, 404, { error: "Account not found." });
        return json(res, 200, { user: safeUser(rows[0]) });
    }

    if (req.method === "PATCH" && url.pathname === "/api/me") {
        const current = requireAuth();
        const updates = {};
        ["name", "email", "phone", "avatar", "bio"].forEach(key => { if (body[key] !== undefined) updates[key] = body[key]; });
        if (updates.name !== undefined) {
            updates.name = String(updates.name).trim();
            if (!updates.name || updates.name.length > 150) return json(res, 400, { error: "Name must be between 1 and 150 characters." });
        }
        if (updates.email !== undefined) {
            updates.email = String(updates.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) return json(res, 400, { error: "Enter a valid email address." });
            const existing = await neon(`/users?email=eq.${encodeURIComponent(updates.email)}&id=neq.${encodeURIComponent(current.id)}&select=id`);
            if (existing[0]) return json(res, 409, { error: "A user with that email already exists." });
        }
        if (updates.phone !== undefined) {
            updates.phone = String(updates.phone).trim();
            if (updates.phone.length > 40) return json(res, 400, { error: "Phone number cannot exceed 40 characters." });
        }
        if (updates.bio !== undefined) {
            updates.bio = String(updates.bio);
            if (updates.bio.length > 2000) return json(res, 400, { error: "Bio cannot exceed 2000 characters." });
        }
        const rows = await neon(`/users?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }) });
        if (!rows[0]) return json(res, 404, { error: "Account not found." });
        return json(res, 200, { user: safeUser(rows[0]) });
    }

    if (req.method === "DELETE" && url.pathname === "/api/me") {
        const current = requireAuth();
        if (typeof body.password !== "string" || !body.password) {
            return json(res, 400, { error: "Current password is required." });
        }
        const rows = await neon(`/users?id=eq.${current.id}&select=*`);
        if (!rows[0] || !(await verifyPassword(body.password, rows[0].password_hash))) {
            return json(res, 400, { error: "Current password is incorrect." });
        }
        if (rows[0].role === "admin") {
            const admins = await neon("/users?role=eq.admin&is_active=eq.true&select=id");
            if (admins.length <= 1) return json(res, 400, { error: "The last active admin account cannot be deleted." });
        }
        await neon(`/users?id=eq.${current.id}`, { method: "DELETE" });
        return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && url.pathname === "/api/me/password") {
        const current = requireAuth();
        if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
            return json(res, 400, { error: "Current and new passwords are required." });
        }
        const rows = await neon(`/users?id=eq.${current.id}&select=*`);
        if (!rows[0] || !(await verifyPassword(body.currentPassword, rows[0].password_hash))) return json(res, 400, { error: "Current password is incorrect." });
        if (!body.newPassword || body.newPassword.length < 8) return json(res, 400, { error: "New password must be at least 8 characters." });
        await neon(`/users?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ password_hash: await hashPassword(body.newPassword), updated_at: new Date().toISOString() }) });
        return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/promotions') return json(res, 200, await bookingService.promotions());
    if (req.method === 'PATCH' && url.pathname === '/api/admin/promotions') {
        requireAdmin();
        return json(res, 200, await bookingService.savePromotions(body.promotions));
    }
    if (req.method === 'GET' && url.pathname === '/api/cancellation-policy') return json(res, 200, await bookingService.policy());
    if (req.method === 'PATCH' && url.pathname === '/api/admin/cancellation-policy') {
        requireAdmin();
        return json(res, 200, await bookingService.savePolicy(body));
    }
    const availability = url.pathname.match(/^\/api\/listings\/(\d+)\/availability$/);
    if (req.method === 'GET' && availability) return json(res, 200, await bookingService.availability(Number(availability[1]), url.searchParams.get('check_in'), url.searchParams.get('check_out')));
    if (req.method === 'GET' && url.pathname === '/api/notifications') {
        const current = requireAuth();
        const items = await bookingService.query("SELECT id, title, message, notification_type, booking_id, is_read, created_at FROM notifications WHERE user_id=$1 AND notification_type IS DISTINCT FROM 'preferences' ORDER BY created_at DESC, id DESC LIMIT 50", [current.id]);
        const [count] = await bookingService.query("SELECT count(*)::int AS unread FROM notifications WHERE user_id=$1 AND is_read=false AND notification_type IS DISTINCT FROM 'preferences'", [current.id]);
        return json(res, 200, { items, unread: count.unread });
    }
    const readNotifications = url.pathname.match(/^\/api\/notifications\/(all|\d+)\/read$/);
    if (req.method === 'PATCH' && readNotifications) {
        const current = requireAuth();
        await bookingService.query("UPDATE notifications SET is_read=true WHERE user_id=$1 AND notification_type IS DISTINCT FROM 'preferences' AND ($2::int IS NULL OR id=$2)", [current.id, readNotifications[1] === 'all' ? null : Number(readNotifications[1])]);
        return json(res, 200, { ok: true });
    }

    if (url.pathname === "/api/notifications/preferences" && req.method === "GET") {
        const current = requireAuth();
        const rows = await neon(`/notifications?user_id=eq.${current.id}&notification_type=eq.preferences&select=message`);
        let preferences = { booking: true, payment: true, reminders: true, promo: false };
        if (rows[0]?.message) {
            try {
                preferences = JSON.parse(rows[0].message);
            } catch {
                return json(res, 500, { error: "Saved notification preferences are invalid." });
            }
        }
        return json(res, 200, { preferences });
    }

    if (req.method === "POST" && url.pathname === "/api/notifications/preferences") {
        const current = requireAuth();
        const existing = await neon(`/notifications?user_id=eq.${current.id}&notification_type=eq.preferences&select=id`);
        const preferences = body.preferences;
        if (!preferences || typeof preferences !== "object" || Array.isArray(preferences) ||
            Object.keys(preferences).some(key => !['booking', 'payment', 'reminders', 'promo'].includes(key) || typeof preferences[key] !== 'boolean')) {
            return json(res, 400, { error: "Notification preferences must be an object." });
        }
        const payload = { user_id: current.id, title: "Notification preferences", message: JSON.stringify(preferences), notification_type: "preferences", is_read: true };
        const rows = existing[0]
            ? await neon(`/notifications?id=eq.${existing[0].id}`, { method: "PATCH", body: JSON.stringify(payload) })
            : await neon("/notifications", { method: "POST", body: JSON.stringify(payload) });
        return json(res, 200, rows[0]);
    }

    if (req.method === "GET" && url.pathname === "/api/saved-searches") {
        const current = requireAuth();
        const rows = await neon(`/saved_searches?user_id=eq.${current.id}&select=id,search_name,filters,created_at&order=created_at.desc`);
        return json(res, 200, rows);
    }

    if (req.method === "POST" && url.pathname === "/api/saved-searches") {
        const current = requireAuth();
        const searchName = typeof body.search_name === "string" ? body.search_name.trim() : "Saved search";
        if (!searchName || searchName.length > 100) {
            return json(res, 400, { error: "Search name must be between 1 and 100 characters." });
        }
        if (!body.filters || typeof body.filters !== "object" || Array.isArray(body.filters)) {
            return json(res, 400, { error: "Saved search filters must be an object." });
        }
        const rows = await neon("/saved_searches", {
            method: "POST",
            body: JSON.stringify({ user_id: current.id, search_name: searchName, filters: body.filters })
        });
        return json(res, 201, rows[0]);
    }

    const savedSearchMatch = url.pathname.match(/^\/api\/saved-searches\/(\d+)$/);
    if (req.method === "DELETE" && savedSearchMatch) {
        const current = requireAuth();
        const rows = await neon(`/saved_searches?id=eq.${savedSearchMatch[1]}&user_id=eq.${current.id}`, {
            method: "DELETE"
        });
        if (!rows.length) return json(res, 404, { error: "Saved search not found." });
        return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/reviews") {
        const current = requireAuth();
        const booking = await neon(`/bookings?id=eq.${body.booking_id}&guest_id=eq.${current.id}&status=eq.completed&select=id,listing_id`);
        if (!booking[0]) return json(res, 400, { error: "A completed booking is required before reviewing." });
        return json(res, 201, (await neon("/reviews", { method: "POST", body: JSON.stringify({ user_id: current.id, listing_id: booking[0].listing_id, booking_id: booking[0].id, rating: body.rating, comment: body.comment || "" }) }))[0]);
    }

    if (req.method === "GET" && url.pathname === "/api/listings") {
        const rows = await neon("/listings?status=eq.published&select=*");
        return json(res, 200, rows);
    }

    const listingRoute = url.pathname.match(/^\/api\/listings\/(\d+)$/);
    if (req.method === "GET" && listingRoute) {
        const rows = await neon(`/listings?id=eq.${listingRoute[1]}&status=eq.published&select=*`);
        return rows[0] ? json(res, 200, rows[0]) : json(res, 404, { error: "Listing not found." });
    }

    if (req.method === "GET" && url.pathname === "/api/host/listings") {
        const current = requireHost();
        return json(res, 200, await neon(`/listings?host_id=eq.${current.id}&select=*`));
    }

    if (req.method === "GET" && url.pathname === "/api/host/bookings") {
        const current = requireHost();
        const listings = await neon(`/listings?host_id=eq.${current.id}&select=id,title`);
        const ids = listings.map(item => item.id);
        if (!ids.length) return json(res, 200, []);
        return json(res, 200, await neon(`/bookings?listing_id=in.(${ids.join(",")})&select=*,listings(title,images)&order=created_at.desc`));
    }

    if (req.method === "POST" && url.pathname === "/api/host/listings") {
        const current = requireHost();
        const description = body.description ?? "";
        if (typeof description !== "string" || description.length > 1000) {
            return json(res, 400, { error: "Listing description must be 1,000 characters or fewer." });
        }
        const listing = {
            ...body,
            description: description.trim(),
            host_id: current.id,
            images: body.images || [],
            amenities: body.amenities || [],
            rules: body.rules || {}
        };
        return json(res, 201, (await neon("/listings", { method: "POST", body: JSON.stringify(listing) }))[0]);
    }

    if (req.method === "GET" && url.pathname === "/api/bookings") {
        const current = requireAuth();
        return json(res, 200, await neon(`/bookings?guest_id=eq.${current.id}&select=*,listings(title,images)&order=created_at.desc`));
    }

    if (req.method === "GET" && url.pathname === "/api/wallet") {
        const current = requireAuth();
        if (!sql) throw Object.assign(new Error("Wallet service requires the Neon database connection."), { status: 503 });
        const [summary] = await sql.query(
            "SELECT COALESCE(SUM(amount), 0)::numeric(10,2) AS balance FROM wallet_transactions WHERE user_id = $1",
            [current.id]
        );
        const transactions = await sql.query(
            "SELECT id, booking_id, amount, description, created_at FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
            [current.id]
        );
        return json(res, 200, { balance: Number(summary?.balance) || 0, transactions });
    }

    if (req.method === "POST" && url.pathname === "/api/payments/checkout") {
        const current = requireAuth();
        if (String(body.payment_method || "qrph").toLowerCase() !== "qrph") return json(res, 400, { error: "Choose QR Ph as the payment method." });
        if (isPlaceholder(config.paymongoSecretKey)) return json(res, 503, { error: "PayMongo is not configured." });
        const booking = await bookingService.create(body, current.id);
        const totalAmount = Number(booking.total_amount);
        const listingRows = await neon(`/listings?id=eq.${booking.listing_id}&select=id,title`);
        try {
            const session = await paymongo("/checkout_sessions", {
                method: "POST",
                body: JSON.stringify({
                    data: {
                        attributes: {
                            line_items: [{
                                currency: "PHP",
                                amount: Math.round(totalAmount * 100),
                                name: listingRows[0].title,
                                quantity: 1
                            }],
                            payment_method_types: ["qrph"],
                            description: `TripMate booking ${booking.id}`,
                            success_url: `${getFrontendUrl(req)}/booking.html?payment=success&booking_id=${booking.id}`,
                            cancel_url: `${getFrontendUrl(req)}/booking.html?payment=cancelled&booking_id=${booking.id}`,
                            metadata: { booking_id: String(booking.id) }
                        }
                    }
                })
            });
            const sessionId = session?.data?.id;
            const checkoutUrl = session?.data?.attributes?.checkout_url;
            if (!sessionId || !checkoutUrl) throw new Error("PayMongo did not return a checkout URL.");

            await neon("/payments", {
                method: "POST",
                body: JSON.stringify({
                    booking_id: booking.id,
                    payment_method: "qrph",
                    amount: totalAmount,
                    status: "pending",
                    transaction_reference: sessionId
                })
            });
            return json(res, 201, { booking_id: booking.id, session_id: sessionId, checkout_url: checkoutUrl });
        } catch (error) {
            await neon(`/bookings?id=eq.${booking.id}`, { method: "DELETE" }).catch(() => {});
            throw error;
        }
    }

    if (req.method === "GET" && url.pathname === "/api/payments/confirm") {
        const current = requireAuth();
        const bookingId = Number(url.searchParams.get("booking_id"));
        let sessionId = url.searchParams.get("session_id");
        if (!bookingId) return json(res, 400, { error: "A booking is required." });
        const bookings = await neon(`/bookings?id=eq.${bookingId}&guest_id=eq.${current.id}&select=*`);
        if (!bookings[0]) return json(res, 404, { error: "Booking not found." });
        const paymentRows = sessionId
            ? await neon(`/payments?booking_id=eq.${bookingId}&transaction_reference=eq.${encodeURIComponent(sessionId)}&select=id,booking_id,status,amount,transaction_reference`)
            : await neon(`/payments?booking_id=eq.${bookingId}&select=id,booking_id,status,amount,transaction_reference&order=created_at.desc`);
        const payment = sessionId
            ? paymentRows[0]
            : paymentRows.find(item => item.status === "paid") ||
                paymentRows.find(item => item.status === "pending" && item.transaction_reference);
        if (!payment) return json(res, 404, { error: "Payment session not found for this booking." });
        sessionId = payment.transaction_reference;
        if (!sessionId) return json(res, 409, { error: "Payment session is not available yet." });
        const bookingStatus = String(bookings[0].status || "").toLowerCase();
        if (bookingStatus === "completed") {
            return json(res, 409, { error: "This booking cannot be confirmed." });
        }
        if (bookingStatus === "cancelled" && payment.status === "paid") {
            await creditCancelledBooking(payment.id, bookingId);
            return json(res, 409, { error: "This booking cannot be confirmed." });
        }
        if (payment.status === "paid") {
            const confirmed = await recordVerifiedPayment(payment, bookings[0]);
            if (!confirmed) return json(res, 409, { error: "This booking cannot be confirmed." });
            return json(res, 200, { ok: true, booking_id: bookingId });
        }
        const session = await paymongo(`/checkout_sessions/${encodeURIComponent(sessionId)}?expand[]=payments&expand[]=payment_intent`);
        const verifiedPayment = findVerifiedPaidCheckoutPayment({
            type: "checkout_session.payment.paid",
            livemode: session?.data?.attributes?.livemode,
            data: { id: sessionId }
        }, session, payment);
        if (!verifiedPayment) return json(res, 409, { error: "Payment has not been completed yet." });
        const confirmed = await recordVerifiedPayment(payment, bookings[0]);
        if (!confirmed) return json(res, 409, { error: "This booking cannot be confirmed." });
        return json(res, 200, { ok: true, booking_id: bookingId });
    }

    if (req.method === "POST" && url.pathname === "/api/bookings") {
        const current = requireAuth();
        return json(res, 201, await bookingService.create(body, current.id));
    }

    const cancelQuote = url.pathname.match(/^\/api\/bookings\/(\d+)\/cancellation-quote$/);
    if (req.method === "GET" && cancelQuote) {
        return json(res, 200, await bookingService.quote(Number(cancelQuote[1]), requireAuth()));
    }
    const cancelBooking = url.pathname.match(/^\/api\/bookings\/(\d+)\/cancel$/);
    if (req.method === "PATCH" && cancelBooking) {
        return json(res, 200, await bookingService.cancel(Number(cancelBooking[1]), requireAuth(), 'request', body.expected_refund));
    }
    const reviewCancellation = url.pathname.match(/^\/api\/admin\/bookings\/(\d+)\/cancellation$/);
    if (req.method === "PATCH" && reviewCancellation) {
        const current = requireAdmin();
        if (!['approve', 'reject', 'cancel'].includes(body.action)) return json(res, 400, { error: "Choose approve, reject, or cancel." });
        return json(res, 200, await bookingService.cancel(Number(reviewCancellation[1]), current, body.action, body.expected_refund));
    }
    const adminBooking = url.pathname.match(/^\/api\/admin\/bookings(?:\/(\d+))?$/);
    if (adminBooking) {
        requireAdmin();
        if (req.method === 'PATCH' && adminBooking[1]) return json(res, 200, await bookingService.updateStatus(Number(adminBooking[1]), body.status));
        if (req.method === 'POST' && !adminBooking[1]) {
            const guests = await neon(`/users?email=eq.${encodeURIComponent(String(body.guestEmail || '').trim())}&select=id`);
            if (!guests[0]) return json(res, 400, { error: "Choose the email of an existing guest account." });
            return json(res, 201, await bookingService.create({ listing_id: body.listingId, check_in: body.checkIn, check_out: body.checkOut, guest_count: body.guests }, guests[0].id, true));
        }
    }
    const bookingStatus = url.pathname.match(/^\/api\/host\/bookings\/(\d+)\/status$/);
    if (req.method === "PATCH" && bookingStatus) {
        const current = requireHost();
        const id = Number(bookingStatus[1]);
        await bookingService.quote(id, current);
        const rows = await neon(`/bookings?id=eq.${id}&select=*,listings!inner(host_id)`);
        if (rows[0]?.listings?.host_id !== current.id) return json(res, 404, { error: "Booking not found." });
        if (body.status === 'cancelled') return json(res, 200, await bookingService.cancel(id, current, 'cancel', body.expected_refund));
        return json(res, 200, await bookingService.updateStatus(id, body.status));
    }

    if (req.method === "GET" && url.pathname === "/api/wishlist") {
        const current = requireAuth();
        return json(res, 200, await neon(`/wishlists?user_id=eq.${current.id}&select=*,listings(*)`));
    }

    if (req.method === "POST" && url.pathname === "/api/wishlist") {
        const current = requireAuth();
        return json(res, 201, (await neon("/wishlists", { method: "POST", body: JSON.stringify({ user_id: current.id, listing_id: body.listing_id }) }))[0]);
    }

    const wishlistItem = url.pathname.match(/^\/api\/wishlist\/(\d+)$/);
    if (req.method === "DELETE" && wishlistItem) {
        const current = requireAuth();
        await neon(`/wishlists?id=eq.${wishlistItem[1]}&user_id=eq.${current.id}`, { method: "DELETE" });
        return json(res, 204, null);
    }

    throw Object.assign(new Error("API route not found"), { status: 404 });
}

function serveStatic(req, res, url) {
    const requested = url.pathname === "/" ? "/homepage.html" : url.pathname;
    const blocked = new Set(["/.env", "/.env.example", "/server.js", "/schema.sql", "/bookings.js", "/booking-migration.sql"]);
    if (blocked.has(requested) || requested.split("/").some(segment => segment.startsWith("."))) return json(res, 404, { error: "Not found" });
    const file = normalize(join(root, requested));
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) return json(res, 404, { error: "Not found" });
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
        if (req.method === "OPTIONS") {
            res.writeHead(204, corsHeaders(req.headers.origin));
            res.end();
            return;
        }
        if (url.pathname.startsWith("/api/")) await routeApi(req, res, url);
        else serveStatic(req, res, url);
    } catch (error) {
        console.error(error);
        json(res, error.status || 500, { error: error.message || "Server error" });
    }
});

if (process.argv[1] && /(?:^|[\\/])server\.js$/.test(process.argv[1])) {
    server.listen(config.port, () => console.log(`TripMate running at http://localhost:${config.port}`));
    initializeAdminAccount()
        .then(initializeCatalogListings)
        .catch(error => console.error("Unable to seed TripMate catalog:", error.message));
}
