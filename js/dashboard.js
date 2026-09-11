/* TripMate — Guest Dashboard Logic
   Depends on auth.js being loaded first (getCurrentUser, isLoggedIn, logoutUser). */

(function () {
    "use strict";

    const peso = (n) => "₱" + Math.round(Number(n) || 0).toLocaleString("en-PH");

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    }

    // Escapes any value that gets interpolated into innerHTML, so a booking
    // record (property name, image URL, etc.) can never inject markup.
    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    const BOOKINGS_KEY = "tripmate_bookings";

    // DOM elements
    const upcomingGrid = document.getElementById("upcomingGrid");
    const upcomingCount = document.getElementById("upcomingCount");
    const upcomingEmpty = document.getElementById("upcomingEmpty");

    const pendingGrid = document.getElementById("pendingGrid");
    const pendingCount = document.getElementById("pendingCount");
    const pendingEmpty = document.getElementById("pendingEmpty");

    const pastGrid = document.getElementById("pastGrid");
    const pastCount = document.getElementById("pastCount");
    const pastEmpty = document.getElementById("pastEmpty");

    const cancelledGrid = document.getElementById("cancelledGrid");
    const cancelledCount = document.getElementById("cancelledCount");
    const cancelledEmpty = document.getElementById("cancelledEmpty");

    const contentTitle = document.getElementById("contentTitle");
    const sidebarTabs = document.querySelectorAll(".sidebar-tab");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");

    // Full, unfiltered bookings array as stored — the source of truth we
    // must always write back to localStorage in full (never a filtered
    // subset, or other users'/other pages' bookings get destroyed).
    let allBookingsRaw = [];
    // This user's bookings only — what actually gets rendered.
    let myBookings = [];
    let currentFilter = "upcoming";

    // Auth check and user data (uses the shared helpers from auth.js so
    // the session check stays in one place).
    if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
        window.location.href = "login.html?redirect=dashboard.html";
        return;
    }
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html?redirect=dashboard.html";
        return;
    }

    // Populate user info
    if (dropdownName) dropdownName.textContent = user.name || "Guest";
    if (dropdownEmail) dropdownEmail.textContent = user.email || "";
    if (avatarPlaceholder && user.name) {
        const initials = user.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
        avatarPlaceholder.textContent = initials;
    }

    function readAllBookings() {
        try {
            const parsed = JSON.parse(localStorage.getItem(BOOKINGS_KEY));
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    // Load bookings from localStorage
    function loadBookings() {
        allBookingsRaw = readAllBookings();
        myBookings = allBookingsRaw.filter(b => b.userId === user.id);
        renderAllSections();
    }

    // Categorize bookings by status and date
    function categorizeBookings() {
        const now = new Date();
        const categories = {
            upcoming: [],
            past: [],
            pending: [],
            cancelled: []
        };

        myBookings.forEach(booking => {
            const checkout = new Date(booking.checkout);

            if (booking.status === "cancelled") {
                categories.cancelled.push(booking);
            } else if (booking.status === "pending") {
                categories.pending.push(booking);
            } else if (!isNaN(checkout.getTime()) && checkout < now) {
                categories.past.push(booking);
            } else {
                categories.upcoming.push(booking);
            }
        });

        return categories;
    }

    // Render a single trip card
    function createTripCard(booking) {
        const card = document.createElement("article");
        card.className = "trip-card";
        card.dataset.bookingId = booking.id;

        const status = booking.status || "confirmed";
        const statusClass = `status-${status}`;
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

        const checkoutDate = new Date(booking.checkout);
        const isUpcoming = !isNaN(checkoutDate.getTime()) && checkoutDate >= new Date();
        const isPastCategory = status !== "cancelled" && status !== "pending" && !isUpcoming;
        const canCancel = status !== "cancelled" && !isPastCategory && isUpcoming;
        const guestCount = Number(booking.guests) || 1;

        card.innerHTML = `
            <div class="trip-image">
                <img src="${escapeHtml(booking.propertyImage || 'images/placeholder.jpg')}" alt="${escapeHtml(booking.propertyName)}" loading="lazy">
                <span class="trip-status ${statusClass}">${escapeHtml(statusLabel)}</span>
            </div>
            <div class="trip-content">
                <div class="trip-header">
                    <h3 class="trip-title">${escapeHtml(booking.propertyName)}</h3>
                    <span class="trip-price">${escapeHtml(peso(booking.total))}</span>
                </div>
                <div class="trip-meta">
                    <span class="trip-dates">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${escapeHtml(formatDate(booking.checkin))} – ${escapeHtml(formatDate(booking.checkout))}
                    </span>
                    <span class="trip-guests">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        ${guestCount} guest${guestCount > 1 ? "s" : ""}
                    </span>
                </div>
                <div class="trip-actions">
                    <a href="property.html?id=${encodeURIComponent(booking.propertyId)}" class="btn-secondary btn-sm">View Details</a>
                    ${canCancel ? `
                        <button class="btn-danger btn-sm cancel-btn" data-booking-id="${escapeHtml(booking.id)}">Cancel</button>
                    ` : status === "pending" ? `
                        <button class="btn-secondary btn-sm" disabled>Pending</button>
                    ` : isPastCategory ? `
                        <button class="btn-secondary btn-sm review-btn" data-booking-id="${escapeHtml(booking.id)}">Write Review</button>
                    ` : ''}
                </div>
            </div>
        `;

        // Add cancel handler
        const cancelBtn = card.querySelector(".cancel-btn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => handleCancel(booking.id));
        }

        const reviewBtn = card.querySelector(".review-btn");
        if (reviewBtn) {
            reviewBtn.addEventListener("click", () => handleReview(booking.id));
        }

        return card;
    }

    // Render all sections
    function renderAllSections() {
        const categories = categorizeBookings();

        // Update counts
        if (upcomingCount) upcomingCount.textContent = categories.upcoming.length;
        if (pendingCount) pendingCount.textContent = categories.pending.length;
        if (pastCount) pastCount.textContent = categories.past.length;
        if (cancelledCount) cancelledCount.textContent = categories.cancelled.length;

        // Mirror counts onto the sidebar badges
        const sidebarUpcoming = document.getElementById("sidebarUpcomingCount");
        const sidebarPast = document.getElementById("sidebarPastCount");
        const sidebarPending = document.getElementById("sidebarPendingCount");
        const sidebarCancelled = document.getElementById("sidebarCancelledCount");
        if (sidebarUpcoming) sidebarUpcoming.textContent = categories.upcoming.length;
        if (sidebarPast) sidebarPast.textContent = categories.past.length;
        if (sidebarPending) sidebarPending.textContent = categories.pending.length;
        if (sidebarCancelled) sidebarCancelled.textContent = categories.cancelled.length;

        // Render grids
        renderGrid(upcomingGrid, upcomingEmpty, categories.upcoming);
        renderGrid(pendingGrid, pendingEmpty, categories.pending);
        renderGrid(pastGrid, pastEmpty, categories.past);
        renderGrid(cancelledGrid, cancelledEmpty, categories.cancelled);
    }

    function renderGrid(grid, emptyState, bookings) {
        if (!grid) return;
        grid.innerHTML = "";
        const hasBookings = bookings.length > 0;
        grid.hidden = !hasBookings;
        if (emptyState) emptyState.hidden = hasBookings;
        if (hasBookings) {
            bookings.forEach(booking => {
                grid.appendChild(createTripCard(booking));
            });
        }
    }

    // Handle filter tab clicks
    sidebarTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            currentFilter = tab.dataset.filter;
            sidebarTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Show/hide sections
            document.querySelectorAll(".trips-section").forEach(section => {
                section.hidden = section.id !== `${currentFilter}Section`;
            });

            // Update title
            const titles = {
                upcoming: "Upcoming Trips",
                past: "Past Trips",
                pending: "Pending Requests",
                cancelled: "Cancelled Trips"
            };
            if (contentTitle) contentTitle.textContent = titles[currentFilter] || "";

            // Close sidebar on mobile
            if (window.innerWidth < 768 && sidebar) {
                sidebar.classList.remove("open");
            }
        });
    });

    // Mobile menu toggle
    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            if (sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
        if (window.innerWidth < 768 && sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && (!mobileMenuBtn || !mobileMenuBtn.contains(e.target))) {
                closeSidebar();
            }
        }
    });

    // User dropdown toggle
    if (userAvatarBtn && userDropdown) {
        userAvatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove("open");
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutUser();
            window.location.href = "homepage.html";
        });
    }

    // Cancel booking — updates the FULL bookings array (not the
    // per-user filtered copy) so other users' bookings are preserved.
    function handleCancel(bookingId) {
        if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;

        const fullBookings = readAllBookings();
        const index = fullBookings.findIndex(b => b.id === bookingId);
        if (index === -1) return;

        fullBookings[index].status = "cancelled";
        fullBookings[index].cancelledAt = new Date().toISOString();
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(fullBookings));
        loadBookings();
    }

    // Write review (placeholder)
    function handleReview(bookingId) {
        alert("Review feature coming soon!");
    }

    // Initialize
    loadBookings();
})();