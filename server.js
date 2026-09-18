import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const root = fileURLToPath(new URL(".", import.meta.url));
const env = {};
try {
    const text = await import("node:fs/promises").then(fs => fs.readFile(join(root, ".env"), "utf8"));
    text.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    });
} catch { /* Environment variables may be provided by the process. */ }

const config = {
    apiUrl: process.env.NEON_API_URL || env.NEON_API_URL,
    authUrl: process.env.NEON_AUTH_URL || env.NEON_AUTH_URL,
    apiKey: process.env.NEON_API_KEY || env.NEON_API_KEY,
    jwtSecret: process.env.JWT_SECRET || env.JWT_SECRET || "change-this-secret",
    port: Number(process.env.PORT || env.PORT || 3000)
};

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";

if (!config.apiUrl || !config.apiKey) {
    console.warn("Missing NEON_API_URL or NEON_API_KEY. Add them to .env before starting the server.");
}

function json(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || env.FRONTEND_URL || "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
    });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
        req.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("Invalid JSON body")); } });
        req.on("error", reject);
    });
}

async function neon(path, options = {}) {
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
    if (!config.apiUrl || !config.apiKey) return;
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

function signToken(user) {
    const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 7 * 86400000 })).toString("base64url");
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
    return safe;
}

export async function routeApi(req, res, url) {
    const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readBody(req) : {};
    const user = authUser(req);
    const requireAuth = () => { if (!user) throw Object.assign(new Error("Authentication required"), { status: 401 }); return user; };
    const requireHost = () => { const current = requireAuth(); if (current.role !== "host" && current.role !== "admin") throw Object.assign(new Error("Host access required"), { status: 403 }); return current; };
    const requireAdmin = () => { const current = requireAuth(); if (current.role !== "admin") throw Object.assign(new Error("Admin access required"), { status: 403 }); return current; };

    if (req.method === "GET" && url.pathname === "/api/health") {
        return json(res, 200, { ok: true, databaseConfigured: Boolean(config.apiUrl && config.apiKey), authConfigured: Boolean(config.authUrl) });
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
                checkOut: item.check_out, guests: item.guest_count, amount: Number(item.subtotal),
                status: item.status === "confirmed" ? "Confirmed" : item.status === "cancelled" ? "Cancelled" : "Pending",
                createdAt: new Date(item.created_at).getTime()
            }))
        });
    }

    if (req.method === "POST" && url.pathname === "/api/admin/sync") {
        const admin = requireAdmin();
        const listings = Array.isArray(body.listings) ? body.listings : [];
        const bookings = Array.isArray(body.bookings) ? body.bookings : [];
        const users = await neon("/users?role=eq.host&select=id");
        const defaultHostId = users[0]?.id || admin.id;
        const existingListings = await neon("/listings?select=id");
        const existingBookings = await neon("/bookings?select=id");
        const listingIds = new Set(listings.filter((item) => /^\d+$/.test(String(item.id))).map((item) => Number(item.id)));
        const bookingIds = new Set(bookings.filter((item) => /^\d+$/.test(String(item.id))).map((item) => Number(item.id)));

        for (const item of existingBookings) if (!bookingIds.has(item.id)) await neon(`/bookings?id=eq.${item.id}`, { method: "DELETE" });
        for (const item of existingListings) if (!listingIds.has(item.id)) await neon(`/listings?id=eq.${item.id}`, { method: "DELETE" });
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
        for (const item of bookings) {
            if (!/^\d+$/.test(String(item.listingId))) continue;
            const payload = {
                listing_id: Number(item.listingId), check_in: item.checkIn, check_out: item.checkOut,
                guest_count: Number(item.guests) || 1, subtotal: Number(item.amount) || 0,
                total_amount: Number(item.amount) || 0, status: item.status === "Confirmed" ? "confirmed" : item.status === "Cancelled" ? "cancelled" : "pending"
            };
            const guest = await neon(`/users?email=eq.${encodeURIComponent(String(item.guestEmail || "admin@tripmate.local"))}&select=id`);
            payload.guest_id = guest[0]?.id || (await neon("/users?role=eq.guest&select=id"))[0]?.id;
            if (!payload.guest_id) continue;
            const path = /^\d+$/.test(String(item.id)) ? `/bookings?id=eq.${item.id}` : "/bookings";
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
        return json(res, 200, { token: signToken(found), user: safeUser(found) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/forgot") {
        const email = String(body.email || "").trim().toLowerCase();
        if (email) await neon(`/users?email=eq.${encodeURIComponent(email)}&select=id`);
        return json(res, 200, { ok: true, message: "If an account exists, a reset link has been sent." });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
        const current = requireAuth();
        const rows = await neon(`/users?id=eq.${current.id}&select=*`);
        return json(res, 200, { user: safeUser(rows[0]) });
    }

    if (req.method === "PATCH" && url.pathname === "/api/me") {
        const current = requireAuth();
        const updates = {};
        ["name", "email", "phone", "avatar"].forEach(key => { if (body[key] !== undefined) updates[key] = body[key]; });
        const rows = await neon(`/users?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }) });
        return json(res, 200, { user: safeUser(rows[0]) });
    }

    if (req.method === "PATCH" && url.pathname === "/api/me/password") {
        const current = requireAuth();
        const rows = await neon(`/users?id=eq.${current.id}&select=*`);
        if (!rows[0] || !(await verifyPassword(body.currentPassword, rows[0].password_hash))) return json(res, 400, { error: "Current password is incorrect." });
        if (!body.newPassword || body.newPassword.length < 8) return json(res, 400, { error: "New password must be at least 8 characters." });
        await neon(`/users?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ password_hash: await hashPassword(body.newPassword), updated_at: new Date().toISOString() }) });
        return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/notifications/preferences") {
        const current = requireAuth();
        const existing = await neon(`/notifications?user_id=eq.${current.id}&notification_type=eq.preferences&select=id`);
        const payload = { user_id: current.id, title: "Notification preferences", message: JSON.stringify(body.preferences || {}), notification_type: "preferences", is_read: true };
        const rows = existing[0]
            ? await neon(`/notifications?id=eq.${existing[0].id}`, { method: "PATCH", body: JSON.stringify(payload) })
            : await neon("/notifications", { method: "POST", body: JSON.stringify(payload) });
        return json(res, 200, rows[0]);
    }

    if (req.method === "POST" && url.pathname === "/api/saved-searches") {
        const current = requireAuth();
        return json(res, 201, (await neon("/saved_searches", { method: "POST", body: JSON.stringify({ user_id: current.id, search_name: body.search_name || "Saved search", filters: body.filters || {} }) }))[0]);
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
        const listing = { ...body, host_id: current.id, images: body.images || [], amenities: body.amenities || [], rules: body.rules || {} };
        return json(res, 201, (await neon("/listings", { method: "POST", body: JSON.stringify(listing) }))[0]);
    }

    if (req.method === "GET" && url.pathname === "/api/bookings") {
        const current = requireAuth();
        return json(res, 200, await neon(`/bookings?guest_id=eq.${current.id}&select=*&order=created_at.desc`));
    }

    if (req.method === "POST" && url.pathname === "/api/bookings") {
        const current = requireAuth();
        const booking = { ...body, guest_id: current.id, status: "pending" };
        const rows = await neon("/bookings", { method: "POST", body: JSON.stringify(booking) });
        return json(res, 201, rows[0]);
    }

    const cancelBooking = url.pathname.match(/^\/api\/bookings\/(\d+)\/cancel$/);
    if (req.method === "PATCH" && cancelBooking) {
        const current = requireAuth();
        const rows = await neon(`/bookings?id=eq.${cancelBooking[1]}&guest_id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled", updated_at: new Date().toISOString() }) });
        if (!rows[0]) return json(res, 404, { error: "Booking not found." });
        return json(res, 200, rows[0]);
    }

    const bookingStatus = url.pathname.match(/^\/api\/host\/bookings\/(\d+)\/status$/);
    if (req.method === "PATCH" && bookingStatus) {
        const current = requireHost();
        const bookingRows = await neon(`/bookings?id=eq.${bookingStatus[1]}&select=*,listings!inner(host_id)`);
        if (!bookingRows[0] || String(bookingRows[0].listings.host_id) !== String(current.id)) return json(res, 404, { error: "Booking not found." });
        const rows = await neon(`/bookings?id=eq.${bookingStatus[1]}`, { method: "PATCH", body: JSON.stringify({ status: body.status, updated_at: new Date().toISOString() }) });
        return json(res, 200, rows[0]);
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
    const blocked = new Set(["/.env", "/.env.example", "/server.js", "/schema.sql"]);
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
            res.writeHead(204, {
                "Access-Control-Allow-Origin": process.env.FRONTEND_URL || env.FRONTEND_URL || "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
            });
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

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    server.listen(config.port, () => console.log(`TripMate running at http://localhost:${config.port}`));
    ensureAdminAccount().catch(error => console.error("Unable to seed admin account:", error.message));
}
