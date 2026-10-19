(function () {
    "use strict";

    const FREE_CANCEL_DAYS = 7; 
    class DeadlineCalculator {
        constructor() {
            this.input = document.getElementById("checkinDate");
            this.field = this.input ? this.input.closest(".tool-field") : null;
            this.errorEl = document.getElementById("checkinDate-error");
            this.panel = document.getElementById("resultPanel");
        }

        init() {
            if (!this.input || !this.panel) return;
            this.input.addEventListener("change", () => this.handleChange());
        }

        // Parses a yyyy-mm-dd value as a local date at midnight, avoiding
        // the UTC-shift that `new Date("2026-10-01")` would introduce.
        parseLocalDate(value) {
            const [year, month, day] = value.split("-").map(Number);
            if (!year || !month || !day) return null;
            return new Date(year, month - 1, day);
        }

        addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }

        startOfToday() {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        formatDate(date) {
            return date.toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }

        showError(message) {
            if (this.field) this.field.classList.add("invalid");
            if (this.errorEl) this.errorEl.textContent = message;
        }

        clearError() {
            if (this.field) this.field.classList.remove("invalid");
            if (this.errorEl) this.errorEl.textContent = "";
        }

        handleChange() {
            this.clearError();
            const value = this.input.value;

            if (!value) {
                this.renderPlaceholder();
                return;
            }

            const checkin = this.parseLocalDate(value);
            const today = this.startOfToday();

            if (!checkin || isNaN(checkin.getTime())) {
                this.showError("Enter a valid date.");
                this.renderPlaceholder();
                return;
            }

            if (checkin < today) {
                this.showError("Pick a check-in date that hasn't passed yet.");
                this.renderPlaceholder();
                return;
            }

            const deadline = this.addDays(checkin, -FREE_CANCEL_DAYS);
            const isEligible = today <= deadline;
            this.renderResult({ checkin, deadline, isEligible });
        }

        renderPlaceholder() {
            this.panel.className = "result-panel";
            this.panel.innerHTML =
                '<p class="result-placeholder">Pick a date above to see your cancellation deadline.</p>';
        }

        renderResult({ deadline, isEligible }) {
            const deadlineText = this.formatDate(deadline);

            if (isEligible) {
                this.panel.className = "result-panel is-eligible";
                this.panel.innerHTML = `
                    <span class="result-status">Full refund available</span>
                    <p class="result-detail">Cancel by <b>${deadlineText}</b> and you'll get a full refund.
                    After that date, your first night becomes non-refundable.</p>
                `;
            } else {
                this.panel.className = "result-panel is-past";
                this.panel.innerHTML = `
                    <span class="result-status">Free window has passed</span>
                    <p class="result-detail">The full-refund deadline was <b>${deadlineText}</b>. Cancelling now
                    keeps your first night's rate as a cancellation fee — the rest of your stay is refunded.</p>
                `;
            }
        }
    }

    class FaqAccordion {
        constructor(list) {
            this.list = list;
        }

        init() {
            if (!this.list) return;

            this.list.addEventListener("click", (e) => {
                const button = e.target.closest(".pfaq-q");
                if (!button) return;
                this.toggle(button);
            });
        }

        toggle(button) {
            const item = button.closest(".pfaq-item");
            const willOpen = !item.classList.contains("open");
            item.classList.toggle("open", willOpen);
            button.setAttribute("aria-expanded", String(willOpen));
        }
    }

    // ==========================================
    // Safe initialisation
    // ==========================================
    function initAll() {
        new DeadlineCalculator().init();
        new FaqAccordion(document.getElementById("pfaqList")).init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();