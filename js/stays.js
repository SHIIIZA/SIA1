(function () {
    "use strict";

    let listings = [
        {
            id: "happy-hut", name: "Happy Hut", type: "Cabin",
            location: "San Felipe, Zambales", price: 2000, rating: 4.92, reviews: 86, guests: 4,
            amenities: ["Wifi", "Kitchen", "Beachfront", "Pet friendly"],
            img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/630810990.jpg?k=f0a258fd952f19c7285f4e99e64664bc423cd779166b639a29d87037cb90b2ac&o="
        },
        {
            id: "kuadro-hotel-and-suites", name: "Kuadro Hotel and Suites", type: "Hotel",
            location: "Moalboal, Cebu", price: 2200, rating: 4.85, reviews: 214, guests: 2,
            amenities: ["Wifi", "Pool", "Air conditioning"],
            img: "https://cfstatic.staah.net/w*2000/big_14581_1781579948247.jpeg?k=902NTY78jA7cf8c8n6pumZFmK2Mco8np8opi9tGUj4XocTHBQ7c5MTM="
        },
        {
            id: "baey-bogan-homestay", name: "Baey bogan Homestay", type: "House rental",
            location: "Sagada, Mountain Province", price: 1800, rating: 4.28, reviews: 63, guests: 4,
            amenities: ["Wifi", "Kitchen", "Air conditioning"],
            img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/184656762.jpg?k=03df05cdd232e5aec61fb79b29314d5d84e8eb5904f33efa84a05dd9b1800e80&o="
        },
        {
            id: "baguio-holiday-villas", name: "Baguio Holiday Villas", type: "Villa",
            location: "Baguio City, Benguet", price: 4300, rating: 4.92, reviews: 128, guests: 6,
            amenities: ["Wifi", "Kitchen", "Air conditioning", "Pet friendly"],
            img: "https://pix8.agoda.net/hotelImages/275905/0/2bfa720cb4d3471781e35efcbe6c3dfe.jpg?ce=2&s=375x"
        },
        {
            id: "alon-resort", name: "Alon Resort", type: "Resort",
            location: "General Luna, Siargao", price: 2900, rating: 4.88, reviews: 171, guests: 4,
            amenities: ["Wifi", "Beachfront", "Kitchen"],
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVJ03F6aGc6mGqRA_pNPSmADp1ioMW0JHRVKb4OFcFnztKn03YanWUbPk&s=10"
        },
        {
            id: "kubo-homestay", name: "Kubo Homestay", type: "Cabin",
            location: "El Nido, Palawan", price: 3600, rating: 4.95, reviews: 97, guests: 4,
            amenities: ["Wifi", "Beachfront"],
            img: "https://a0.muscache.com/im/pictures/d64b6a63-3599-4fa3-a6dc-3062a952202b.jpg?im_w=720"
        },
        {
            id: "ivatan-stone-house", name: "Ivatan Stone House", type: "House rental",
            location: "Basco, Batanes", price: 2600, rating: 4.98, reviews: 41, guests: 2,
            amenities: ["Wifi", "Kitchen", "Pet friendly"],
            img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/25/1d/9d/8d/house-of-dakay-in-ivana.jpg?w=900&h=500&s=1"
        },
        {
            id: "astoria-current", name: "Astoria Current", type: "Resort",
            location: "Boracay, Aklan", price: 5800, rating: 4.9, reviews: 342, guests: 4,
            amenities: ["Wifi", "Pool", "Beachfront", "Air conditioning"],
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7DjJY2wWxNmj-AVl2FuBM8tT99YqVb3U2AO-5srMWWAkFKwRowBoNAb9I&s=10"
        },
        {
            id: "sunset-villa", name: "Sunset Villa", type: "Villa",
            location: "Coron, Palawan", price: 5200, rating: 4.94, reviews: 118, guests: 8,
            amenities: ["Wifi", "Pool", "Kitchen", "Beachfront"],
            img: "https://discovery.s14-host.com/qkUByrarp5PILHjccAD3jHDhtozxLY-metaU3Vuc2V0LVZpbGxhLURlbHV4ZS1WZXJhbmRhLmpwZw==-.jpg"
        },
        {
            id: "summit-ridge-hotel", name: "Summit Ridge Hotel", type: "Hotel",
            location: "Tagaytay, Cavite", price: 3100, rating: 4.7, reviews: 256, guests: 2,
            amenities: ["Wifi", "Air conditioning", "Pool"],
            img: "https://q-xx.bstatic.com/xdata/images/hotel/max500/706396016.jpg?k=3529c641d8fd7b530aad8996d0a01cbf7ae799a6003388650f33a1823a3fd0d3&o="
        },
        {
            id: "la-casa-ramirez", name: "La Casa Ramirez", type: "Hotel",
            location: "Vigan, Ilocos Sur", price: 2200, rating: 4.8, reviews: 132, guests: 3,
            amenities: ["Wifi", "Air conditioning"],
            img: "https://pix8.agoda.net/property/63493626/0/3391d813834943320c8e241cfe585d82.jpeg?ce=3&s=600x"
        },
        {
            id: "backpackers-travelers-inn", name: "Backpackers Travelers Inn", type: "Cabin",
            location: "Valencia, Negros Oriental", price: 900, rating: 4.87, reviews: 74, guests: 10,
            amenities: ["Wifi", "Pet friendly"],
            img: "https://pix8.agoda.net/hotelImages/85348252/0/b294dc4f9636bff3a7f896491fd591cc.jpg?ce=3&s=600x"
        }
    ];
    try {
        const hostListings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        hostListings.filter(item => item.status === "published" || item.status === "active").forEach(item => {
            listings.push({
                id: item.id,
                name: item.title || "TripMate stay",
                type: item.propertyType || "House rental",
                location: item.location || "Philippines",
                price: Number(item.pricePerNight) || 0,
                rating: Number(item.rating) || 5,
                reviews: Number(item.reviews) || 0,
                guests: Number(item.maxGuests) || 1,
                amenities: item.amenities || [],
                img: item.images?.[0] || "",
                source: "local"
            });
        });
    } catch { /* Ignore malformed local data and keep demo stays available. */ }

    async function loadDatabaseListings() {
        try {
            const remoteListings = await apiRequest("/listings");
            if (!remoteListings.length) return;

            const databaseListings = remoteListings.map(item => ({
                id: item.id,
                name: item.title,
                type: item.property_type,
                location: item.location,
                price: Number(item.price_per_night),
                rating: Number(item.rating) || 5,
                reviews: Number(item.review_count) || 0,
                guests: Number(item.max_guests),
                amenities: item.amenities || [],
                img: item.images?.[0] || "",
                cleaningFee: Number(item.cleaning_fee) || 0,
                testOnly: String(item.description || "").includes("test-only"),
                source: "database"
            }));

            const normalize = (value) => String(value || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();

            databaseListings.forEach((remote) => {
                const remoteId = String(remote.id);
                const remoteName = normalize(remote.name);
                const remoteLocation = normalize(remote.location);
                const existing = listings.find((listing) => {
                    if (String(listing.id) === remoteId) return true;
                    return normalize(listing.name) === remoteName
                        && normalize(listing.location) === remoteLocation;
                });

                if (existing) {
                    Object.assign(existing, remote);
                } else {
                    listings.push(remote);
                }
            });

            render();
        } catch (error) {
            console.warn("Database listings unavailable:", error.message);
        }
    }

    const peso = (n) => "\u20B1" + Math.round(n).toLocaleString("en-PH");

    const priceBounds = { min: 50, max: 6000 };
    const state = {
        search: "",
        types: new Set(),
        amenities: new Set(),
        minPrice: priceBounds.min,
        maxPrice: priceBounds.max,
        minRating: 0,
        guests: 1,
        sort: "recommended",
        favorites: new Set()
    };

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    } catch (error) {
        console.warn("Unable to read the current TripMate user:", error.message);
    }
    try {
        const saved = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        saved.filter(item => currentUser && String(item.userId) === String(currentUser.id))
            .forEach(item => state.favorites.add(String(item.propertyId)));
    } catch { /* Keep an empty wishlist when local data is malformed. */ }

    const grid = document.getElementById("staysGrid");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyState");
    const activeChips = document.getElementById("activeChips");
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    const priceMin = document.getElementById("priceMin");
    const priceMax = document.getElementById("priceMax");
    const priceFill = document.getElementById("priceFill");
    const priceMinLabel = document.getElementById("priceMinLabel");
    const priceMaxLabel = document.getElementById("priceMaxLabel");
    const filterGuestCount = document.getElementById("filterGuestCount");
    const loadMoreStays = document.getElementById("loadMoreStays");
    const staysMapView = document.getElementById("staysMapView");
    const staysMapFrame = document.getElementById("staysMapFrame");
    const mapViewSummary = document.getElementById("mapViewSummary");
    const mapLocationList = document.getElementById("mapLocationList");
    const showListView = document.getElementById("showListView");
    const showMapView = document.getElementById("showMapView");
    const savedSearchesList = document.getElementById("savedSearchesList");
    const savedSearchesStatus = document.getElementById("savedSearchesStatus");
    const saveSearchButton = document.getElementById("saveSearchBtn");
    const pageSize = 6;
    let visibleCount = pageSize;
    let displayMode = "list";
    let savedSearchRecords = [];

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    function readSavedSearchFilters(search) {
        if (search?.filters && typeof search.filters === "object") return search.filters;
        if (typeof search?.filters === "string") {
            try {
                const filters = JSON.parse(search.filters);
                return filters && typeof filters === "object" && !Array.isArray(filters) ? filters : {};
            } catch (error) {
                console.warn("Skipping a saved search with invalid filters:", error.message);
            }
        }
        return {};
    }

    function isValidSearchDate(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function getSavedSearchSummary(search) {
        const filters = readSavedSearchFilters(search);
        const details = [];
        if (typeof filters.search === "string" && filters.search.trim()) {
            details.push(`"${filters.search.trim()}"`);
        }
        if (filters.minPrice != null && filters.maxPrice != null &&
            Number.isFinite(Number(filters.minPrice)) && Number.isFinite(Number(filters.maxPrice)) &&
            (Number(filters.minPrice) > priceBounds.min || Number(filters.maxPrice) < priceBounds.max)) {
            details.push(`${peso(filters.minPrice)}\u2013${peso(filters.maxPrice)} / night`);
        }
        if (Array.isArray(filters.types) && filters.types.length) details.push(filters.types.join(", "));
        if (Array.isArray(filters.amenities) && filters.amenities.length) details.push(filters.amenities.join(", "));
        if (Number(filters.guests) > 1) details.push(`${Number(filters.guests)}+ guests`);
        if (Number(filters.minRating) > 0) details.push(`${Number(filters.minRating)}+ rating`);
        return details.length ? details.join(" \u00b7 ") : "All stays";
    }

    function renderSavedSearches(searches) {
        if (!savedSearchesList) return;
        if (savedSearchesStatus) savedSearchesStatus.textContent = "";
        if (!searches.length) {
            savedSearchesList.innerHTML = `
                <p class="saved-searches-empty">
                    <strong>No saved searches yet</strong>
                    <span>Set your filters, then choose "Save search" to keep them handy.</span>
                </p>`;
            return;
        }
        savedSearchesList.innerHTML = searches.map(search => `
            <article class="saved-search-card" data-saved-search-id="${escapeHtml(search.id)}">
                <button type="button" class="saved-search-apply" data-action="apply-saved-search">
                    <span class="saved-search-copy">
                        <strong>${escapeHtml(search.search_name || "Saved search")}</strong>
                        <span class="saved-search-summary">${escapeHtml(getSavedSearchSummary(search))}</span>
                        <span class="saved-search-date">${escapeHtml(
                            search.created_at && !Number.isNaN(Date.parse(search.created_at))
                                ? `Saved ${new Date(search.created_at).toLocaleDateString("en-PH")}`
                                : "Saved search"
                        )}</span>
                    </span>
                    <span class="saved-search-apply-label">Apply</span>
                </button>
                <button type="button" class="saved-search-remove" data-action="remove-saved-search" aria-label="Delete ${escapeHtml(search.search_name || "saved search")}" title="Delete saved search">&times;</button>
            </article>
        `).join("");
    }

    async function loadSavedSearches() {
        if (!savedSearchesList) return;
        if (savedSearchesStatus) savedSearchesStatus.textContent = "Loading saved searches...";
        if (!currentUser) {
            savedSearchRecords = [];
            savedSearchesList.innerHTML = `
                <p class="saved-searches-empty">
                    <strong>Sign in to see your saved searches</strong>
                    <span>Your searches will be available whenever you log in.</span>
                </p>`;
            if (savedSearchesStatus) savedSearchesStatus.textContent = "";
            return false;
        }
        try {
            const searches = await apiRequest("/saved-searches");
            if (!Array.isArray(searches)) throw new Error("The saved-search response was invalid.");
            savedSearchRecords = searches;
            renderSavedSearches(searches);
            return true;
        } catch (error) {
            console.error("Unable to load saved searches:", error);
            if (savedSearchesStatus) savedSearchesStatus.textContent = error.message || "Saved searches could not be loaded.";
            savedSearchesList.innerHTML = `
                <p class="saved-searches-empty saved-searches-error">
                    <strong>Saved searches couldn't be loaded</strong>
                    <span>There was a problem reaching your account.</span>
                </p>`;
            const retryButton = document.createElement("button");
            retryButton.type = "button";
            retryButton.className = "saved-search-retry";
            retryButton.dataset.action = "retry-saved-searches";
            retryButton.textContent = "Try again";
            savedSearchesList.append(retryButton);
            return false;
        }
    }

    function applySavedSearch(search) {
        const filters = readSavedSearchFilters(search);
        state.search = typeof filters.search === "string" ? filters.search : "";
        state.minPrice = Number.isFinite(Number(filters.minPrice))
            ? Math.min(priceBounds.max, Math.max(priceBounds.min, Number(filters.minPrice)))
            : priceBounds.min;
        state.maxPrice = Number.isFinite(Number(filters.maxPrice))
            ? Math.min(priceBounds.max, Math.max(state.minPrice, Number(filters.maxPrice)))
            : priceBounds.max;
        state.sort = ["recommended", "price-asc", "price-desc", "rating-desc"].includes(filters.sort)
            ? filters.sort
            : "recommended";
        state.guests = Number.isInteger(Number(filters.guests))
            ? Math.min(10, Math.max(1, Number(filters.guests)))
            : 1;
        const rating = Number(filters.minRating);
        state.minRating = [0, 4, 4.5, 5].includes(rating) ? rating : 0;
        const validTypes = new Set([...document.querySelectorAll("#typeList input")].map(input => input.value));
        const validAmenities = new Set([...document.querySelectorAll("#amenityList input")].map(input => input.value));
        state.types = new Set(Array.isArray(filters.types)
            ? filters.types.filter(value => typeof value === "string" && validTypes.has(value))
            : []);
        state.amenities = new Set(Array.isArray(filters.amenities)
            ? filters.amenities.filter(value => typeof value === "string" && validAmenities.has(value))
            : []);
        const checkin = isValidSearchDate(filters.checkin) ? filters.checkin : "";
        const checkout = isValidSearchDate(filters.checkout) ? filters.checkout : "";
        if (checkin && checkout && checkin < checkout) {
            localStorage.setItem("trip_checkin", checkin);
            localStorage.setItem("trip_checkout", checkout);
        } else {
            localStorage.removeItem("trip_checkin");
            localStorage.removeItem("trip_checkout");
        }

        if (searchInput) searchInput.value = state.search;
        if (sortSelect) sortSelect.value = state.sort;
        if (priceMin) priceMin.value = String(state.minPrice);
        if (priceMax) priceMax.value = String(state.maxPrice);
        if (filterGuestCount) filterGuestCount.textContent = String(state.guests);
        const ratingInput = document.querySelector(`input[name="rating"][value="${state.minRating}"]`);
        if (ratingInput) ratingInput.checked = true;
        syncCheckboxes("#typeList", state.types);
        syncCheckboxes("#amenityList", state.amenities);
        updatePriceUI();
        render();
    }

    document.querySelectorAll("#typeList .checkbox-row").forEach((row) => {
        const input = row.querySelector("input");
        if (input) {
            const val = input.value;
            const count = listings.filter((l) => l.type === val).length;
            const countEl = row.querySelector(".check-count");
            if (countEl) countEl.textContent = count;
        }
    });

    function cardHTML(l) {
        const isFav = state.favorites.has(String(l.id));
        const detailUrl = `property.html?id=${encodeURIComponent(l.id)}`;
        return `
      <article class="listing-card" data-id="${l.id}">
        <div class="listing-media">
          <a href="${detailUrl}" class="listing-media-link" aria-label="View ${l.name}">
            <img src="${l.img}" alt="${l.name}" loading="lazy">
          </a>
          <span class="listing-badge">${l.type}${l.testOnly ? " · TEST ONLY" : ""}</span>
          <button class="fav-btn ${isFav ? "is-active" : ""}" data-action="fav" aria-label="Save ${l.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 21s-7-4.35-9.5-8.36C.65 9.28 2.1 5.5 5.6 5.02 7.9 4.7 9.9 5.9 12 8.3c2.1-2.4 4.1-3.6 6.4-3.28 3.5.48 4.95 4.26 3.1 7.62C19 16.65 12 21 12 21z"/>
            </svg>
          </button>
        </div>
        <div class="listing-content">
          <div class="listing-title-row">
            <h3 class="listing-title"><a href="${detailUrl}">${l.name}</a></h3>
            <span class="listing-rating">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#E8B04B" stroke="#E8B04B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${l.rating.toFixed(2)}</span>
            </span>
          </div>
          <p class="listing-loc">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${l.location}</span>
          </p>
          <p class="listing-guests">Up to ${l.guests} guest${l.guests > 1 ? "s" : ""} &middot; ${l.reviews} reviews</p>
          <div class="listing-amenities">
            ${l.amenities.slice(0, 3).map((a) => `<span class="amenity-pill">${a}</span>`).join("")}
          </div>
          <div class="listing-footer">
            <p class="listing-price"><b class="price-val">${peso(l.price)}</b> <span class="price-period">/ night</span></p>
            <a class="listing-book" href="booking.html?id=${encodeURIComponent(l.id)}">Reserve</a>
          </div>
        </div>
      </article>`;
    }

    function applyFilters() {
        let out = listings.filter((l) => {
            if (state.search) {
                const hay = (l.name + " " + l.location).toLowerCase();
                if (!hay.includes(state.search.toLowerCase())) return false;
            }
            if (state.types.size && !state.types.has(l.type)) return false;
            if (l.price < state.minPrice || l.price > state.maxPrice) return false;
            if (l.rating < state.minRating) return false;
            if (l.guests < state.guests) return false;
            if (state.amenities.size) {
                for (const a of state.amenities) {
                    if (!l.amenities.includes(a)) return false;
                }
            }
            return true;
        });

        switch (state.sort) {
            case "price-asc": out.sort((a, b) => a.price - b.price); break;
            case "price-desc": out.sort((a, b) => b.price - a.price); break;
            case "rating-desc": out.sort((a, b) => b.rating - a.rating); break;
            default: out.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
        }
        return out;
    }

    function render(resetVisibleCount = true) {
        const results = applyFilters();
        if (resetVisibleCount) visibleCount = pageSize;
        if (resultsCount) resultsCount.textContent = `${results.length} stay${results.length === 1 ? "" : "s"}`;
        if (grid) {
            grid.innerHTML = results.slice(0, visibleCount).map(cardHTML).join("");
            grid.style.display = results.length === 0 ? "none" : "grid";
        }
        if (loadMoreStays) {
            loadMoreStays.hidden = displayMode !== "list" || results.length <= visibleCount;
            loadMoreStays.textContent = `Show more stays (${Math.min(pageSize, results.length - visibleCount)} more)`;
        }
        if (staysMapView) staysMapView.hidden = displayMode !== "map" || results.length === 0;
        if (grid && displayMode === "map") grid.style.display = "none";
        if (staysMapFrame && displayMode === "map" && results.length) {
            const location = results[0].location || "Philippines";
            staysMapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
            if (mapViewSummary) mapViewSummary.textContent = `Showing ${results.length} filtered stay locations. The map is centered on ${location}; select a stay below to open its exact location.`;
        }
        if (mapLocationList) {
            mapLocationList.innerHTML = results.map(listing =>
                `<a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(listing.location)}" target="_blank" rel="noopener noreferrer">${escapeHtml(listing.name)} · ${escapeHtml(listing.location)}</a>`
            ).join("");
        }
        if (emptyState) emptyState.hidden = results.length !== 0;
        renderChips();
        const params = new URLSearchParams();
        if (state.search) params.set("search", state.search);
        if (state.sort !== "recommended") params.set("sort", state.sort);
        if (state.minPrice !== priceBounds.min) params.set("minPrice", state.minPrice);
        if (state.maxPrice !== priceBounds.max) params.set("maxPrice", state.maxPrice);
        if (state.minRating > 0) params.set("rating", state.minRating);
        if (state.guests > 1) params.set("guests", state.guests);
        if (state.types.size) params.set("type", [...state.types].join(","));
        if (state.amenities.size) params.set("amenity", [...state.amenities].join(","));
        const checkin = localStorage.getItem("trip_checkin");
        const checkout = localStorage.getItem("trip_checkout");
        if (checkin) params.set("checkin", checkin);
        if (checkout) params.set("checkout", checkout);
        window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    }

    loadMoreStays?.addEventListener("click", () => {
        visibleCount += pageSize;
        render(false);
    });

    showListView?.addEventListener("click", () => {
        displayMode = "list";
        showListView.setAttribute("aria-pressed", "true");
        showMapView?.setAttribute("aria-pressed", "false");
        showListView.classList.add("active");
        showMapView?.classList.remove("active");
        render(false);
    });

    showMapView?.addEventListener("click", () => {
        displayMode = "map";
        showMapView.setAttribute("aria-pressed", "true");
        showListView?.setAttribute("aria-pressed", "false");
        showMapView.classList.add("active");
        showListView?.classList.remove("active");
        render(false);
    });

    function renderChips() {
        if (!activeChips) return;
        const chips = [];
        if (state.search) chips.push({ key: "search", label: `"${state.search}"` });
        state.types.forEach((t) => chips.push({ key: "type", value: t, label: t }));
        state.amenities.forEach((a) => chips.push({ key: "amenity", value: a, label: a }));
        if (state.minRating > 0) chips.push({ key: "rating", label: `${state.minRating}+ rating` });
        if (state.guests > 1) chips.push({ key: "guests", label: `${state.guests}+ guests` });
        if (state.minPrice !== priceBounds.min || state.maxPrice !== priceBounds.max) {
            chips.push({ key: "price", label: `${peso(state.minPrice)}\u2013${peso(state.maxPrice)}` });
        }

        activeChips.innerHTML = chips.map((c) =>
            `<span class="chip" data-key="${c.key}" data-value="${c.value || ""}">${c.label}<button type="button" aria-label="Remove filter">&times;</button></span>`
        ).join("");
    }

    activeChips?.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const key = chip.dataset.key;
        const value = chip.dataset.value;
        if (key === "search") { state.search = ""; if (searchInput) searchInput.value = ""; }
        if (key === "type") { state.types.delete(value); syncCheckboxes("#typeList", state.types); }
        if (key === "amenity") { state.amenities.delete(value); syncCheckboxes("#amenityList", state.amenities); }
        if (key === "rating") { state.minRating = 0; const r0 = document.querySelector('input[name="rating"][value="0"]'); if (r0) r0.checked = true; }
        if (key === "guests") { state.guests = 1; if (filterGuestCount) filterGuestCount.textContent = "1"; }
        if (key === "price") { resetPriceRange(); }
        render();
    });

    function syncCheckboxes(selector, set) {
        document.querySelectorAll(`${selector} input`).forEach((cb) => {
            cb.checked = set.has(cb.value);
        });
    }

    searchInput?.addEventListener("input", () => {
        state.search = searchInput.value.trim();
        render();
    });
    document.getElementById("heroSearchBtn")?.addEventListener("click", () => {
        document.querySelector(".stays-main")?.scrollIntoView({ behavior: "smooth" });
    });

    saveSearchButton?.addEventListener("click", async () => {
        if (!currentUser) {
            const returnPath = `${window.location.pathname}${window.location.search}`;
            window.location.href = `login.html?redirect=${encodeURIComponent(returnPath)}`;
            return;
        }
        saveSearchButton.disabled = true;
        try {
            const filters = {
                search: state.search,
                minPrice: state.minPrice,
                maxPrice: state.maxPrice,
                sort: state.sort,
                guests: state.guests,
                minRating: state.minRating,
                types: [...state.types],
                amenities: [...state.amenities],
                checkin: localStorage.getItem("trip_checkin") || "",
                checkout: localStorage.getItem("trip_checkout") || ""
            };
            const searchName = state.search.slice(0, 100) || "Trip search";
            await apiRequest("/saved-searches", {
                method: "POST",
                body: JSON.stringify({
                    search_name: searchName,
                    filters
                })
            });
            const refreshed = await loadSavedSearches();
            if (savedSearchesStatus) {
                savedSearchesStatus.textContent = refreshed
                    ? "Search saved to your TripMate account."
                    : "Search saved, but the list could not be refreshed.";
            }
        } catch (error) {
            console.error("Unable to save search:", error);
            if (savedSearchesStatus) savedSearchesStatus.textContent = error.message || "Unable to save search.";
        } finally {
            saveSearchButton.disabled = false;
        }
    });

    savedSearchesList?.addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");
        if (button?.dataset.action === "retry-saved-searches") {
            button.disabled = true;
            await loadSavedSearches();
            return;
        }
        const card = button?.closest("[data-saved-search-id]");
        if (!button || !card) return;
        if (button.dataset.action === "apply-saved-search") {
            button.disabled = true;
            try {
                const savedSearch = savedSearchRecords
                    .find(search => String(search.id) === String(card.dataset.savedSearchId));
                if (!savedSearch) {
                    if (savedSearchesStatus) savedSearchesStatus.textContent = "That saved search is no longer available.";
                    await loadSavedSearches();
                    return;
                }
                applySavedSearch(savedSearch);
            } catch (error) {
                console.error("Unable to apply saved search:", error);
                if (savedSearchesStatus) savedSearchesStatus.textContent = error.message || "Unable to apply saved search.";
            } finally {
                button.disabled = false;
            }
            return;
        }
        if (button.dataset.action !== "remove-saved-search") return;
        button.disabled = true;
        try {
            await apiRequest(`/saved-searches/${encodeURIComponent(card.dataset.savedSearchId)}`, { method: "DELETE" });
            const refreshed = await loadSavedSearches();
            if (savedSearchesStatus) {
                savedSearchesStatus.textContent = refreshed
                    ? "Saved search deleted."
                    : "Saved search deleted, but the list could not be refreshed.";
            }
        } catch (error) {
            console.error("Unable to delete saved search:", error);
            if (savedSearchesStatus) savedSearchesStatus.textContent = error.message || "Unable to delete saved search.";
            button.disabled = false;
        }
    });

    sortSelect?.addEventListener("change", () => {
        state.sort = sortSelect.value;
        render();
    });

    document.querySelectorAll("#typeList input").forEach((cb) => {
        cb.addEventListener("change", () => {
            cb.checked ? state.types.add(cb.value) : state.types.delete(cb.value);
            render();
        });
    });
    document.querySelectorAll("#amenityList input").forEach((cb) => {
        cb.addEventListener("change", () => {
            cb.checked ? state.amenities.add(cb.value) : state.amenities.delete(cb.value);
            render();
        });
    });

    document.querySelectorAll('input[name="rating"]').forEach((r) => {
        r.addEventListener("change", () => {
            state.minRating = Number(r.value);
            render();
        });
    });

    document.getElementById("filterGuestMinus")?.addEventListener("click", () => {
        if (state.guests > 1) {
            state.guests -= 1;
            if (filterGuestCount) filterGuestCount.textContent = state.guests;
            render();
        }
    });
    document.getElementById("filterGuestPlus")?.addEventListener("click", () => {
        if (state.guests < 10) {
            state.guests += 1;
            if (filterGuestCount) filterGuestCount.textContent = state.guests;
            render();
        }
    });

    function updatePriceUI() {
        if (!priceMin || !priceMax || !priceFill) return;
        let lo = Number(priceMin.value);
        let hi = Number(priceMax.value);
        if (lo > hi - 200) {
            lo = hi - 200;
            priceMin.value = lo;
        }
        state.minPrice = lo;
        state.maxPrice = hi;
        if (priceMinLabel) priceMinLabel.textContent = lo.toLocaleString("en-PH");
        if (priceMaxLabel) priceMaxLabel.textContent = hi.toLocaleString("en-PH");

        const range = priceBounds.max - priceBounds.min;
        const leftPct = ((lo - priceBounds.min) / range) * 100;
        const rightPct = ((hi - priceBounds.min) / range) * 100;
        priceFill.style.left = leftPct + "%";
        priceFill.style.width = (rightPct - leftPct) + "%";
    }

    function resetPriceRange() {
        if (priceMin) priceMin.value = priceBounds.min;
        if (priceMax) priceMax.value = priceBounds.max;
        updatePriceUI();
    }

    priceMin?.addEventListener("input", function () { updatePriceUI(); render(); });
    priceMax?.addEventListener("input", function () { updatePriceUI(); render(); });

    grid?.addEventListener("click", async (e) => {
        const bookBtn = e.target.closest(".listing-book");
        if (bookBtn) {
            const card = bookBtn.closest(".listing-card");
            if (card) {
                const id = card.dataset.id;
                const selected = listings.find((item) => String(item.id) === String(id));
                if (selected) {
                    localStorage.setItem("selectedStay", JSON.stringify(selected));
                }
            }
            return;
        }

        const favBtn = e.target.closest('[data-action="fav"]');
        if (!favBtn) return;
        e.preventDefault();
        const card = favBtn.closest(".listing-card");
        if (!card) return;
        const id = card.dataset.id;
        const selected = listings.find(item => String(item.id) === String(id));
        if (!selected) return;
        const key = String(id);
        const wasFavorite = state.favorites.has(key);
        if (wasFavorite) {
            state.favorites.delete(key);
            favBtn.classList.remove("is-active");
        } else {
            if (!currentUser) {
                window.location.href = `login.html?redirect=${encodeURIComponent("stays.html")}`;
                return;
            }
            state.favorites.add(key);
            favBtn.classList.add("is-active");
        }

        if (currentUser) {
            try {
                const saved = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
                const userSaved = saved.filter(item => String(item.userId) === String(currentUser.id) &&
                    String(item.propertyId) !== key);
                if (!wasFavorite) {
                    userSaved.push({
                        userId: currentUser.id,
                        propertyId: key,
                        savedAt: new Date().toISOString(),
                        savedPrice: Number(selected.price)
                    });
                }
                const otherUsers = saved.filter(item => String(item.userId) !== String(currentUser.id));
                localStorage.setItem("tripmate_wishlist", JSON.stringify([...otherUsers, ...userSaved]));
            } catch (error) {
                console.error("Unable to save the wishlist in this browser:", error);
            }
        }

        if (currentUser && selected.source === "database") {
            try {
                const existing = await apiRequest("/wishlist");
                const saved = existing.find(item => String(item.listing_id ?? item.listings?.id) === key);
                if (!wasFavorite && !saved) {
                    await apiRequest("/wishlist", { method: "POST", body: JSON.stringify({ listing_id: selected.id }) });
                } else if (wasFavorite && saved) {
                    await apiRequest(`/wishlist/${saved.id}`, { method: "DELETE" });
                }
            } catch (error) {
                console.error("Unable to sync the wishlist with the account:", error);
                if (wasFavorite) state.favorites.add(key);
                else state.favorites.delete(key);
                favBtn.classList.toggle("is-active", wasFavorite);
                try {
                    const saved = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
                    const otherUsers = saved.filter(item => String(item.userId) !== String(currentUser.id));
                    const userSaved = saved.filter(item => String(item.userId) === String(currentUser.id) &&
                        String(item.propertyId) !== key);
                    if (wasFavorite) {
                        userSaved.push({ userId: currentUser.id, propertyId: key, savedAt: new Date().toISOString() });
                    }
                    localStorage.setItem("tripmate_wishlist", JSON.stringify([...otherUsers, ...userSaved]));
                } catch (storageError) {
                    console.error("Unable to restore the browser wishlist after sync failed:", storageError);
                }
                alert("Your wishlist could not be synced with your account. Please try again.");
            }
        }
    });

    function clearAll() {
        state.search = "";
        state.types.clear();
        state.amenities.clear();
        state.minRating = 0;
        state.guests = 1;
        state.sort = "recommended";

        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "recommended";
        document.querySelectorAll("#typeList input, #amenityList input").forEach((cb) => (cb.checked = false));
        const r0 = document.querySelector('input[name="rating"][value="0"]');
        if (r0) r0.checked = true;
        if (filterGuestCount) filterGuestCount.textContent = "1";
        document.querySelectorAll("#categoryCarousel .category-pill").forEach(p => {
            const isAll = p.dataset.category === "all";
            p.classList.toggle("is-active", isAll);
            p.setAttribute("aria-selected", isAll ? "true" : "false");
        });
        resetPriceRange();
        render();
    }
    document.getElementById("clearFilters")?.addEventListener("click", clearAll);
    document.getElementById("emptyClearBtn")?.addEventListener("click", clearAll);

    document.getElementById("categoryCarousel")?.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-pill");
        if (!btn) return;
        const cat = btn.dataset.category;
        document.querySelectorAll("#categoryCarousel .category-pill").forEach(p => {
            p.classList.remove("is-active");
            p.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");

        state.types.clear();
        state.amenities.clear();
        if (cat === "Beachfront") {
            state.amenities.add("Beachfront");
        } else if (cat !== "all") {
            state.types.add(cat);
        }
        syncCheckboxes("#typeList", state.types);
        syncCheckboxes("#amenityList", state.amenities);
        render();
    });

    const filtersPanel = document.getElementById("filtersPanel");
    document.getElementById("filtersToggle")?.addEventListener("click", () => filtersPanel?.classList.add("is-open"));
    document.getElementById("filtersClose")?.addEventListener("click", () => filtersPanel?.classList.remove("is-open"));

    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            const isOpen = navLinks.style.display === "flex";
            navLinks.style.display = isOpen ? "none" : "flex";
            navLinks.style.flexDirection = "column";
            navLinks.style.position = "absolute";
            navLinks.style.top = "70px";
            navLinks.style.right = "20px";
            navLinks.style.background = "var(--teal-900)";
            navLinks.style.padding = "18px 22px";
            navLinks.style.borderRadius = "14px";
            navLinks.style.gap = "16px";
            navLinks.style.zIndex = "20";
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const incomingSearch = urlParams.get('search');
    const incomingCheckIn = urlParams.get('checkin');
    const incomingCheckOut = urlParams.get('checkout');
    const incomingSort = urlParams.get('sort');
    const incomingMinPrice = Number(urlParams.get('minPrice'));
    const incomingMaxPrice = Number(urlParams.get('maxPrice'));
    const incomingTypes = (urlParams.get("type") || "").split(",").filter(Boolean);
    const incomingAmenities = (urlParams.get("amenity") || "").split(",").filter(Boolean);
    const incomingRating = Number(urlParams.get("rating"));
    const incomingGuests = Number(urlParams.get("guests"));

    if (incomingSearch && searchInput) {
        state.search = incomingSearch;
        searchInput.value = incomingSearch;
    }
    if (incomingCheckIn) localStorage.setItem('trip_checkin', incomingCheckIn);
    if (incomingCheckOut) localStorage.setItem('trip_checkout', incomingCheckOut);
    if (["recommended", "price-asc", "price-desc", "rating-desc"].includes(incomingSort)) {
        state.sort = incomingSort;
        if (sortSelect) sortSelect.value = incomingSort;
    }
    if (incomingMinPrice >= priceBounds.min && incomingMinPrice <= priceBounds.max && priceMin) priceMin.value = incomingMinPrice;
    if (incomingMaxPrice >= priceBounds.min && incomingMaxPrice <= priceBounds.max && priceMax) priceMax.value = incomingMaxPrice;
    incomingTypes.forEach(type => state.types.add(type));
    incomingAmenities.forEach(amenity => state.amenities.add(amenity));
    if (incomingRating > 0 && incomingRating <= 5) state.minRating = incomingRating;
    if (Number.isInteger(incomingGuests) && incomingGuests > 1 && incomingGuests <= 10) state.guests = incomingGuests;
    syncCheckboxes("#typeList", state.types);
    syncCheckboxes("#amenityList", state.amenities);
    const selectedRating = document.querySelector(`input[name="rating"][value="${state.minRating}"]`);
    if (selectedRating) selectedRating.checked = true;
    if (filterGuestCount) filterGuestCount.textContent = String(state.guests);

    updatePriceUI();
    render();
    loadDatabaseListings();
    loadSavedSearches();
})();