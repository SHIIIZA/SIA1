/* TripMate — Property Detail Page Logic
   Loads property data from URL params or localStorage demo data */

(function () {
    "use strict";

    // Demo property data (matching stays.js format)
    const propertyData = {
        "happy-hut": {
            id: "happy-hut",
            name: "Happy Hut",
            type: "Cabin",
            location: "San Felipe, Zambales",
            price: 2000,
            rating: 4.92,
            reviews: 86,
            guests: 4,
            amenities: ["Wifi", "Kitchen", "Beachfront", "Pet friendly"],
            images: [
                "https://cf.bstatic.com/xdata/images/hotel/max1024x768/630810990.jpg?k=f0a258fd952f19c7285f4e99e64664bc423cd779166b639a29d87037cb90b2ac&o=",
                "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=800&auto=format&fit=crop"
            ],
            description: "A charming beachfront cabin nestled in the coastal town of San Felipe, Zambales. Wake up to the sound of waves and enjoy stunning sunsets from your private patio. Perfect for couples or small families seeking a peaceful escape from the city.",
            host: {
                name: "Maria Santos",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                joined: "2022",
                verified: true,
                responseRate: 98,
                responseTime: "within an hour"
            },
            houseRules: [
                "Check-in: 2:00 PM – 10:00 PM",
                "Check-out: 11:00 AM",
                "No smoking indoors",
                "No parties or events",
                "Pets allowed on request (additional fee may apply)",
                "Quiet hours: 10:00 PM – 7:00 AM"
            ],
            reviews: [
                {
                    id: 1,
                    author: "Juan Dela Cruz",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
                    date: "2024-02-15",
                    rating: 5,
                    text: "Absolutely amazing stay! The cabin is exactly as pictured - clean, cozy, and right on the beach. Maria was an incredible host, very responsive and gave us great local recommendations for restaurants and hidden beaches. The sunset views from the patio were unforgettable. Will definitely return!"
                },
                {
                    id: 2,
                    author: "Sarah Chen",
                    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
                    date: "2024-01-28",
                    rating: 5,
                    text: "Perfect weekend getaway! The location is stunning - you step out and you're on the sand. The cabin has everything you need, kitchen is well-equipped, bed is super comfortable. Maria even provided fresh local fruits on arrival. Highly recommend for anyone wanting a quiet beach escape."
                },
                {
                    id: 3,
                    author: "Miguel Rodriguez",
                    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
                    date: "2024-01-10",
                    rating: 4,
                    text: "Great stay overall. The cabin is beautiful and the beach is pristine. Only minor issue was the wifi was a bit spotty for video calls, but that's to be expected in this remote location. Maria was quick to respond when we asked about it. Perfect for disconnecting!"
                }
            ]
        },
        "kuadro-hotel-and-suites": {
            id: "kuadro-hotel-and-suites",
            name: "Kuadro Hotel and Suites",
            type: "Hotel",
            location: "Moalboal, Cebu",
            price: 2200,
            rating: 4.85,
            reviews: 214,
            guests: 2,
            amenities: ["Wifi", "Pool", "Air conditioning"],
            images: [
                "https://cfstatic.staah.net/w*2000/big_14581_1781579948247.jpeg?k=902NTY78jA7cf8c8n6pumZFmK2Mco8np8opi9tGUj4XocTHBQ7c5MTM=",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop"
            ],
            description: "Modern boutique hotel in the heart of Moalboal, just minutes from White Beach and the famous sardine run. Clean, comfortable rooms with all the amenities you need for a diving adventure or beach vacation. Friendly staff and great value.",
            host: {
                name: "Kuadro Management",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
                joined: "2021",
                verified: true,
                responseRate: 95,
                responseTime: "within a few hours"
            },
            houseRules: [
                "Check-in: 2:00 PM",
                "Check-out: 12:00 PM",
                "No smoking in rooms",
                "No parties",
                "Pets not allowed",
                "Valid ID required at check-in"
            ],
            reviews: [
                {
                    id: 1,
                    author: "Ana Reyes",
                    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
                    date: "2024-02-20",
                    rating: 5,
                    text: "Perfect location for diving in Moalboal! Walking distance to the sardine run and turtle point. Rooms are clean and modern, pool is refreshing after a day of diving. Staff were incredibly helpful with arranging boat trips."
                },
                {
                    id: 2,
                    author: "David Kim",
                    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
                    date: "2024-02-05",
                    rating: 5,
                    text: "Great value for money. Clean rooms, strong AC, good wifi, and the pool area is lovely. Close to restaurants and the beach. Would stay again."
                }
            ]
        },
        "baey-bogan-homestay": {
            id: "baey-bogan-homestay",
            name: "Baey bogan Homestay",
            type: "House rental",
            location: "Sagada, Mountain Province",
            price: 1800,
            rating: 4.28,
            reviews: 63,
            guests: 4,
            amenities: ["Wifi", "Kitchen", "Air conditioning"],
            images: [
                "https://cf.bstatic.com/xdata/images/hotel/max1024x768/184656762.jpg?k=03df05cdd232e5aec61fb79b29314d5d84e8eb5904f33efa84a05dd9b1800e80&o=",
                "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=800&auto=format&fit=crop"
            ],
            description: "Cozy homestay in Sagada with mountain views and easy access to Echo Valley, Hanging Coffins, and Sumaguing Cave. Experience authentic Igorot hospitality in a comfortable home setting. Perfect base for exploring the Cordilleras.",
            host: {
                name: "Lydia Baey",
                avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop",
                joined: "2023",
                verified: true,
                responseRate: 100,
                responseTime: "within an hour"
            },
            houseRules: [
                "Check-in: 1:00 PM – 9:00 PM",
                "Check-out: 11:00 AM",
                "No smoking indoors",
                "No parties",
                "Respect quiet hours",
                "Remove shoes indoors"
            ],
            reviews: [
                {
                    id: 1,
                    author: "Kevin Tan",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
                    date: "2024-02-10",
                    rating: 4,
                    text: "Authentic Sagada experience! Lydia was so welcoming and made us feel like family. The house is cozy with amazing mountain views. Close to the town center and tour starting points. Home-cooked breakfast was a highlight!"
                }
            ]
        }
    };

    // Utility functions
    const peso = (n) => "₱" + Math.round(n).toLocaleString("en-PH");

    function getStarSVG(filled) {
        return filled
            ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }

    function renderStars(rating, maxStars = 5) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let html = "";
        for (let i = 0; i < maxStars; i++) {
            if (i < fullStars) html += getStarSVG(true);
            else if (i === fullStars && hasHalf) html += getStarSVG(true);
            else html += getStarSVG(false);
        }
        return html;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    }

    // Amenity icons mapping
    const amenityIcons = {
        "Wifi": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.5 16.5a5.5 5.5 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
        "Pool": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 16h18M3 8h18"/><path d="M12 3v18"/></svg>`,
        "Kitchen": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        "Air conditioning": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/><path d="M4 12h16"/><path d="M4 4l16 16"/><path d="M16 4l-16 16"/></svg>`,
        "Beachfront": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.5v-5a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2v5"/><path d="M8 12v8"/><path d="M12 12v8"/><path d="M16 12v8"/></svg>`,
        "Pet friendly": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M19 10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/><path d="M7 19a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1z"/></svg>`
    };

    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get("id") || "happy-hut";
    const property = propertyData[propertyId];

    if (!property) {
        console.error("Property not found:", propertyId);
        window.location.href = "stays.html";
        return;
    }

    // DOM elements
    const mainImage = document.getElementById("mainImage");
    const galleryThumbs = document.getElementById("galleryThumbs");
    const propertyType = document.getElementById("propertyType");
    const propertyName = document.getElementById("propertyName");
    const propertyLocation = document.getElementById("propertyLocation");
    const propertyStars = document.getElementById("propertyStars");
    const propertyRatingValue = document.getElementById("propertyRatingValue");
    const propertyReviewCount = document.getElementById("propertyReviewCount");
    const propertyHost = document.getElementById("propertyHost");
    const propertyDescription = document.getElementById("propertyDescription");
    const amenitiesGrid = document.getElementById("amenitiesGrid");
    const houseRules = document.getElementById("houseRules");
    const reviewsSummary = document.getElementById("reviewsSummary");
    const reviewsList = document.getElementById("reviewsList");
    const nightlyPrice = document.getElementById("nightlyPrice");
    const bookingBreakdown = document.getElementById("bookingBreakdown");
    const bookingForm = document.getElementById("bookingForm");
    const checkinDate = document.getElementById("checkinDate");
    const checkoutDate = document.getElementById("checkoutDate");
    const guestCount = document.getElementById("guestCount");
    const guestMinus = document.getElementById("guestMinus");
    const guestPlus = document.getElementById("guestPlus");
    const bookNowBtn = document.getElementById("bookNowBtn");

    // Initialize page
    function init() {
        document.title = `${property.name} — TripMate`;

        // Gallery
        mainImage.src = property.images[0];
        mainImage.alt = property.name;

        property.images.forEach((img, i) => {
            const thumb = document.createElement("button");
            thumb.className = "thumb" + (i === 0 ? " active" : "");
            thumb.innerHTML = `<img src="${img}" alt="${property.name} - Photo ${i + 1}">`;
            thumb.addEventListener("click", () => {
                mainImage.style.opacity = 0;
                setTimeout(() => {
                    mainImage.src = img;
                    mainImage.style.opacity = 1;
                }, 150);
                document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
            });
            galleryThumbs.appendChild(thumb);
        });

        // Property header
        propertyType.textContent = property.type;
        propertyName.textContent = property.name;
        propertyLocation.textContent = property.location;
        propertyStars.innerHTML = renderStars(property.rating);
        propertyRatingValue.textContent = property.rating.toFixed(2);
        propertyReviewCount.textContent = `(${property.reviews} reviews)`;

        // Host
        propertyHost.innerHTML = `
            <img src="${property.host.avatar}" alt="${property.host.name}" class="host-avatar">
            <div class="host-info">
                <h3>Hosted by ${property.host.name}</h3>
                <p>Joined ${property.host.joined} · ${property.host.responseRate}% response rate · ${property.host.responseTime}</p>
                ${property.host.verified ? '<span class="host-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Verified host</span>' : ''}
            </div>
        `;

        // Description
        propertyDescription.textContent = property.description;

        // Amenities
        amenitiesGrid.innerHTML = property.amenities.map(a => `
            <div class="amenity-item">
                ${amenityIcons[a] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`}
                <span>${a}</span>
            </div>
        `).join("");

        // House rules
        houseRules.innerHTML = property.houseRules.map(rule => `<li>${rule}</li>`).join("");

        // Reviews summary
        const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
            const count = property.reviews.filter(r => r.rating === stars).length;
            const pct = property.reviews.length ? (count / property.reviews.length) * 100 : 0;
            return { stars, count, pct };
        });

        reviewsSummary.innerHTML = `
            <div class="reviews-score">
                <div class="score">${property.rating.toFixed(2)}</div>
                <div class="stars">${renderStars(property.rating)}</div>
                <div style="margin-top: 4px; color: var(--ink-light); font-size: 0.9rem;">${property.reviews} reviews</div>
            </div>
            <div class="reviews-breakdown">
                ${ratingDistribution.map(r => `
                    <div class="review-bar">
                        <label>${r.stars}★</label>
                        <div class="bar"><div class="fill" style="width: ${r.pct}%"></div></div>
                        <span class="count">${r.count}</span>
                    </div>
                `).join("")}
            </div>
        `;

        // Reviews list
        reviewsList.innerHTML = property.reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-author">
                        <img src="${r.avatar}" alt="${r.author}">
                        <strong>${r.author}</strong>
                    </div>
                    <span class="review-date">${formatDate(r.date)}</span>
                </div>
                <div class="stars" style="margin-bottom: 8px;">${renderStars(r.rating)}</div>
                <p class="review-text">${r.text}</p>
            </div>
        `).join("");

        // Nightly price
        nightlyPrice.textContent = peso(property.price);

        // Date handling
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const minDate = today.toISOString().split("T")[0];
        const minDateTomorrow = tomorrow.toISOString().split("T")[0];

        checkinDate.min = minDate;
        checkoutDate.min = minDateTomorrow;

        // Pre-fill from URL params (from stays.html search)
        const urlCheckin = urlParams.get("checkin");
        const urlCheckout = urlParams.get("checkout");
        const urlGuests = urlParams.get("guests");

        if (urlCheckin) checkinDate.value = urlCheckin;
        if (urlCheckout) checkoutDate.value = urlCheckout;
        if (urlGuests) guestCount.value = Math.min(Math.max(parseInt(urlGuests), 1), property.guests);

        // If checkin provided but not checkout, set checkout to next day
        if (checkinDate.value && !checkoutDate.value) {
            const nextDay = new Date(checkinDate.value);
            nextDay.setDate(nextDay.getDate() + 1);
            checkoutDate.value = nextDay.toISOString().split("T")[0];
        }

        // Update checkout min when checkin changes
        checkinDate.addEventListener("change", () => {
            const nextDay = new Date(checkinDate.value);
            nextDay.setDate(nextDay.getDate() + 1);
            checkoutDate.min = nextDay.toISOString().split("T")[0];
            if (checkoutDate.value && checkoutDate.value <= checkinDate.value) {
                checkoutDate.value = nextDay.toISOString().split("T")[0];
            }
            updateBreakdown();
        });

        checkoutDate.addEventListener("change", updateBreakdown);

        // Guest stepper
        guestMinus.addEventListener("click", () => {
            if (guestCount.value > 1) {
                guestCount.value = parseInt(guestCount.value) - 1;
                updateBreakdown();
            }
        });

        guestPlus.addEventListener("click", () => {
            if (guestCount.value < property.guests) {
                guestCount.value = parseInt(guestCount.value) + 1;
                updateBreakdown();
            }
        });

        // Initial breakdown
        updateBreakdown();

        // Form submit
        bookingForm.addEventListener("submit", handleBooking);
    }

    function updateBreakdown() {
        const checkin = checkinDate.value;
        const checkout = checkoutDate.value;
        const guests = parseInt(guestCount.value) || 1;

        if (!checkin || !checkout) {
            bookingBreakdown.innerHTML = `
                <div class="breakdown-row">
                    <span>Nightly price</span>
                    <span class="amount">${peso(property.price)}</span>
                </div>
                <div class="breakdown-row">
                    <span>Select dates for total</span>
                    <span class="amount">—</span>
                </div>
            `;
            return;
        }

        const start = new Date(checkin);
        const end = new Date(checkout);
        const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

        const subtotal = property.price * nights;
        const cleaningFee = 500;
        const serviceFee = Math.round(subtotal * 0.08);
        const total = subtotal + cleaningFee + serviceFee;

        bookingBreakdown.innerHTML = `
            <div class="breakdown-row">
                <span>₱${property.price.toLocaleString("en-PH")} × ${nights} night${nights > 1 ? "s" : ""}</span>
                <span class="amount">${peso(subtotal)}</span>
            </div>
            <div class="breakdown-row">
                <span>Cleaning fee</span>
                <span class="amount">${peso(cleaningFee)}</span>
            </div>
            <div class="breakdown-row">
                <span>Service fee (8%)</span>
                <span class="amount">${peso(serviceFee)}</span>
            </div>
            <div class="breakdown-row total">
                <span>Total</span>
                <span class="amount">${peso(total)}</span>
            </div>
        `;

        bookingForm.dataset.total = total;
        bookingForm.dataset.nights = nights;
        bookingForm.dataset.subtotal = subtotal;
        bookingForm.dataset.cleaningFee = cleaningFee;
        bookingForm.dataset.serviceFee = serviceFee;
    }

    function handleBooking(e) {
        e.preventDefault();

        const checkin = checkinDate.value;
        const checkout = checkoutDate.value;
        const guests = parseInt(guestCount.value) || 1;

        if (!checkin || !checkout) {
            showToast("Please select check-in and check-out dates.", true);
            return;
        }

        if (guests > property.guests) {
            showToast(`This property accommodates up to ${property.guests} guests.`, true);
            return;
        }

        const session = localStorage.getItem("tripmate_session");
        const currentUser = JSON.parse(localStorage.getItem("tripmate_user") || "null");
        if (!session || !currentUser) {
            showToast("Please log in to book.", true);
            setTimeout(() => {
                const redirectTarget = `property.html?id=${propertyId}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`;
                window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
            }, 1000);
            return;
        }

        bookNowBtn.disabled = true;
        bookNowBtn.innerHTML = `
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; margin-right: 8px;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1" stroke-linecap="round"/>
            </svg>
            Booking...
        `;

        setTimeout(() => {
            const booking = {
                id: "BK-" + Date.now().toString(36).toUpperCase(),
                userId: currentUser.id,
                guestName: currentUser.name || "Guest",
                guestEmail: currentUser.email || "",
                propertyId: property.id,
                propertyName: property.name,
                propertyImage: property.images[0],
                checkin,
                checkout,
                guests,
                nights: parseInt(bookingForm.dataset.nights),
                subtotal: parseInt(bookingForm.dataset.subtotal),
                cleaningFee: parseInt(bookingForm.dataset.cleaningFee),
                serviceFee: parseInt(bookingForm.dataset.serviceFee),
                total: parseInt(bookingForm.dataset.total),
                status: "pending",
                createdAt: new Date().toISOString()
            };

            const bookings = JSON.parse(localStorage.getItem("tripmate_bookings") || "[]");
            bookings.push(booking);
            localStorage.setItem("tripmate_bookings", JSON.stringify(bookings));

            window.location.href = `booking-confirmation.html?id=${booking.id}`;
        }, 1000);
    }

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

    const style = document.createElement("style");
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    init();
})();