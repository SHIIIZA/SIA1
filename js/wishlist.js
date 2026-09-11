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
    const wishlistSort = document.getElementById("wishlistSort");
    const viewBtns = document.querySelectorAll(".view-btn");
    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");

    let currentView = "grid";
    let currentSort = "recent";

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

    // Load wishlist from localStorage
    function loadWishlist() {
        const wishlist = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        const userWishlist = wishlist.filter((item) => item.userId === user.id);
        renderWishlist(userWishlist);
    }

    function renderWishlist(wishlist) {
        if (!wishlistGrid || !wishlistEmpty) return;

        if (wishlist.length === 0) {
            wishlistGrid.hidden = true;
            wishlistEmpty.hidden = false;
            return;
        }

        wishlistGrid.hidden = false;
        wishlistEmpty.hidden = true;

        const sorted = sortWishlist([...wishlist], currentSort);
        wishlistGrid.innerHTML = sorted
            .map((item) => createWishlistCard(item, propertyData[item.propertyId]))
            .join("");
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

        const savedDate = new Date(item.savedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        return `
            <article class="wishlist-card" data-property-id="${property.id}">
                <a href="property.html?id=${property.id}" class="wishlist-image-link">
                    <div class="wishlist-image">
                        <img src="${property.img}" alt="${property.name}" loading="lazy">
                        <span class="wishlist-badge">${property.type}</span>
                    </div>
                </a>
                <div class="wishlist-content">
                    <div class="wishlist-header">
                        <h3 class="wishlist-title">
                            <a href="property.html?id=${property.id}">${property.name}</a>
                        </h3>
                        <button class="wishlist-remove" data-property-id="${property.id}" aria-label="Remove from wishlist">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <p class="wishlist-location">${property.location}</p>
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
                        <a href="property.html?id=${property.id}" class="btn-primary btn-sm">View Details</a>
                    </div>
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

    // Remove from wishlist (event delegation)
    wishlistGrid?.addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".wishlist-remove");
        if (!removeBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const propertyId = removeBtn.dataset.propertyId;
        removeFromWishlist(propertyId);
    });

    function removeFromWishlist(propertyId) {
        const wishlist = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        const filtered = wishlist.filter(
            (item) => !(item.userId === user.id && item.propertyId === propertyId)
        );
        localStorage.setItem("tripmate_wishlist", JSON.stringify(filtered));
        loadWishlist();
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