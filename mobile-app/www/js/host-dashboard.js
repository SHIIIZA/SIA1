/* TripMate — Host Dashboard Logic */

(function () {
    "use strict";

    // DOM elements (matching dashboard.html IDs)
    const statTotalListings = document.getElementById("statTotalListings");
    const statActiveBookings = document.getElementById("statActiveBookings");
    const statMonthlyEarnings = document.getElementById("statMonthlyEarnings");
    const statOccupancy = document.getElementById("statOccupancy");
    const contentTitle = document.getElementById("contentTitle");
    const recentBookingsBody = document.getElementById("recentBookingsBody");
    const allBookingsBody = document.getElementById("allBookingsBody");
    const listingsGrid = document.getElementById("listingsGrid");
    const listingsEmpty = document.getElementById("listingsEmpty");
    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const dashboardSidebar = document.getElementById("dashboardSidebar");
    const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
    const hostSections = document.querySelectorAll(".host-section");
    const bookingStatusFilter = document.getElementById("bookingStatusFilter");

    // Auth check - host must be logged in
    const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");

    if (!user || !session) {
        window.location.href = "../login.html?redirect=host/dashboard.html";
        return;
    }

    // Populate user info
    function populateUserInfo() {
        dropdownName.textContent = user.name || "Host";
        dropdownEmail.textContent = user.email || "";
        contentTitle.textContent = `Welcome, ${(user.name || "Host").split(" ")[0]}`;

        if (user.name) {
            const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            avatarPlaceholder.textContent = initials;
        }
    }

    // Get host's listings
    function getHostListings() {
        const listings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        return listings.filter(l => l.hostId === user.id);
    }

    // Get bookings for host's listings
    function getHostBookings() {
        const bookings = JSON.parse(localStorage.getItem("tripmate_bookings") || "[]");
        const listings = getHostListings();
        const listingIds = listings.map(l => l.id);
        return bookings.filter(b => listingIds.includes(b.propertyId));
    }

    // Format currency
    function formatPHP(amount) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace("PHP", "₱");
    }

    // Format date
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    }

    // Get status badge class
    function getStatusClass(status) {
        switch (status) {
            case "pending": return "status-pending";
            case "confirmed": return "status-confirmed";
            case "cancelled": return "status-cancelled";
            case "completed": return "status-completed";
            default: return "status-pending";
        }
    }

    // Get status label
    function getStatusLabel(status) {
        switch (status) {
            case "pending": return "Pending";
            case "confirmed": return "Confirmed";
            case "cancelled": return "Cancelled";
            case "completed": return "Completed";
            default: return status;
        }
    }

    // Render stats
    function renderStats() {
        const listings = getHostListings();
        const bookings = getHostBookings();
        const now = new Date();

        const totalListings = listings.length;
        const pendingBookings = bookings.filter(b => b.status === "pending").length;
        const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
        const upcomingStays = bookings.filter(b => b.status === "confirmed" && new Date(b.checkIn) >= now).length;
        const completedStays = bookings.filter(b => b.status === "completed").length;
        const totalEarnings = bookings
            .filter(b => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Monthly earnings (this month)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthEarnings = bookings
            .filter(b => (b.status === "confirmed" || b.status === "completed") &&
                new Date(b.checkIn).getMonth() === thisMonth &&
                new Date(b.checkIn).getFullYear() === thisYear)
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Occupancy rate
        const totalPossibleNights = listings.length * 30; // simplified
        const bookedNights = bookings
            .filter(b => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => {
                const checkIn = new Date(b.checkIn);
                const checkOut = new Date(b.checkOut);
                const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                return sum + nights;
            }, 0);
        const occupancy = totalPossibleNights > 0 ? Math.round((bookedNights / totalPossibleNights) * 100) : 0;

        statTotalListings.textContent = totalListings;
        statActiveBookings.textContent = pendingBookings + confirmedBookings;
        statMonthlyEarnings.textContent = formatPHP(monthEarnings);
        statOccupancy.textContent = `${occupancy}%`;
    }

    // Render recent bookings (latest 5)
    function renderRecentBookings() {
        const bookings = getHostBookings();
        const listings = getHostListings();
        const listingMap = {};
        listings.forEach(l => listingMap[l.id] = l.title);

        // Sort by created date descending, take top 5
        const recentBookings = bookings
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5);

        if (recentBookings.length === 0) {
            recentBookingsBody.innerHTML = '<tr class="empty-row"><td colspan="6">No recent bookings</td></tr>';
            return;
        }

        recentBookingsBody.innerHTML = recentBookings.map(booking => {
            const listingTitle = listingMap[booking.propertyId] || "Unknown Property";
            const statusClass = getStatusClass(booking.status);
            const statusLabel = getStatusLabel(booking.status);

            let actionHtml = "";
            if (booking.status === "pending") {
                actionHtml = `
                    <div class="action-buttons">
                        <button class="btn-sm btn-accept" data-booking-id="${booking.id}" data-action="accept">Accept</button>
                        <button class="btn-sm btn-decline" data-booking-id="${booking.id}" data-action="decline">Decline</button>
                    </div>
                `;
            } else if (booking.status === "confirmed") {
                actionHtml = `<span class="action-label">Confirmed</span>`;
            } else {
                actionHtml = `<span class="action-label">${statusLabel}</span>`;
            }

            return `
                <tr>
                    <td>
                        <div class="guest-info">
                            <span class="guest-name">${booking.guestName || "Guest"}</span>
                            <span class="guest-email">${booking.guestEmail || ""}</span>
                        </div>
                    </td>
                    <td>${listingTitle}</td>
                    <td>${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</td>
                    <td>${formatPHP(booking.totalAmount || 0)}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join("");

        // Add event listeners for accept/decline buttons (scoped to this
        // table only — using document.querySelectorAll here would also
        // re-match buttons already rendered by renderAllBookings and
        // attach a second listener to them, firing handleBookingAction twice).
        recentBookingsBody.querySelectorAll(".btn-accept").forEach(btn => {
            btn.addEventListener("click", handleBookingAction);
        });
        recentBookingsBody.querySelectorAll(".btn-decline").forEach(btn => {
            btn.addEventListener("click", handleBookingAction);
        });
    }

    // Render all bookings with filter
    function renderAllBookings(statusFilter = "all") {
        const bookings = getHostBookings();
        const listings = getHostListings();
        const listingMap = {};
        listings.forEach(l => listingMap[l.id] = l.title);

        let filteredBookings = bookings;
        if (statusFilter !== "all") {
            filteredBookings = bookings.filter(b => b.status === statusFilter);
        }

        // Sort by created date descending
        filteredBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (filteredBookings.length === 0) {
            allBookingsBody.innerHTML = '<tr class="empty-row"><td colspan="6">No bookings found</td></tr>';
            return;
        }

        allBookingsBody.innerHTML = filteredBookings.map(booking => {
            const listingTitle = listingMap[booking.propertyId] || "Unknown Property";
            const statusClass = getStatusClass(booking.status);
            const statusLabel = getStatusLabel(booking.status);

            let actionHtml = "";
            if (booking.status === "pending") {
                actionHtml = `
                    <div class="action-buttons">
                        <button class="btn-sm btn-accept" data-booking-id="${booking.id}" data-action="accept">Accept</button>
                        <button class="btn-sm btn-decline" data-booking-id="${booking.id}" data-action="decline">Decline</button>
                    </div>
                `;
            } else if (booking.status === "confirmed") {
                actionHtml = `<span class="action-label">Confirmed</span>`;
            } else {
                actionHtml = `<span class="action-label">${statusLabel}</span>`;
            }

            return `
                <tr>
                    <td>
                        <div class="guest-info">
                            <span class="guest-name">${booking.guestName || "Guest"}</span>
                            <span class="guest-email">${booking.guestEmail || ""}</span>
                        </div>
                    </td>
                    <td>${listingTitle}</td>
                    <td>${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</td>
                    <td>${formatPHP(booking.totalAmount || 0)}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join("");

        // Add event listeners for accept/decline buttons (scoped to this
        // table only — see note in renderRecentBookings for why).
        allBookingsBody.querySelectorAll(".btn-accept").forEach(btn => {
            btn.addEventListener("click", handleBookingAction);
        });
        allBookingsBody.querySelectorAll(".btn-decline").forEach(btn => {
            btn.addEventListener("click", handleBookingAction);
        });
    }

    // Handle booking accept/decline
    function handleBookingAction(e) {
        const bookingId = e.target.dataset.bookingId;
        const action = e.target.dataset.action;

        const bookings = JSON.parse(localStorage.getItem("tripmate_bookings") || "[]");
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) return;

        const newStatus = action === "accept" ? "confirmed" : "cancelled";
        bookings[bookingIndex].status = newStatus;
        bookings[bookingIndex].updatedAt = new Date().toISOString();

        localStorage.setItem("tripmate_bookings", JSON.stringify(bookings));

        showToast(action === "accept" ? "Booking accepted!" : "Booking declined.");
        renderStats();
        renderRecentBookings();
        renderAllBookings(bookingStatusFilter?.value || "all");
        renderListings();
    }

    // Render listings summary (top 4)
    function renderListings() {
        const listings = getHostListings();
        const bookings = getHostBookings();

        if (listings.length === 0) {
            listingsGrid.innerHTML = "";
            listingsEmpty.hidden = false;
            return;
        }

        listingsEmpty.hidden = true;

        // Show top 4 listings
        const displayListings = listings.slice(0, 4);

        listingsGrid.innerHTML = displayListings.map(listing => {
            const listingBookings = bookings.filter(b => b.propertyId === listing.id);
            const pendingCount = listingBookings.filter(b => b.status === "pending").length;
            const confirmedCount = listingBookings.filter(b => b.status === "confirmed").length;

            return `
                <article class="host-listing-card">
                    <div class="host-listing-image">
                        ${listing.images && listing.images[0] ? `<img src="${listing.images[0]}" alt="${listing.title}">` : `<div class="placeholder">🏠</div>`}
                        ${pendingCount > 0 ? `<span class="pending-badge">${pendingCount} pending</span>` : ""}
                    </div>
                    <div class="host-listing-content">
                        <h3 class="host-listing-title">${listing.title}</h3>
                        <p class="host-listing-location">${listing.location || "Philippines"}</p>
                        <div class="host-listing-meta">
                            <span class="host-listing-price">${formatPHP(listing.pricePerNight || 0)}<span>/night</span></span>
                            <span class="host-listing-stats">${confirmedCount} bookings</span>
                        </div>
                        <div class="host-listing-actions">
                            <a href="listings.html?edit=${listing.id}" class="btn-sm btn-secondary">Edit</a>
                            <a href="calendar.html?listing=${listing.id}" class="btn-sm btn-primary">Calendar</a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    // Render earnings section
    function renderEarnings() {
        const bookings = getHostBookings();
        const listings = getHostListings();

        const totalEarnings = bookings
            .filter(b => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthEarnings = bookings
            .filter(b => (b.status === "confirmed" || b.status === "completed") &&
                new Date(b.checkIn).getMonth() === thisMonth &&
                new Date(b.checkIn).getFullYear() === thisYear)
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        const pendingPayout = bookings
            .filter(b => b.status === "confirmed" && new Date(b.checkOut) > new Date())
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Last payout (last completed booking)
        const completedBookings = bookings
            .filter(b => b.status === "completed")
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        const lastPayout = completedBookings.length > 0 ? formatPHP(completedBookings[0].totalAmount || 0) : "—";

        document.getElementById("totalEarnings").textContent = formatPHP(totalEarnings);
        document.getElementById("monthEarnings").textContent = formatPHP(monthEarnings);
        document.getElementById("pendingPayout").textContent = formatPHP(pendingPayout);
        document.getElementById("lastPayout").textContent = lastPayout;
    }

    // Section navigation
    function showSection(sectionId) {
        hostSections.forEach(section => {
            section.hidden = section.id !== `${sectionId}Section`;
        });
        sidebarLinks.forEach(link => {
            link.classList.toggle("active", link.dataset.section === sectionId);
        });
    }

    // Sidebar click handlers
    sidebarLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });

    // Booking status filter
    if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener("change", (e) => {
            renderAllBookings(e.target.value);
        });
    }

    // User dropdown toggle
    userAvatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove("open");
        }
    });

    // Logout
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("tripmate_session");
        localStorage.removeItem("tripmate_user");
        window.location.href = "../homepage.html";
    });

    // Mobile sidebar toggle
    mobileMenuBtn.addEventListener("click", () => {
        dashboardSidebar.classList.add("open");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
        if (window.innerWidth < 1024) {
            if (!dashboardSidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                dashboardSidebar.classList.remove("open");
            }
        }
    });

    // Toast notification
    function showToast(message, isError = false) {
        let toast = document.querySelector(".toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.toggle("error-toast", isError);
        toast.classList.add("show");
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    // Add toast styles if not already present
    if (!document.querySelector("#toast-styles")) {
        const style = document.createElement("style");
        style.id = "toast-styles";
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 14px 24px;
                border-radius: 12px;
                background: var(--success);
                color: var(--white);
                font-weight: 500;
                font-size: 0.9rem;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s;
            }
            .toast.show {
                opacity: 1;
                transform: translateY(0);
            }
            .toast.error-toast {
                background: var(--error);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    populateUserInfo();
    renderStats();
    renderRecentBookings();
    renderAllBookings();
    renderListings();
    renderEarnings();
})();