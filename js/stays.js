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
                img: item.images?.[0] || ""
            });
        });
    } catch { /* Ignore malformed local data and keep demo stays available. */ }

    async function loadDatabaseListings() {
        try {
            const remoteListings = await apiRequest("/listings");
            const remoteIds = new Set(remoteListings.map(item => String(item.id)));
            const remoteTitles = new Set(remoteListings.map(item => String(item.title || "").trim().toLowerCase()));
            listings = listings.filter(item =>
                !remoteIds.has(String(item.id)) &&
                !remoteTitles.has(String(item.name || "").trim().toLowerCase())
            ).concat(remoteListings.map(item => ({
                id: item.id,
                name: item.title,
                type: item.property_type,
                location: item.location,
                price: Number(item.price_per_night),
                rating: Number(item.rating) || 5,
                reviews: Number(item.review_count) || 0,
                guests: Number(item.max_guests),
                amenities: item.amenities || [],
                img: item.images?.[0] || ""
            })));
            render();
        } catch (error) {
            console.warn("Database listings unavailable:", error.message);
        }
    }

    const peso = (n) => "\u20B1" + Math.round(n).toLocaleString("en-PH");

    const priceBounds = { min: 800, max: 6000 };
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

    const currentUser = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    try {
        const saved = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        saved.filter(item => !currentUser || item.userId === currentUser.id).forEach(item => state.favorites.add(item.propertyId));
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
        const isFav = state.favorites.has(l.id);
        const detailUrl = `property.html?id=${encodeURIComponent(l.id)}`;
        return `
      <article class="listing-card" data-id="${l.id}">
        <div class="listing-media">
          <a href="${detailUrl}" class="listing-media-link" aria-label="View ${l.name}">
            <img src="${l.img}" alt="${l.name}" loading="lazy">
          </a>
          <span class="listing-badge">${l.type}</span>
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

    function render() {
        const results = applyFilters();
        if (resultsCount) resultsCount.textContent = `${results.length} stay${results.length === 1 ? "" : "s"}`;
        if (grid) {
            grid.innerHTML = results.map(cardHTML).join("");
            grid.style.display = results.length === 0 ? "none" : "grid";
        }
        if (emptyState) emptyState.hidden = results.length !== 0;
        renderChips();
        const params = new URLSearchParams();
        if (state.search) params.set("search", state.search);
        if (state.sort !== "recommended") params.set("sort", state.sort);
        if (state.minPrice !== priceBounds.min) params.set("minPrice", state.minPrice);
        if (state.maxPrice !== priceBounds.max) params.set("maxPrice", state.maxPrice);
        window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    }

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

    document.getElementById("saveSearchBtn")?.addEventListener("click", async () => {
        if (!currentUser) {
            window.location.href = `login.html?redirect=${encodeURIComponent("stays.html")}`;
            return;
        }
        try {
            await apiRequest("/saved-searches", { method: "POST", body: JSON.stringify({ search_name: state.search || "Trip search", filters: { search: state.search, minPrice: state.minPrice, maxPrice: state.maxPrice, sort: state.sort, guests: state.guests } }) });
            showToast("Search saved.");
        } catch (error) {
            showToast(error.message || "Unable to save search.", true);
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
                const selected = listings.find((item) => item.id === id);
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
        if (state.favorites.has(id)) {
            state.favorites.delete(id);
            favBtn.classList.remove("is-active");
        } else {
            if (!currentUser) {
                window.location.href = `login.html?redirect=${encodeURIComponent("stays.html")}`;
                return;
            }
            state.favorites.add(id);
            favBtn.classList.add("is-active");
        }
        if (currentUser) {
            try {
                const existing = await apiRequest("/wishlist");
                const saved = existing.find(item => String(item.listing_id) === String(id));
                if (state.favorites.has(id) && !saved) {
                    await apiRequest("/wishlist", { method: "POST", body: JSON.stringify({ listing_id: Number(id) }) });
                } else if (!state.favorites.has(id) && saved) {
                    await apiRequest(`/wishlist/${saved.id}`, { method: "DELETE" });
                }
            } catch (error) {
                console.error(error);
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

    updatePriceUI();
    render();
    loadDatabaseListings();
})();