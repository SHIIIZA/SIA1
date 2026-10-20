/* TripMate — Wishlist Page Logic */

(function () {
    "use strict";

    const peso = (n) => "\u20B1" + Math.round(n).toLocaleString("en-PH");

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
            img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/630810990.jpg?k=f0a258fd952f19c7285f4e99e64664bc423cd779166b639a29d87037cb90b2ac&o="
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
            img: "https://cfstatic.staah.net/w*2000/big_14581_1781579948247.jpeg?k=902NTY78jA7cf8c8n6pumZFmK2Mco8np8opi9tGUj4XocTHBQ7c5MTM="
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
            img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/184656762.jpg?k=03df05cdd232e5aec61fb79b29314d5d84e8eb5904f33efa84a05dd9b1800e80&o="
        },
        "baguio-holiday-villas": {
            id: "baguio-holiday-villas",
            name: "Baguio Holiday Villas",
            type: "Villa",
            location: "Baguio City, Benguet",
            price: 4300,
            rating: 4.92,
            reviews: 128,
            guests: 6,
            amenities: ["Wifi", "Kitchen", "Air conditioning", "Pet friendly"],
            img: "https://pix8.agoda.net/hotelImages/275905/0/2bfa720cb4d3471781e35efcbe6c3dfe.jpg?ce=2&s=375x"
        },
        "alon-resort": {
            id: "alon-resort",
            name: "Alon Resort",
            type: "Resort",
            location: "General Luna, Siargao",
            price: 2900,
            rating: 4.88,
            reviews: 171,
            guests: 4,
            amenities: ["Wifi", "Beachfront", "Kitchen"],
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVJ03F6aGc6mGqRA_pNPSmADp1ioMW0JHRVKb4OFcFnztKn03YanWUbPk&s=10"
        },
        "kubo-homestay": {
            id: "kubo-homestay",
            name: "Kubo Homestay",
            type: "Cabin",
            location: "El Nido, Palawan",
            price: 3600,
            rating: 4.95,
            reviews: 97,
            guests: 4,
            amenities: ["Wifi", "Beachfront"],
            img: "https://a0.muscache.com/im/pictures/d64b6a63-3599-4fa3-a6dc-3062a952202b.jpg?im_w=720"
        },
        "ivatan-stone-house": {
            id: "ivatan-stone-house",
            name: "Ivatan Stone House",
            type: "House rental",
            location: "Basco, Batanes",
            price: 2600,
            rating: 4.98,
            reviews: 41,
            guests: 2,
            amenities: ["Wifi", "Kitchen", "Pet friendly"],
            img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/25/1d/9d/8d/house-of-dakay-in-ivana.jpg?w=900&h=500&s=1"
        },
        "astoria-current": {
            id: "astoria-current",
            name: "Astoria Current",
            type: "Resort",
            location: "Boracay, Aklan",
            price: 5800,
            rating: 4.9,
            reviews: 342,
            guests: 4,
            amenities: ["Wifi", "Pool", "Beachfront", "Air conditioning"],
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7DjJY2wWxNmj-AVl2FuBM8tT99YqVb3U2AO-5srMWWAkFKwRowBoNAb9I&s=10"
        },
        "sunset-villa": {
            id: "sunset-villa",
            name: "Sunset Villa",
            type: "Villa",
            location: "Coron, Palawan",
            price: 5200,
            rating: 4.94,
            reviews: 118,
            guests: 8,
            amenities: ["Wifi", "Pool", "Kitchen", "Beachfront"],
            img: "https://discovery.s14-host.com/qkUByrarp5PILHjccAD3jHDhtozxLY-metaU3Vuc2V0LVZpbGxhLURlbHV4ZS1WZXJhbmRhLmpwZw==-.jpg"
        },
        "summit-ridge-hotel": {
            id: "summit-ridge-hotel",
            name: "Summit Ridge Hotel",
            type: "Hotel",
            location: "Tagaytay, Cavite",
            price: 3100,
            rating: 4.7,
            reviews: 256,
            guests: 2,
            amenities: ["Wifi", "Air conditioning", "Pool"],
            img: "https://q-xx.bstatic.com/xdata/images/hotel/max500/706396016.jpg?k=3529c641d8fd7b530aad8996d0a01cbf7ae799a6003388650f33a1823a3fd0d3&o="
        },
        "la-casa-ramirez": {
            id: "la-casa-ramirez",
            name: "La Casa Ramirez",
            type: "Hotel",
            location: "Vigan, Ilocos Sur",
            price: 2200,
            rating: 4.8,
            reviews: 132,
            guests: 3,
            amenities: ["Wifi", "Air conditioning"],
            img: "https://pix8.agoda.net/property/63493626/0/3391d813834943320c8e241cfe585d82.jpeg?ce=3&s=600x"
        },
        "backpackers-travelers-inn": {
            id: "backpackers-travelers-inn",
            name: "Backpackers Travelers Inn",
            type: "Cabin",
            location: "Valencia, Negros Oriental",
            price: 900,
            rating: 4.87,
            reviews: 74,
            guests: 10,
            amenities: ["Wifi", "Pet friendly"],
            img: "https://pix8.agoda.net/hotelImages/85348252/0/b294dc4f9636bff3a7f896491fd591cc.jpg?ce=3&s=600x"
        }
    };

    // DOM elements
    const wishlistGrid = document.getElementById("wishlistGrid");
    const wishlistEmpty = document.getElementById("wishlistEmpty");
    const wishlistStatus = document.getElementById("wishlistStatus");
    const wishlistSort = document.getElementById("wishlistSort");
    const selectAllWishlist = document.getElementById("selectAllWishlist");
    const moveSelectedToTrip = document.getElementById("moveSelectedToTrip");
    const removeSelectedWishlist = document.getElementById("removeSelectedWishlist");
    const viewBtns = document.querySelectorAll(".view-btn");
    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");

    let currentView = "grid";
    let currentSort = "recent";
    const selectedPropertyIds = new Set();
    let visibleWishlist = [];

    // Auth check
    const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");

    if (!user || !session) {
        window.location.href = "login.html?redirect=wishlist.html";
        return;
    }

    // Populate user info safely
    if (dropdownName) dropdownName.textContent = user.name || "Guest";
    if (dropdownEmail) dropdownEmail.textContent = user.email || "";
    if (user.name && avatarPlaceholder) {
        const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        avatarPlaceholder.textContent = initials;
    }

    function readLocalWishlist() {
        try {
            const saved = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
            return saved.filter(item => String(item.userId) === String(user.id));
        } catch (error) {
            console.error("Unable to read the saved wishlist:", error);
            return [];
        }
    }

    function saveLocalWishlist(items) {
        const allItems = (() => {
            try {
                return JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
            } catch (error) {
                console.error("Unable to read the saved wishlist before updating it:", error);
                return [];
            }
        })();
        const otherUsers = allItems.filter(item => String(item.userId) !== String(user.id));
        localStorage.setItem("tripmate_wishlist", JSON.stringify([...otherUsers, ...items]));
    }

    try {
        const hostListings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        hostListings.forEach(listing => {
            propertyData[listing.id] = {
                id: listing.id,
                name: listing.title || "TripMate stay",
                type: listing.propertyType || "House rental",
                location: listing.location || "Philippines",
                price: Number(listing.pricePerNight) || 0,
                rating: Number(listing.rating) || 5,
                reviews: Number(listing.reviews) || 0,
                guests: Number(listing.maxGuests) || 1,
                amenities: listing.amenities || [],
                img: listing.images?.[0] || ""
            };
        });
    } catch (error) {
        console.error("Unable to load locally saved host listings:", error);
    }

    // Load remote and browser-saved entries together so local/demo saves survive an empty API response.
    async function loadWishlist() {
        try {
            const rows = await apiRequest("/wishlist");
            const localById = new Map(readLocalWishlist().map(item => [String(item.propertyId), item]));
            const remoteWishlist = rows.map(item => {
                const listing = item.listings;
                if (listing) {
                    propertyData[listing.id] = {
                        id: listing.id,
                        name: listing.title,
                        type: listing.property_type,
                        location: listing.location,
                        price: Number(listing.price_per_night),
                        rating: Number(listing.rating) || 5,
                        reviews: Number(listing.review_count) || 0,
                        guests: listing.max_guests,
                        amenities: listing.amenities || [],
                        img: listing.images?.[0] || ""
                    };
                }
                const propertyId = String(listing?.id ?? item.listing_id);
                if (!propertyData[propertyId]) {
                    propertyData[propertyId] = {
                        id: propertyId,
                        name: "Saved stay",
                        type: "Stay",
                        location: "Location unavailable",
                        price: 0,
                        rating: 0,
                        reviews: 0,
                        guests: 1,
                        amenities: [],
                        img: ""
                    };
                }
                const localItem = localById.get(propertyId);
                return {
                    propertyId,
                    savedAt: item.created_at || localItem?.savedAt || new Date().toISOString(),
                    savedPrice: Number(localItem?.savedPrice) || null
                };
            });
            const merged = new Map(remoteWishlist.map(item => [String(item.propertyId), item]));
            readLocalWishlist().forEach(item => {
                const propertyId = String(item.propertyId);
                if (!merged.has(propertyId)) merged.set(propertyId, { ...item, propertyId });
            });
            if (wishlistStatus) wishlistStatus.textContent = "";
            renderWishlist([...merged.values()]);
        } catch (error) {
            console.error("Unable to load the remote wishlist:", error);
            if (wishlistStatus) wishlistStatus.textContent = "Your saved stays could not be synced. Showing stays saved in this browser.";
            renderWishlist(readLocalWishlist());
        }
    }

    function renderWishlist(wishlist) {
        if (!wishlistGrid || !wishlistEmpty) return;

        if (wishlist.length === 0) {
            visibleWishlist = [];
            selectedPropertyIds.clear();
            wishlistGrid.hidden = true;
            wishlistEmpty.hidden = false;
            wishlistGrid.innerHTML = "";
            renderBatchControls();
            return;
        }

        wishlistGrid.hidden = false;
        wishlistEmpty.hidden = true;

        const sorted = sortWishlist([...wishlist], currentSort);
        visibleWishlist = sorted;
        const visibleIds = new Set(sorted.map(item => String(item.propertyId)));
        selectedPropertyIds.forEach(id => {
            if (!visibleIds.has(id)) selectedPropertyIds.delete(id);
        });
        wishlistGrid.innerHTML = sorted
            .map((item) => createWishlistCard(item, propertyData[String(item.propertyId)] || {
                id: item.propertyId,
                name: "Saved stay",
                type: "Stay",
                location: "Listing details unavailable",
                price: 0,
                rating: 0,
                reviews: 0,
                img: ""
            }))
            .join("");
        renderBatchControls();
    }

    function renderBatchControls() {
        const selectedCount = selectedPropertyIds.size;
        if (moveSelectedToTrip) moveSelectedToTrip.disabled = selectedCount === 0;
        if (removeSelectedWishlist) removeSelectedWishlist.disabled = selectedCount === 0;
        if (selectAllWishlist) {
            selectAllWishlist.checked = visibleWishlist.length > 0 && selectedCount === visibleWishlist.length;
            selectAllWishlist.indeterminate = selectedCount > 0 && selectedCount < visibleWishlist.length;
        }
    }

    function sortWishlist(wishlist, sortBy) {
        return wishlist.sort((a, b) => {
            const propA = propertyData[a.propertyId] || { price: 0, rating: 0 };
            const propB = propertyData[b.propertyId] || { price: 0, rating: 0 };

            switch (sortBy) {
                case "price-asc":
                    return propA.price - propB.price;
                case "price-desc":
                    return propB.price - propA.price;
                case "rating":
                    return propB.rating - propA.rating;
                case "recent":
                default:
                    return new Date(b.savedAt) - new Date(a.savedAt);
            }
        });
    }

    function createWishlistCard(item, property) {
        if (!property) return "";

        const propertyId = String(property.id);
        const escapedId = propertyId.replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
        const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
        const savedDate = new Date(item.savedAt || Date.now()).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        const savedPrice = Number(item.savedPrice);
        const priceDrop = Number.isFinite(savedPrice) && savedPrice > property.price
            ? `<span class="wishlist-price-drop">${peso(savedPrice - property.price)} off since saved</span>`
            : "";

        return `
            <article class="wishlist-card" data-property-id="${escapedId}">
                <label class="wishlist-card-select" aria-label="Select ${escapeHtml(property.name)}">
                    <input type="checkbox" class="wishlist-select" data-property-id="${escapedId}" ${selectedPropertyIds.has(propertyId) ? "checked" : ""}>
                    <span>Select</span>
                </label>
                <a href="property.html?id=${encodeURIComponent(property.id)}" class="wishlist-image-link">
                    <div class="wishlist-image">
                        <img src="${escapeHtml(property.img)}" alt="${escapeHtml(property.name)}" loading="lazy">
                        <span class="wishlist-badge">${escapeHtml(property.type)}</span>
                    </div>
                </a>
                <div class="wishlist-content">
                    <div class="wishlist-header">
                        <h3 class="wishlist-title">
                            <a href="property.html?id=${encodeURIComponent(property.id)}">${escapeHtml(property.name)}</a>
                        </h3>
                        <button class="wishlist-remove" data-property-id="${escapedId}" aria-label="Remove ${escapeHtml(property.name)} from wishlist">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <p class="wishlist-location">${escapeHtml(property.location)}</p>
                    <div class="wishlist-meta">
                        <span class="wishlist-rating">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            ${property.rating.toFixed(2)}
                        </span>
                        <span class="wishlist-reviews">${property.reviews} reviews</span>
                    </div>
                    <div class="wishlist-footer">
                        <span class="wishlist-price"><b>${peso(property.price)}</b> <span>/ night</span></span>
                        <a href="property.html?id=${encodeURIComponent(property.id)}" class="btn-primary btn-sm">View Details</a>
                    </div>
                    ${priceDrop}
                    <p class="wishlist-saved">Saved on ${savedDate}</p>
                </div>
            </article>
        `;
    }

    // Event listeners
    wishlistSort?.addEventListener("change", () => {
        currentSort = wishlistSort.value;
        loadWishlist();
    });

    viewBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            currentView = btn.dataset.view;
            viewBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            if (wishlistGrid) wishlistGrid.dataset.view = currentView;
        });
    });

    selectAllWishlist?.addEventListener("change", () => {
        if (selectAllWishlist.checked) visibleWishlist.forEach(item => selectedPropertyIds.add(String(item.propertyId)));
        else visibleWishlist.forEach(item => selectedPropertyIds.delete(String(item.propertyId)));
        renderWishlist(visibleWishlist);
    });

    wishlistGrid?.addEventListener("change", event => {
        const checkbox = event.target.closest(".wishlist-select");
        if (!checkbox) return;
        const propertyId = String(checkbox.dataset.propertyId);
        if (checkbox.checked) selectedPropertyIds.add(propertyId);
        else selectedPropertyIds.delete(propertyId);
        renderBatchControls();
    });

    moveSelectedToTrip?.addEventListener("click", () => {
        try {
            const tripKey = `tripmate_saved_trip:${user.id}`;
            const stored = JSON.parse(localStorage.getItem(tripKey) || "[]");
            if (!Array.isArray(stored)) throw new Error("Saved trip data is invalid.");
            const planned = new Map(stored.map(item => [String(item.propertyId), item]));
            visibleWishlist
                .filter(item => selectedPropertyIds.has(String(item.propertyId)))
                .forEach(item => {
                    const property = propertyData[String(item.propertyId)];
                    if (property) planned.set(String(item.propertyId), {
                        propertyId: String(item.propertyId),
                        name: property.name,
                        location: property.location,
                        price: property.price,
                        image: property.img,
                        addedAt: new Date().toISOString()
                    });
                });
            localStorage.setItem(tripKey, JSON.stringify([...planned.values()]));
            const count = selectedPropertyIds.size;
            selectedPropertyIds.clear();
            renderWishlist(visibleWishlist);
            if (wishlistStatus) wishlistStatus.textContent = `${count} stay${count === 1 ? "" : "s"} added to your saved trip on this device.`;
        } catch (error) {
            console.error("Unable to add selected stays to the saved trip:", error);
            if (wishlistStatus) wishlistStatus.textContent = "The selected stays could not be added. Check available browser storage and try again.";
        }
    });

    removeSelectedWishlist?.addEventListener("click", async () => {
        const ids = [...selectedPropertyIds];
        removeSelectedWishlist.disabled = true;
        let removed = 0;
        for (const propertyId of ids) {
            const didRemove = await removeFromWishlist(propertyId, false);
            if (didRemove) {
                removed += 1;
                selectedPropertyIds.delete(String(propertyId));
            }
        }
        await loadWishlist();
        const failed = ids.length - removed;
        if (wishlistStatus) wishlistStatus.textContent = failed
            ? `${removed} stay${removed === 1 ? "" : "s"} removed. ${failed} could not be removed and remain selected.`
            : `${removed} selected stay${removed === 1 ? "" : "s"} removed.`;
    });

    // Remove from wishlist (event delegation)
    wishlistGrid?.addEventListener("click", async (e) => {
        const removeBtn = e.target.closest(".wishlist-remove");
        if (!removeBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const propertyId = removeBtn.dataset.propertyId;
        removeBtn.disabled = true;
        await removeFromWishlist(propertyId);
    });

    async function removeFromWishlist(propertyId, shouldReload = true) {
        const localWishlist = readLocalWishlist();
        const matchingLocal = localWishlist.some(item => String(item.propertyId) === String(propertyId));
        try {
            const rows = await apiRequest("/wishlist");
            const item = rows.find(row => String(row.listing_id ?? row.listings?.id) === String(propertyId));
            if (item) await apiRequest(`/wishlist/${item.id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Unable to remove the stay from the remote wishlist:", error);
            if (!matchingLocal) {
                if (wishlistStatus) wishlistStatus.textContent = "This stay could not be removed from your account. Please try again.";
                const button = wishlistGrid.querySelector(`.wishlist-remove[data-property-id="${CSS.escape(String(propertyId))}"]`);
                if (button) button.disabled = false;
                return false;
            }
            if (wishlistStatus) wishlistStatus.textContent = "Removed from this browser, but the account wishlist could not be synced.";
        }
        saveLocalWishlist(localWishlist.filter(item => String(item.propertyId) !== String(propertyId)));
        if (shouldReload) await loadWishlist();
        return true;
    }

    // User dropdown toggle
    userAvatarBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (userAvatarBtn && userDropdown && !userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove("open");
        }
    });

    // Logout handling
    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("tripmate_session");
        localStorage.removeItem("tripmate_user");
        window.location.href = "homepage.html";
    });

    // Initialize
    loadWishlist();
})();