// TripMate host dashboard: reads the same listings and bookings as guest pages.
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");
    if (!user || !session || !["host", "admin"].includes(user.role || user.type)) {
        window.location.href = "../login.html?type=host&redirect=host/dashboard.html";
        return;
    }

    const read = key => {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch { return []; }
    };
    const formatMoney = value => `₱${Math.round(Number(value) || 0).toLocaleString("en-PH")}`;
    const formatDate = value => new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
    const DEFAULT_LISTING_IMAGE = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";
    const getListingImage = listing => {
        const gallery = Array.isArray(listing?.images) ? listing.images : [];
        const image = gallery.find(item => typeof item === "string" && item.trim());
        return image || DEFAULT_LISTING_IMAGE;
    };
    const normalizeListing = item => ({
        ...item,
        source: item.source || "database",
        images: Array.isArray(item.images) && item.images.length ? item.images.filter(Boolean) : [DEFAULT_LISTING_IMAGE],
        pricePerNight: Number(item.price_per_night ?? item.pricePerNight ?? 0)
    });
    const getData = async () => {
        try {
            const [listings, bookings] = await Promise.all([apiRequest("/host/listings"), apiRequest("/host/bookings")]);
            return {
                listings: listings.map(normalizeListing),
                bookings: bookings.map(item => ({
                    ...item,
                    checkin: item.check_in,
                    checkout: item.check_out,
                    total: Number(item.total_amount),
                    propertyName: item.listings?.title,
                    propertyImage: item.listings?.image || item.listings?.images?.[0] || DEFAULT_LISTING_IMAGE,
                    createdAt: item.created_at
                }))
            };
        } catch (error) {
            console.warn("Host dashboard API unavailable; showing saved browser data:", error.message);
            const listings = read("tripmate_listings").filter(item => String(item.hostId) === String(user.id)).map(normalizeListing);
            const listingIds = new Set(listings.map(item => item.id));
            return {
                listings,
                bookings: read("tripmate_bookings")
                    .filter(item => listingIds.has(item.propertyId))
                    .map(item => ({
                        ...item,
                        propertyImage: item.propertyImage || item.image || item.images?.[0] || listings.find(listing => String(listing.id) === String(item.propertyId))?.images?.[0] || DEFAULT_LISTING_IMAGE
                    }))
            };
        }
    };

    document.getElementById("dropdownName").textContent = user.name || "Host";
    document.getElementById("dropdownEmail").textContent = user.email || "";
    document.getElementById("avatarPlaceholder").textContent = (user.name || "Host").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

    const avatar = document.getElementById("userAvatarBtn");
    const dropdown = document.getElementById("userDropdown");
    avatar?.addEventListener("click", event => { event.stopPropagation(); dropdown.classList.toggle("open"); });
    document.addEventListener("click", event => {
        if (avatar && dropdown && !avatar.contains(event.target) && !dropdown.contains(event.target)) dropdown.classList.remove("open");
    });
    document.getElementById("logoutBtn")?.addEventListener("click", event => {
        event.preventDefault();
        localStorage.removeItem("tripmate_user");
        localStorage.removeItem("tripmate_session");
        window.location.href = "../homepage.html";
    });

    function bookingRow(booking) {
        const status = escapeHtml(booking.status || "pending");
        const actions = booking.status === "pending"
            ? `<button class="btn btn-secondary btn-sm booking-action" data-id="${booking.id}" data-status="confirmed">Accept</button><button class="btn btn-sm booking-action" data-id="${booking.id}" data-status="cancelled">Decline</button>`
            : "";
        return `<tr><td><strong>${escapeHtml(booking.guestName || "Guest")}</strong></td><td>${escapeHtml(booking.propertyName || "Property")}</td><td>${formatDate(booking.checkin)} - ${formatDate(booking.checkout)}</td><td><span class="status-badge ${status}">${status}</span></td><td>${formatMoney(booking.total)} ${actions}</td></tr>`;
    }

    function earningsRow(booking) {
        const status = escapeHtml(booking.status || "pending");
        return `<tr><td>${escapeHtml(booking.propertyName || "Property")}</td><td>${formatDate(booking.checkin)} - ${formatDate(booking.checkout)}</td><td><span class="status-badge ${status}">${status}</span></td><td>${formatMoney(booking.total)}</td></tr>`;
    }

    function listingCard(listing) {
        const image = getListingImage(listing);
        const status = listing.status || "draft";
        const actions = listing.source === "database"
            ? ""
            : `<div class="listing-actions">
                <a class="btn btn-secondary btn-sm" href="listings.html?edit=${encodeURIComponent(listing.id)}">Edit</a>
                <button type="button" class="btn btn-sm delete-listing-btn" data-listing-id="${escapeHtml(listing.id)}">Delete</button>
            </div>`;
        return `<article class="host-listing-card">
            <div class="listing-img-container"><img src="${escapeHtml(image)}" alt="${escapeHtml(listing.title || "Property")}"><span class="status-badge ${escapeHtml(status)}">${escapeHtml(status)}</span></div>
            <div class="listing-content">
                <h3>${escapeHtml(listing.title || "Untitled property")}</h3>
                <p class="price">${formatMoney(listing.pricePerNight)} <span>/ night</span></p>
                ${actions}
            </div>
        </article>`;
    }

    function deleteLocalListing(listingId) {
        const listings = read("tripmate_listings");
        const owned = listings.find(item => String(item.id) === String(listingId) && String(item.hostId) === String(user.id));
        if (!owned) {
            throw new Error("This listing is not owned by the signed-in host.");
        }
        const remaining = listings.filter(item => !(String(item.id) === String(listingId) && String(item.hostId) === String(user.id)));
        localStorage.setItem("tripmate_listings", JSON.stringify(remaining));
        const draftKey = `host_listing_draft:${user.id}`;
        const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
        if (String(draft?.data?.listingId || "") === String(listingId)) localStorage.removeItem(draftKey);
    }

    async function render() {
        const { listings, bookings } = await getData();
        const active = bookings.filter(item => item.status === "pending" || item.status === "confirmed");
        const earnings = bookings.filter(item => item.status === "confirmed" || item.status === "completed").reduce((sum, item) => sum + Number(item.total || 0), 0);
        const now = new Date();
        const monthEarnings = bookings
            .filter(item => ["confirmed", "completed"].includes(item.status) &&
                new Date(item.checkin).getMonth() === now.getMonth() &&
                new Date(item.checkin).getFullYear() === now.getFullYear())
            .reduce((sum, item) => sum + Number(item.total || 0), 0);
        const pendingPayout = bookings
            .filter(item => item.status === "confirmed" && new Date(item.checkout) > now)
            .reduce((sum, item) => sum + Number(item.total || 0), 0);
        const completed = bookings
            .filter(item => item.status === "completed")
            .sort((a, b) => new Date(b.checkout) - new Date(a.checkout));
        document.getElementById("statTotalListings").textContent = listings.filter(item => item.status === "published" || item.status === "active").length;
        document.getElementById("statActiveBookings").textContent = active.length;
        document.getElementById("statEarnings").textContent = formatMoney(earnings);
        document.getElementById("statOccupancy").textContent = listings.length ? `${Math.min(100, Math.round(active.length / listings.length * 20))}%` : "0%";
        document.getElementById("totalEarnings").textContent = formatMoney(earnings);
        document.getElementById("monthEarnings").textContent = formatMoney(monthEarnings);
        document.getElementById("pendingPayout").textContent = formatMoney(pendingPayout);
        document.getElementById("lastPayout").textContent = completed.length ? formatMoney(completed[0].total) : "—";

        const recent = bookings.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        document.getElementById("recentBookingsTableBody").innerHTML = recent.length ? recent.slice(0, 5).map(bookingRow).join("") : "<tr><td colspan=5>No recent bookings.</td></tr>";
        document.getElementById("allBookingsTableBody").innerHTML = recent.length ? recent.map(bookingRow).join("") : "<tr><td colspan=5>No bookings found.</td></tr>";
        document.getElementById("allListingsGrid").innerHTML = listings.map(listingCard).join("");
        document.getElementById("listingsEmpty").style.display = listings.length ? "none" : "block";
        document.querySelectorAll(".delete-listing-btn").forEach(button => button.addEventListener("click", () => {
            const listingId = button.dataset.listingId;
            const listing = listings.find(item => String(item.id) === String(listingId));
            if (!listing || !window.confirm(`Delete "${listing.title || "this listing"}"? This cannot be undone.`)) return;
            try {
                deleteLocalListing(listingId);
                render();
            } catch (error) {
                console.error("Unable to delete local listing:", error);
                alert(error.message || "Unable to delete this listing.");
            }
        }));
        const earningsBookings = bookings.filter(item => ["confirmed", "completed"].includes(item.status))
            .sort((a, b) => new Date(b.checkout) - new Date(a.checkout));
        document.getElementById("earningsTableBody").innerHTML = earningsBookings.length
            ? earningsBookings.map(earningsRow).join("")
            : "<tr><td colspan=4>No completed or confirmed stays yet.</td></tr>";
        document.querySelectorAll(".booking-action").forEach(button => button.addEventListener("click", async () => {
            try {
                await apiRequest(`/host/bookings/${button.dataset.id}/status`, { method: "PATCH", body: JSON.stringify({ status: button.dataset.status }) });
                render();
            } catch (error) {
                alert(error.message || "Unable to update booking.");
            }
        }));
    }

    function showTab(tabName) {
        document.querySelectorAll(".sidebar-tab[data-tab]").forEach(item => item.classList.toggle("active", item.dataset.tab === tabName));
        document.querySelectorAll(".tab-section").forEach(section => { section.style.display = "none"; });
        const section = document.getElementById(`${tabName}Section`);
        if (section) section.style.display = "block";
    }

    document.querySelectorAll(".sidebar-tab[data-tab]").forEach(tab => tab.addEventListener("click", () => {
        showTab(tab.dataset.tab);
    }));
    document.getElementById("earningsNavLink")?.addEventListener("click", event => {
        event.preventDefault();
        showTab("earnings");
    });

    render();
});
