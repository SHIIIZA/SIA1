(function () {
    "use strict";

    let policy = null;
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
            const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            return this.parseLocalDate(date);
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
            if (!policy) { this.showError('Current policy is unavailable. Please try again later.'); return; }
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

            const deadline = this.addDays(checkin, -policy.free_cancel_days);
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
                    After that date, a fee of ${policy.late_fee_nights} night(s) applies, capped at the amount paid. Refunds are wallet credit after admin approval.</p>
                `;
            } else {
                this.panel.className = "result-panel is-past";
                this.panel.innerHTML = `
                    <span class="result-status">Free window has passed</span>
                    <p class="result-detail">The full-refund deadline was <b>${deadlineText}</b>. Cancelling now
                    deducts ${policy.late_fee_nights} night(s), capped at the amount paid. Any remaining refund is wallet credit after admin approval.</p>
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
        const calculator = new DeadlineCalculator();
        calculator.init();
        apiRequest('/cancellation-policy').then(value => {
            policy = value;
            document.getElementById('currentCancellationPolicy').textContent = `For new bookings: full wallet refund at least ${policy.free_cancel_days} days before check-in. Later cancellations deduct ${policy.late_fee_nights} night(s), capped at the amount paid. Existing bookings keep their original policy.`;
            if (calculator.input?.value) calculator.handleChange();
        }).catch(() => {
            document.getElementById('currentCancellationPolicy').textContent = 'Current rules could not be loaded. Check your booking’s cancellation quote in My Trips or try again later.';
        });
        new FaqAccordion(document.getElementById("pfaqList")).init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();