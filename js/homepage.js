(function () {
    "use strict";


    const ApiService = {
        async getFeaturedStays() {
            try {
              
                return [
                    {
                        id: "stay-1",
                        label: "01",
                        title: "Tropical Beachfront Villas",
                        subtitle: "Discover paradise with ocean views in Siargao & Palawan.",
                        img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/630810990.jpg?k=f0a258fd952f19c7285f4e99e64664bc423cd779166b639a29d87037cb90b2ac&o=",
                        link: "stays.html?search=Beachfront"
                    },
                    {
                        id: "stay-2",
                        label: "02",
                        title: "Cozy Mountain Cabins",
                        subtitle: "Escape to the cool pine breezes and scenic views of Baguio.",
                        img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/184656762.jpg?k=03df05cdd232e5aec61fb79b29314d5d84e8eb5904f33efa84a05dd9b1800e80&o=",
                        link: "stays.html?search=Cabin"
                    },
                    {
                        id: "stay-3",
                        label: "03",
                        title: "Luxury Island Resorts",
                        subtitle: "Unwind with world-class amenities and pristine beaches.",
                        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7DjJY2wWxNmj-AVl2FuBM8tT99YqVb3U2AO-5srMWWAkFKwRowBoNAb9I&s=10",
                        link: "stays.html?search=Resort"
                    }
                ];
            } catch (error) {
                console.error("Failed to fetch stays data:", error);
                return [];
            }
        }
    };

    // ==========================================
    // 2. HERO STAY CARD CAROUSEL CONTROLLER
    // ==========================================
    class StayCardCarousel {
        constructor() {
            this.card = document.querySelector(".stay-card");
            this.img = this.card?.querySelector(".stay-media img");
            this.count = this.card?.querySelector(".stay-count");
            this.dotsContainer = this.card?.querySelector(".stay-dots");
            this.label = this.card?.querySelector(".stay-info .label");
            this.description = this.card?.querySelector(".stay-info p");

            this.slides = [];
            this.currentIndex = 0;
            this.autoplayTimer = null;
            this.touchStartX = 0;
            this.touchEndX = 0;
        }

        async init() {
            if (!this.card) return;

            this.slides = await ApiService.getFeaturedStays();
            if (!this.slides || this.slides.length === 0) return;

            this.renderDots();
            this.bindEvents();
            this.update(0);
            this.startAutoplay();
        }

        renderDots() {
            if (!this.dotsContainer) return;
            this.dotsContainer.innerHTML = this.slides.map((_, i) => `
                <span data-index="${i}" class="${i === 0 ? 'active' : ''}"></span>
            `).join('');
        }

        bindEvents() {
            // Click on dots to change slides
            this.dotsContainer?.addEventListener("click", (e) => {
                const dot = e.target.closest("span");
                if (!dot) return;
                const index = Number(dot.dataset.index);
                this.goTo(index);
            });

            // Pause autoplay on mouse hover
            this.card.addEventListener("mouseenter", () => this.stopAutoplay());
            this.card.addEventListener("mouseleave", () => this.startAutoplay());

            // Touch swipe support for mobile
            this.card.addEventListener("touchstart", (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.card.addEventListener("touchend", (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
        }

        handleSwipe() {
            const threshold = 30;
            if (this.touchEndX < this.touchStartX - threshold) {
                this.next();
            } else if (this.touchEndX > this.touchStartX + threshold) {
                this.prev();
            }
        }

        next() {
            const nextIndex = (this.currentIndex + 1) % this.slides.length;
            this.goTo(nextIndex);
        }

        prev() {
            const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
            this.goTo(prevIndex);
        }

        goTo(index) {
            this.currentIndex = index;
            this.update(index);
            this.resetAutoplay();
        }

        update(index) {
            const current = this.slides[index];
            if (!current) return;

            // Fade transition using CSS opacity
            if (this.img) {
                this.img.style.opacity = "0.3";
                setTimeout(() => {
                    // Guard against a slower, earlier timeout (e.g. from a
                    // rapid double-click) overwriting a newer slide change.
                    if (this.currentIndex !== index) return;
                    this.img.src = current.img;
                    this.img.alt = current.title;
                    this.img.style.opacity = "1";
                }, 150);
            }

            // Update overlay count
            if (this.count) {
                this.count.textContent = `${index + 1}/${this.slides.length}`;
            }

            // Update card text
            if (this.label) {
                this.label.textContent = current.label || `0${index + 1}`;
            }

            if (this.description) {
                this.description.textContent = current.subtitle || current.title;
            }

            // Update active dot class
            if (this.dotsContainer) {
                const dots = Array.from(this.dotsContainer.children);
                dots.forEach((dot, i) => {
                    dot.classList.toggle("active", i === index);
                });
            }
        }

        startAutoplay() {
            this.stopAutoplay();
            this.autoplayTimer = setInterval(() => this.next(), 4500);
        }

        stopAutoplay() {
            if (this.autoplayTimer) clearInterval(this.autoplayTimer);
        }

        resetAutoplay() {
            this.stopAutoplay();
            this.startAutoplay();
        }
    }

    // ==========================================
    // 3. HOMEPAGE SEARCH & DATA FLOW
    // ==========================================
    function initSearch() {
        const homeSearchBtn = document.getElementById('homeSearchBtn') || document.querySelector('.search-btn');
        if (homeSearchBtn) {
            homeSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dest = document.getElementById('destinationSelect')?.value || document.querySelector('.search-field input[type="text"]')?.value || '';
                const checkin = document.getElementById('checkinInput')?.value || '';
                const checkout = document.getElementById('checkoutInput')?.value || '';

                if (checkin) localStorage.setItem('trip_checkin', checkin);
                if (checkout) localStorage.setItem('trip_checkout', checkout);

                const params = new URLSearchParams();
                if (dest) params.set('search', dest);
                if (checkin) params.set('checkin', checkin);
                if (checkout) params.set('checkout', checkout);

                window.location.href = `stays.html?${params.toString()}`;
            });
        }
    }

    // ==========================================
    // 4. MOBILE NAVIGATION
    // ==========================================
    function initMobileNav() {
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
    }

    // Safe Initialization
    function initAll() {
        const carousel = new StayCardCarousel();
        carousel.init();
        initSearch();
        initMobileNav();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();