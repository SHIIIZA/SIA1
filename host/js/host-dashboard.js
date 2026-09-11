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
    const getData = async () => {
        try {
            const [listings, bookings] = await Promise.all([apiRequest("/host/listings"), apiRequest("/host/bookings")]);
            return {
                listings: listings.map(item => ({ ...item, pricePerNight: Number(item.price_per_night) })),
                bookings: bookings.map(item => ({ ...item, checkin: item.check_in, checkout: item.check_out, total: Number(item.total_amount), propertyName: item.listings?.title }))
            };
        } catch {
            const listings = read("tripmate_listings").filter(item => item.hostId === user.id);
            const listingIds = new Set(listings.map(item => item.id));
            return { listings, bookings: read("tripmate_bookings").filter(item => listingIds.has(item.propertyId)) };
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
        const actions = booking.status === "pending"
            ? `<button class="btn btn-secondary btn-sm booking-action" data-id="${booking.id}" data-status="confirmed">Accept</button><button class="btn btn-sm booking-action" data-id="${booking.id}" data-status="cancelled">Decline</button>`
            : "";
        return `<tr><td><strong>${booking.guestName || "Guest"}</strong></td><td>${booking.propertyName || "Property"}</td><td>${formatDate(booking.checkin)} - ${formatDate(booking.checkout)}</td><td><span class="status-badge ${booking.status}">${booking.status}</span></td><td>${formatMoney(booking.total)} ${actions}</td></tr>`;
    }

    function listingCard(listing) {
        const image = listing.images?.[0] || "";
        return `<article class="host-listing-card"><div class="listing-img-container">${image ? `<img src="${image}" alt="${listing.title || "Property"}">` : ""}<span class="status-badge ${listing.status}">${listing.status || "draft"}</span></div><div class="listing-content"><h3>${listing.title || "Untitled property"}</h3><p class="price">${formatMoney(listing.pricePerNight)} <span>/ night</span></p><div class="listing-actions"><a class="btn btn-secondary btn-sm" href="listings.html?edit=${encodeURIComponent(listing.id)}">Edit</a></div></div></article>`;
    }

    async function render() {
        const { listings, bookings } = await getData();
        const active = bookings.filter(item => item.status === "pending" || item.status === "confirmed");
        const earnings = bookings.filter(item => item.status === "confirmed" || item.status === "completed").reduce((sum, item) => sum + Number(item.total || 0), 0);
        document.getElementById("statTotalListings").textContent = listings.filter(item => item.status === "published" || item.status === "active").length;
        document.getElementById("statActiveBookings").textContent = active.length;
        document.getElementById("statEarnings").textContent = formatMoney(earnings);
        document.getElementById("statOccupancy").textContent = listings.length ? `${Math.min(100, Math.round(active.length / listings.length * 20))}%` : "0%";

        const recent = bookings.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        document.getElementById("recentBookingsTableBody").innerHTML = recent.length ? recent.slice(0, 5).map(bookingRow).join("") : "<tr><td colspan=5>No recent bookings.</td></tr>";
        document.getElementById("allBookingsTableBody").innerHTML = recent.length ? recent.map(bookingRow).join("") : "<tr><td colspan=5>No bookings found.</td></tr>";
        document.getElementById("allListingsGrid").innerHTML = listings.map(listingCard).join("");
        document.getElementById("listingsEmpty").style.display = listings.length ? "none" : "block";
        document.querySelectorAll(".booking-action").forEach(button => button.addEventListener("click", async () => {
            try {
                await apiRequest(`/host/bookings/${button.dataset.id}/status`, { method: "PATCH", body: JSON.stringify({ status: button.dataset.status }) });
                render();
            } catch (error) {
                alert(error.message || "Unable to update booking.");
            }
        }));
    }

    document.querySelectorAll(".sidebar-tab[data-tab]").forEach(tab => tab.addEventListener("click", () => {
        document.querySelectorAll(".sidebar-tab[data-tab]").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".tab-section").forEach(section => { section.style.display = "none"; });
        const section = document.getElementById(`${tab.dataset.tab}Section`);
        if (section) section.style.display = "block";
    }));

    render();
});
