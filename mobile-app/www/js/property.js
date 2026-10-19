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

    const fallbackStayData = {
        "baguio-holiday-villas": {
            name: "Baguio Holiday Villas", type: "Villa", location: "Baguio City, Benguet",
            price: 4300, rating: 4.92, reviews: 128, guests: 6,
            amenities: ["Wifi", "Kitchen", "Air conditioning", "Pet friendly"],
            image: "https://pix8.agoda.net/hotelImages/275905/0/2bfa720cb4d3471781e35efcbe6c3dfe.jpg?ce=2&s=375x"
        },
        "alon-resort": {
            name: "Alon Resort", type: "Resort", location: "General Luna, Siargao",
            price: 2900, rating: 4.88, reviews: 171, guests: 4,
            amenities: ["Wifi", "Beachfront", "Kitchen"],
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVJ03F6aGc6mGqRA_pNPSmADp1ioMW0JHRVKb4OFcFnztKn03YanWUbPk&s=10"
        },
        "kubo-homestay": {
            name: "Kubo Homestay", type: "Cabin", location: "El Nido, Palawan",
            price: 3600, rating: 4.95, reviews: 97, guests: 4,
            amenities: ["Wifi", "Beachfront"],
            image: "https://a0.muscache.com/im/pictures/d64b6a63-3599-4fa3-a6dc-3062a952202b.jpg?im_w=720"
        },
        "ivatan-stone-house": {
            name: "Ivatan Stone House", type: "House rental", location: "Basco, Batanes",
            price: 2600, rating: 4.98, reviews: 41, guests: 2,
            amenities: ["Wifi", "Kitchen", "Pet friendly"],
            image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/25/1d/9d/8d/house-of-dakay-in-ivana.jpg?w=900&h=500&s=1"
        },
        "astoria-current": {
            name: "Astoria Current", type: "Resort", location: "Boracay, Aklan",
            price: 5800, rating: 4.9, reviews: 342, guests: 4,
            amenities: ["Wifi", "Pool", "Beachfront", "Air conditioning"],
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7DjJY2wWxNmj-AVl2FuBM8tT99YqVb3U2AO-5srMWWAkFKwRowBoNAb9I&s=10"
        },
        "sunset-villa": {
            name: "Sunset Villa", type: "Villa", location: "Coron, Palawan",
            price: 5200, rating: 4.94, reviews: 118, guests: 8,
            amenities: ["Wifi", "Pool", "Kitchen", "Beachfront"],
            image: "https://discovery.s14-host.com/qkUByrarp5PILHjccAD3jHDhtozxLY-metaU3Vuc2V0LVZpbGxhLURlbHV4ZS1WZXJhbmRhLmpwZw==-.jpg"
        },
        "summit-ridge-hotel": {
            name: "Summit Ridge Hotel", type: "Hotel", location: "Tagaytay, Cavite",
            price: 3100, rating: 4.7, reviews: 256, guests: 2,
            amenities: ["Wifi", "Air conditioning", "Pool"],
            image: "https://q-xx.bstatic.com/xdata/images/hotel/max500/706396016.jpg?k=3529c641d8fd7b530aad8996d0a01cbf7ae799a6003388650f33a1823a3fd0d3&o="
        },
        "la-casa-ramirez": {
            name: "La Casa Ramirez", type: "Hotel", location: "Vigan, Ilocos Sur",
            price: 2200, rating: 4.8, reviews: 132, guests: 3,
            amenities: ["Wifi", "Air conditioning"],
            image: "https://pix8.agoda.net/property/63493626/0/3391d813834943320c8e241cfe585d82.jpeg?ce=3&s=600x"
        },
        "backpackers-travelers-inn": {
            name: "Backpackers Travelers Inn", type: "Cabin", location: "Valencia, Negros Oriental",
            price: 900, rating: 4.87, reviews: 74, guests: 10,
            amenities: ["Wifi", "Pet friendly"],
            image: "https://pix8.agoda.net/hotelImages/85348252/0/b294dc4f9636bff3a7f896491fd591cc.jpg?ce=3&s=600x"
        }
    };

    Object.entries(fallbackStayData).forEach(([id, stay]) => {
        propertyData[id] = {
            id,
            ...stay,
            images: [stay.image],
            description: `Enjoy a comfortable ${stay.type.toLowerCase()} in ${stay.location}, with thoughtful amenities for a relaxing TripMate stay.`,
            host: {
                name: "TripMate host",
                avatar: "",
                joined: new Date().getFullYear().toString(),
                verified: true,
                responseRate: 100,
                responseTime: "within an hour"
            },
            houseRules: ["Check-in details provided after booking", "No smoking indoors", "Respect quiet hours"],
            reviews: []
        };
    });

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

    function getStoredUsers() {
        try {
            const users = JSON.parse(localStorage.getItem("tripmate_users") || "[]");
            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.warn("Unable to read stored host profiles:", error.message);
            return [];
        }
    }

    function resolveHostIdentity(listing, fallbackHost = {}) {
        const users = getStoredUsers();
        const sessionUser = (() => {
            try { return JSON.parse(localStorage.getItem("tripmate_user") || "null"); }
            catch { return null; }
        })();
        const hostId = listing?.hostId ?? listing?.host_id;
        const storedHost = users.find(user => hostId != null && String(user.id) === String(hostId))
            || (sessionUser && hostId != null && String(sessionUser.id) === String(hostId) ? sessionUser : null);
        const host = storedHost || {};
        const name = String(
            listing?.hostUsername
            || listing?.host_username
            || host.username
            || listing?.hostName
            || listing?.host_name
            || host.name
            || fallbackHost.name
            || "Host"
        ).trim() || "Host";
        const avatar = String(
            listing?.hostAvatar
            || listing?.host_avatar
            || host.avatar
            || host.profilePicture
            || fallbackHost.avatar
            || ""
        ).trim();
        return {
            ...fallbackHost,
            name,
            avatar,
            joined: host.createdAt || fallbackHost.joined || new Date().getFullYear().toString()
        };
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
    try {
        const hostListing = JSON.parse(localStorage.getItem("tripmate_listings") || "[]")
            .find(item => String(item.id) === propertyId);
        if (hostListing) {
            propertyData[propertyId] = {
                id: hostListing.id,
                name: hostListing.title || "TripMate stay",
                type: hostListing.propertyType || "House rental",
                location: hostListing.location || "Philippines",
                price: Number(hostListing.pricePerNight) || 0,
                rating: Number(hostListing.rating) || 5,
                reviews: [],
                guests: Number(hostListing.maxGuests) || 1,
                amenities: hostListing.amenities || [],
                images: hostListing.images?.length ? hostListing.images : [""],
                description: hostListing.description || "A stay listed by a TripMate host.",
                host: resolveHostIdentity(hostListing, { joined: new Date().getFullYear().toString(), verified: true, responseRate: 100, responseTime: "within an hour" }),
                houseRules: [],
                reviews: []
            };
        }
    } catch { /* Keep the built-in property catalogue available. */ }
    let property = propertyData[propertyId];

    // DOM elements
    const mainImage = document.getElementById("mainImage");
    const galleryThumbs = document.getElementById("galleryThumbs");
    const propertyType = document.getElementById("propertyType");
    const propertyName = document.getElementById("propertyName");
    const propertyLocation = document.getElementById("propertyLocation");
    const propertyStars = document.getElementById("propertyStars");
    const propertyRatingValue = document.getElementById("propertyRatingValue");
    const propertyHost = document.getElementById("propertyHost");
    const propertyDescription = document.getElementById("propertyDescription");
    const amenitiesGrid = document.getElementById("amenitiesGrid");
    const houseRules = document.getElementById("houseRules");
    const nightlyPrice = document.getElementById("nightlyPrice");
    const bookingBreakdown = document.getElementById("bookingBreakdown");
    const bookingForm = document.getElementById("bookingForm");
    const checkinDate = document.getElementById("checkinDate");
    const checkoutDate = document.getElementById("checkoutDate");
    const guestCount = document.getElementById("guestCount");
    const guestMinus = document.getElementById("guestMinus");
    const guestPlus = document.getElementById("guestPlus");
    const bookNowBtn = document.getElementById("bookNowBtn");
    const imageLightbox = document.getElementById("imageLightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const closeLightbox = document.getElementById("closeLightbox");

    // Initialize page
    async function init() {
        if (!property && typeof apiRequest === "function" && /^\d+$/.test(propertyId)) {
            try {
                const remote = await apiRequest(`/listings/${propertyId}`);
                property = {
                    id: remote.id,
                    name: remote.title,
                    type: remote.property_type,
                    location: remote.location,
                    price: Number(remote.price_per_night),
                    cleaningFee: Number(remote.cleaning_fee) || 0,
                    rating: Number(remote.rating) || 5,
                    reviews: [],
                    guests: Number(remote.max_guests),
                    amenities: remote.amenities || [],
                    images: remote.images?.length ? remote.images : [""],
                    description: remote.description || "A stay listed by a TripMate host.",
                    host: resolveHostIdentity({
                        hostId: remote.host_id,
                        hostUsername: remote.host_username,
                        hostName: remote.host_name,
                        hostAvatar: remote.host_avatar,
                        hostCreatedAt: remote.host_created_at
                    }, { joined: remote.host_created_at || new Date().getFullYear().toString(), verified: true, responseRate: 100, responseTime: "within an hour" }),
                    houseRules: [],
                    reviews: []
                };
            } catch (error) {
                console.warn("Unable to load listing:", error.message);
            }
        }
        if (!property) {
            window.location.href = "stays.html";
            return;
        }
        const reviewCount = Array.isArray(property.reviews)
            ? property.reviews.length
            : Number(property.reviews) || 0;
        property.reviews = Array.isArray(property.reviews) ? property.reviews : [];
        property.cleaningFee = Number(property.cleaningFee ?? 500);
        property.reviewCount = reviewCount;
        document.title = `${property.name} — TripMate`;

        // Gallery
        mainImage.src = property.images[0];
        mainImage.alt = property.name;

        galleryThumbs.addEventListener("click", (event) => {
            const thumb = event.target.closest("button.thumb");
            if (!thumb || !galleryThumbs.contains(thumb)) return;

            const imageIndex = Number(thumb.dataset.imageIndex);
            const image = property.images[imageIndex];
            if (!Number.isInteger(imageIndex) || typeof image !== "string" || !image) return;

            mainImage.src = image;
            galleryThumbs.querySelectorAll(".thumb").forEach((item, index) => {
                const isActive = index === imageIndex;
                item.classList.toggle("active", isActive);
                item.setAttribute("aria-pressed", String(isActive));
            });
        });

        property.images.forEach((img, i) => {
            const thumb = document.createElement("button");
            thumb.className = "thumb" + (i === 0 ? " active" : "");
            thumb.type = "button";
            thumb.dataset.imageIndex = String(i);
            thumb.setAttribute("aria-pressed", String(i === 0));
            thumb.innerHTML = `<img src="${img}" alt="${property.name} - Photo ${i + 1}">`;
            thumb.addEventListener("dblclick", () => {
                if (imageLightbox && lightboxImage) {
                    lightboxImage.src = img;
                    imageLightbox.showModal();
                }
            });
            galleryThumbs.appendChild(thumb);
        });

        mainImage.addEventListener("click", () => {
            if (imageLightbox && lightboxImage) {
                lightboxImage.src = mainImage.src;
                imageLightbox.showModal();
            }
        });

        // Property header
        propertyType.textContent = property.type;
        propertyName.textContent = property.name;
        propertyLocation.textContent = property.location;
        propertyStars.innerHTML = renderStars(property.rating);
        propertyRatingValue.textContent = property.rating.toFixed(2);

        // Host
        const hostName = property.host.name || "Host";
        const hostAvatar = property.host.avatar;
        const hostAvatarElement = hostAvatar ? document.createElement("img") : document.createElement("div");
        hostAvatarElement.className = "host-avatar";
        if (hostAvatar) {
            hostAvatarElement.src = hostAvatar;
            hostAvatarElement.alt = hostName;
            hostAvatarElement.addEventListener("error", () => {
                const fallback = document.createElement("div");
                fallback.className = "host-avatar host-avatar-fallback";
                fallback.textContent = hostName.slice(0, 1).toUpperCase();
                hostAvatarElement.replaceWith(fallback);
            }, { once: true });
        } else {
            hostAvatarElement.classList.add("host-avatar-fallback");
            hostAvatarElement.textContent = hostName.slice(0, 1).toUpperCase();
            hostAvatarElement.setAttribute("aria-label", `${hostName} profile picture`);
        }
        const hostInfo = document.createElement("div");
        hostInfo.className = "host-info";
        const hostHeading = document.createElement("h3");
        hostHeading.textContent = `Hosted by ${hostName}`;
        const hostMeta = document.createElement("p");
        hostMeta.textContent = `Joined ${property.host.joined} · ${property.host.responseRate}% response rate · ${property.host.responseTime}`;
        hostInfo.append(hostHeading, hostMeta);
        if (property.host.verified) {
            const verified = document.createElement("span");
            verified.className = "host-verified";
            verified.textContent = "✓ Verified host";
            hostInfo.append(verified);
        }
        propertyHost.replaceChildren(hostAvatarElement, hostInfo);

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

    closeLightbox?.addEventListener("click", () => imageLightbox?.close());
    imageLightbox?.addEventListener("click", event => {
        if (event.target === imageLightbox) imageLightbox.close();
    });

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
        const cleaningFee = property.cleaningFee;
        const serviceFee = Math.round((subtotal + cleaningFee) * 0.10);
        const taxes = Math.round(subtotal * 0.1125);
        const total = subtotal + cleaningFee + serviceFee + taxes;

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
                <span>TripMate service fee</span>
                <span class="amount">${peso(serviceFee)}</span>
            </div>
            <div class="breakdown-row">
                <span>Taxes</span>
                <span class="amount">${peso(taxes)}</span>
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
        bookingForm.dataset.taxes = taxes;
    }

    async function handleBooking(e) {
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

        if (!/^\d+$/.test(String(property.id))) {
            try {
                const normalize = (value) => String(value || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, " ")
                    .trim();
                const remoteListings = await apiRequest("/listings");
                const match = remoteListings.find((item) =>
                    normalize(item.title) === normalize(property.name) &&
                    normalize(item.location) === normalize(property.location)
                );
                if (!match) {
                    showToast("This stay is not published for online booking yet.", true);
                    return;
                }
                property = {
                    ...property,
                    id: match.id,
                    name: match.title,
                    type: match.property_type || property.type,
                    location: match.location,
                    price: Number(match.price_per_night),
                    cleaningFee: Number(match.cleaning_fee) || 0,
                    guests: Number(match.max_guests) || property.guests,
                    amenities: match.amenities || property.amenities,
                    images: match.images?.length ? match.images : property.images
                };
                propertyName.textContent = property.name;
                propertyLocation.textContent = property.location;
                propertyType.textContent = property.type;
                nightlyPrice.textContent = peso(property.price);
                updateBreakdown();
            } catch (error) {
                showToast(error.message || "Unable to verify that this stay is available.", true);
                return;
            }
        }

        localStorage.setItem("selectedStay", JSON.stringify({
            id: property.id,
            name: property.name,
            location: property.location,
            price: property.price,
            rating: property.rating,
            reviews: property.reviewCount,
            guests: property.guests,
            cleaningFee: property.cleaningFee,
            img: property.images[0]
        }));
        localStorage.setItem("trip_checkin", checkin);
        localStorage.setItem("trip_checkout", checkout);

        const bookingUrl = new URL("booking.html", window.location.href);
        bookingUrl.searchParams.set("guests", String(guests));
        window.location.href = bookingUrl.href;
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