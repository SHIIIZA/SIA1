(function () {
    "use strict";

    /* ---------------------------------------------------------
       Dataset
    --------------------------------------------------------- */
    const listings = [
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

    const peso = (n) => "\u20B1" + Math.round(n).toLocaleString("en-PH");

    /* ---------------------------------------------------------
       State
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       DOM refs
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Populate type counts (static, based on full dataset)
    --------------------------------------------------------- */
    document.querySelectorAll("#typeList .checkbox-row").forEach((row) => {
        const val = row.querySelector("input").value;
        const count = listings.filter((l) => l.type === val).length;
        row.querySelector(".check-count").textContent = count;
    });

    /* ---------------------------------------------------------
       Card markup
    --------------------------------------------------------- */
    function cardHTML(l) {
        const isFav = state.favorites.has(l.id);
        return `
      <article class="listing-card" data-id="${l.id}">
        <div class="listing-media" style="position:relative;">
          <img src="${l.img}" alt="${l.name}">
          <span class="listing-badge">${l.type}</span>
          <button class="fav-btn ${isFav ? "is-active" : ""}" data-action="fav" aria-label="Save ${l.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 21s-7-4.35-9.5-8.36C.65 9.28 2.1 5.5 5.6 5.02 7.9 4.7 9.9 5.9 12 8.3c2.1-2.4 4.1-3.6 6.4-3.28 3.5.48 4.95 4.26 3.1 7.62C19 16.65 12 21 12 21z"/>
            </svg>
          </button>
        </div>
        <div class="listing-title-row">
          <h3>${l.name}</h3>
          <span class="listing-rating">&#9733; ${l.rating.toFixed(2)}</span>
        </div>
        <p class="listing-loc">${l.location}</p>
        <p class="listing-guests">Up to ${l.guests} guest${l.guests > 1 ? "s" : ""} &middot; ${l.reviews} reviews</p>
        <div class="listing-amenities">
          ${l.amenities.slice(0, 3).map((a) => `<span class="amenity-pill">${a}</span>`).join("")}
        </div>
        <p class="listing-price"><b>${peso(l.price)}</b> <span>/ night</span></p>
        <a class="listing-book" href="booking.html">Book now</a>
      </article>`;
    }

    /* ---------------------------------------------------------
       Filtering + sorting
    --------------------------------------------------------- */
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
        resultsCount.textContent = `${results.length} stay${results.length === 1 ? "" : "s"}`;
        grid.innerHTML = results.map(cardHTML).join("");
        emptyState.hidden = results.length !== 0;
        grid.style.display = results.length === 0 ? "none" : "grid";
        renderChips();
    }

    /* ---------------------------------------------------------
       Active filter chips
    --------------------------------------------------------- */
    function renderChips() {
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

    activeChips.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const key = chip.dataset.key;
        const value = chip.dataset.value;
        if (key === "search") { state.search = ""; searchInput.value = ""; }
        if (key === "type") { state.types.delete(value); syncCheckboxes("#typeList", state.types); }
        if (key === "amenity") { state.amenities.delete(value); syncCheckboxes("#amenityList", state.amenities); }
        if (key === "rating") { state.minRating = 0; document.querySelector('input[name="rating"][value="0"]').checked = true; }
        if (key === "guests") { state.guests = 1; filterGuestCount.textContent = "1"; }
        if (key === "price") { resetPriceRange(); }
        render();
    });

    function syncCheckboxes(selector, set) {
        document.querySelectorAll(`${selector} input`).forEach((cb) => {
            cb.checked = set.has(cb.value);
        });
    }

    /* ---------------------------------------------------------
       Search
    --------------------------------------------------------- */
    searchInput.addEventListener("input", () => {
        state.search = searchInput.value.trim();
        render();
    });
    document.getElementById("heroSearchBtn").addEventListener("click", () => {
        document.querySelector(".stays-main").scrollIntoView({ behavior: "smooth" });
    });

    /* ---------------------------------------------------------
       Sort
    --------------------------------------------------------- */
    sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value;
        render();
    });

    /* ---------------------------------------------------------
       Property type + amenities checkboxes
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Rating radios
    --------------------------------------------------------- */
    document.querySelectorAll('input[name="rating"]').forEach((r) => {
        r.addEventListener("change", () => {
            state.minRating = Number(r.value);
            render();
        });
    });

    /* ---------------------------------------------------------
       Guest stepper
    --------------------------------------------------------- */
    document.getElementById("filterGuestMinus").addEventListener("click", () => {
        if (state.guests > 1) {
            state.guests -= 1;
            filterGuestCount.textContent = state.guests;
            render();
        }
    });
    document.getElementById("filterGuestPlus").addEventListener("click", () => {
        if (state.guests < 10) {
            state.guests += 1;
            filterGuestCount.textContent = state.guests;
            render();
        }
    });

    /* ---------------------------------------------------------
       Dual price range slider
    --------------------------------------------------------- */
    function updatePriceUI() {
        let lo = Number(priceMin.value);
        let hi = Number(priceMax.value);
        if (lo > hi - 200) {
            if (this === priceMin) { lo = hi - 200; priceMin.value = lo; }
            else { hi = lo + 200; priceMax.value = hi; }
        }
        state.minPrice = lo;
        state.maxPrice = hi;
        priceMinLabel.textContent = lo.toLocaleString("en-PH");
        priceMaxLabel.textContent = hi.toLocaleString("en-PH");

        const range = priceBounds.max - priceBounds.min;
        const leftPct = ((lo - priceBounds.min) / range) * 100;
        const rightPct = ((hi - priceBounds.min) / range) * 100;
        priceFill.style.left = leftPct + "%";
        priceFill.style.width = (rightPct - leftPct) + "%";
    }

    function resetPriceRange() {
        priceMin.value = priceBounds.min;
        priceMax.value = priceBounds.max;
        updatePriceUI.call(priceMin);
    }

    priceMin.addEventListener("input", function () { updatePriceUI.call(this); render(); });
    priceMax.addEventListener("input", function () { updatePriceUI.call(this); render(); });

    /* ---------------------------------------------------------
       Favorites (heart toggle, in-memory)
    --------------------------------------------------------- */
    grid.addEventListener("click", (e) => {
        const favBtn = e.target.closest('[data-action="fav"]');
        if (!favBtn) return;
        e.preventDefault();
        const card = favBtn.closest(".listing-card");
        const id = card.dataset.id;
        if (state.favorites.has(id)) {
            state.favorites.delete(id);
            favBtn.classList.remove("is-active");
        } else {
            state.favorites.add(id);
            favBtn.classList.add("is-active");
        }
    });

    /* ---------------------------------------------------------
       Clear all filters
    --------------------------------------------------------- */
    function clearAll() {
        state.search = "";
        state.types.clear();
        state.amenities.clear();
        state.minRating = 0;
        state.guests = 1;
        state.sort = "recommended";

        searchInput.value = "";
        sortSelect.value = "recommended";
        document.querySelectorAll("#typeList input, #amenityList input").forEach((cb) => (cb.checked = false));
        document.querySelector('input[name="rating"][value="0"]').checked = true;
        filterGuestCount.textContent = "1";
        resetPriceRange();
        render();
    }
    document.getElementById("clearFilters").addEventListener("click", clearAll);
    document.getElementById("emptyClearBtn").addEventListener("click", clearAll);

    /* ---------------------------------------------------------
       Mobile filter drawer
    --------------------------------------------------------- */
    const filtersPanel = document.getElementById("filtersPanel");
    document.getElementById("filtersToggle").addEventListener("click", () => filtersPanel.classList.add("is-open"));
    document.getElementById("filtersClose").addEventListener("click", () => filtersPanel.classList.remove("is-open"));

    /* ---------------------------------------------------------
       Mobile nav (same behaviour as homepage.js)
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Pick up destination passed from the homepage search box
    --------------------------------------------------------- */
    const urlParams = new URLSearchParams(window.location.search);
    const incomingSearch = urlParams.get('search');
    if (incomingSearch) {
        state.search = incomingSearch;
        searchInput.value = incomingSearch;
    }

    /* ---------------------------------------------------------
       Init
    --------------------------------------------------------- */
    updatePriceUI.call(priceMin);
    render();
})();