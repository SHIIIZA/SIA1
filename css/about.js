/*
 * TripMate — About us
 * Header behaviour (user menu, mobile nav) lives in js/header.js.
 */
(function () {
    "use strict";

    // ==========================================
    // FACTS COUNT-UP
    // The HTML already contains the final numbers, so the page reads
    // correctly without JavaScript. When the facts scroll into view we
    // count up to them once.
    // ==========================================
    class FactsCounter {
        constructor(container) {
            this.container = container;
            this.figures = container ? Array.from(container.querySelectorAll("[data-count]")) : [];
            this.formatter = new Intl.NumberFormat("en-PH");
            this.duration = 1400;
        }

        init() {
            if (!this.figures.length) return;

            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

            // Start from zero only when we can reliably animate back up
            this.figures.forEach((el) => this.render(el, 0));

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    this.figures.forEach((el) => this.animate(el));
                    obs.disconnect();
                });
            }, { threshold: 0.4 });

            observer.observe(this.container);
        }

        render(el, value) {
            const suffix = el.dataset.suffix || "";
            el.textContent = this.formatter.format(Math.round(value)) + suffix;
        }

        animate(el) {
            const target = Number(el.dataset.count);
            const start = performance.now();

            const tick = (now) => {
                const progress = Math.min((now - start) / this.duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                this.render(el, target * eased);
                if (progress < 1) requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        }
    }

    function initAll() {
        new FactsCounter(document.getElementById("facts")).init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();