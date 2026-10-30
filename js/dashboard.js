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
    const walletBalance = document.getElementById("walletBalance");
    const walletTransactions = document.getElementById("walletTransactions");
    const savedTripGrid = document.getElementById("savedTripGrid");
    const savedTripEmpty = document.getElementById("savedTripEmpty");
    const savedTripStatus = document.getElementById("savedTripStatus");
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

    const savedTripKey = `tripmate_saved_trip:${user.id}`;

    function renderSavedTrip() {
        if (!savedTripGrid || !savedTripEmpty) return;
        if (savedTripStatus) savedTripStatus.textContent = "";
        let items;
        try {
            const stored = JSON.parse(localStorage.getItem(savedTripKey) || "[]");
            if (!Array.isArray(stored)) throw new Error("Saved trip data is invalid.");
            items = stored.filter(item => item && typeof item === "object" && item.propertyId != null);
        } catch (error) {
            console.error("Unable to load the saved trip plan:", error);
            if (savedTripStatus) savedTripStatus.textContent = "Your saved trip could not be read from this browser.";
            items = [];
        }
        savedTripGrid.innerHTML = items.map(item => `
            <article class="saved-trip-card">
                <img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.name || "Saved stay")}" loading="lazy">
                <div>
                    <h3>${escapeHtml(item.name || "Saved stay")}</h3>
                    <p>${escapeHtml(item.location || "")}</p>
                    <strong>${escapeHtml(peso(item.price))} / night</strong>
                </div>
                <button type="button" class="btn-secondary btn-sm" data-remove-trip-id="${escapeHtml(item.propertyId)}">Remove</button>
            </article>
        `).join("");
        savedTripEmpty.hidden = items.length > 0;
    }

    savedTripGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-remove-trip-id]");
        if (!button) return;
        try {
            const items = JSON.parse(localStorage.getItem(savedTripKey) || "[]");
            if (!Array.isArray(items)) throw new Error("Saved trip data is invalid.");
            const remaining = items.filter(item => String(item.propertyId) !== String(button.dataset.removeTripId));
            localStorage.setItem(savedTripKey, JSON.stringify(remaining));
            renderSavedTrip();
        } catch (error) {
            console.error("Unable to remove a stay from the saved trip:", error);
            if (savedTripStatus) savedTripStatus.textContent = "The stay could not be removed. Check available browser storage and try again.";
        }
    });
    renderSavedTrip();

    // Populate user info
    if (dropdownName) dropdownName.textContent = user.name || "Guest";
    if (dropdownEmail) dropdownEmail.textContent = user.email || "";
    if (avatarPlaceholder && user.name) {
        const initials = user.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
        avatarPlaceholder.textContent = initials;
    }

    async function loadWallet() {
        if (!walletBalance || !walletTransactions) return;
        try {
            const wallet = await apiRequest("/wallet");
            walletBalance.textContent = Number(wallet.balance || 0).toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP"
            });
            const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
            walletTransactions.innerHTML = transactions.length
                ? transactions.map(transaction => `
                    <div class="wallet-transaction">
                        <span>${escapeHtml(transaction.description || `Refund for booking #${transaction.booking_id}`)}</span>
                        <span>+${Number(transaction.amount || 0).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP"
                        })}</span>
                    </div>
                `).join("")
                : '<p class="wallet-empty">No wallet credits yet.</p>';
        } catch (error) {
            walletBalance.textContent = "Unavailable";
            walletTransactions.innerHTML = `<p class="wallet-empty">${escapeHtml(error.message || "Wallet could not be loaded.")}</p>`;
        }
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
    async function loadBookings() {
        try {
            const rows = await apiRequest("/bookings");
            myBookings = rows.map(booking => ({
                ...booking,
                id: booking.id,
                userId: booking.guest_id,
                propertyId: booking.listing_id,
                propertyName: booking.listings?.title || `Listing #${booking.listing_id}`,
                checkin: booking.check_in,
                checkout: booking.check_out,
                guests: booking.guest_count,
                total: Number(booking.total_amount),
                propertyImage: booking.listings?.images?.[0] || ""
            }));
        } catch (error) {
            upcomingEmpty.hidden = false;
            upcomingEmpty.textContent = error.message || 'Unable to load bookings.';
            return;
        }
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
            } else if (["pending", "cancellation_requested"].includes(booking.status)) {
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
        const statusLabel = status === "cancellation_requested" ? "Cancellation awaiting review" : status.charAt(0).toUpperCase() + status.slice(1);

        const checkoutDate = new Date(booking.checkout);
        const isUpcoming = !isNaN(checkoutDate.getTime()) && checkoutDate >= new Date();
        const isPastCategory = status !== "cancelled" && status !== "pending" && !isUpcoming;
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const canCancel = ['pending', 'confirmed'].includes(status) && booking.checkin >= today;
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

    async function handleCancel(bookingId) {
        try {
            const quote = await apiRequest(`/bookings/${encodeURIComponent(bookingId)}/cancellation-quote`);
            if (!quote.can_cancel) throw new Error('This booking cannot be cancelled online.');
            const money = value => Number(value).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
            const nextStep = quote.requires_approval
                ? 'Submit for admin approval? Your booking stays reserved until approved.'
                : 'Cancel this unpaid booking now? No refund will be issued.';
            if (!confirm(`Paid: ${money(quote.paid_amount)}\nCancellation fee: ${money(quote.cancellation_fee)}\nRefund to TripMate Wallet: ${money(quote.refund_amount)}\n\n${nextStep}`)) return;
            const result = await apiRequest(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {
                method: 'PATCH', body: JSON.stringify({ expected_refund: quote.refund_amount })
            });
            await Promise.all([loadBookings(), loadWallet()]);
            window.tripmateRefreshNotifications?.();
            alert(result.status === 'cancellation_requested'
                ? 'Cancellation submitted for admin review. You will receive an in-app notification with the decision.'
                : 'Booking cancelled. Any eligible refund is shown in your TripMate Wallet.');
        } catch (error) { alert(error.message || 'Unable to cancel this booking. Please try again.'); }
    }

    // Write review (placeholder)
    async function handleReview(bookingId) {
        const rating = Number(prompt("Rate your stay from 1 to 5:", "5"));
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
        const comment = prompt("Write a short review:", "Great stay!") || "";
        try {
            await apiRequest("/reviews", { method: "POST", body: JSON.stringify({ booking_id: bookingId, rating, comment }) });
            showToast("Review submitted. Thank you!");
        } catch (error) {
            showToast(error.message || "Unable to submit review.", true);
        }
    }

    // Initialize
    loadBookings();
    loadWallet();
})();