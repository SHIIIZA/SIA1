(function () {
    "use strict";

    // --- Retrieve Stored Listing Data or Fallback ---
    const storedStay = localStorage.getItem("selectedStay");
    const parsedStay = storedStay ? JSON.parse(storedStay) : null;

    const listing = {
        id: parsedStay?.id || "pine-crest",
        name: parsedStay?.name || "Pine Crest Villa Retreat",
        location: parsedStay?.location || "Baguio City, Benguet, Luzon",
        rating: parsedStay?.rating || 4.92,
        reviews: parsedStay?.reviews || 128,
        img: parsedStay?.img || "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=800&auto=format&fit=crop",
        ratePerNight: parsedStay?.price || 4500,
        cleaningFee: 800,
        serviceFeeRate: 0.10,
        taxRate: 0.1125,
        maxGuests: parsedStay?.guests || 6
    };

    const PROMO_CODES = {
        "TRIPMATE10": 0.10,
        "WELCOME05": 0.05
    };

    // --- Utility Functions ---
    const todayStr = () => new Date().toISOString().split("T")[0];
    const addDays = (dateStr, days) => {
        const d = new Date(dateStr + "T00:00:00");
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
    };
    const fmtDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-PH", { day: "numeric", month: "short" });
    };
    const peso = (n) => "\u20B1" + Math.round(n).toLocaleString("en-PH");

    // --- URL & LocalStorage Initialization ---
    const urlParams = new URLSearchParams(window.location.search);
    const storedCheckIn = urlParams.get("checkin") || localStorage.getItem("trip_checkin");
    const storedCheckOut = urlParams.get("checkout") || localStorage.getItem("trip_checkout");

    const defaultCheckIn = addDays(todayStr(), 1);
    const defaultCheckOut = addDays(defaultCheckIn, 3);

    const state = {
        checkIn: storedCheckIn && /^\d{4}-\d{2}-\d{2}$/.test(storedCheckIn) ? storedCheckIn : defaultCheckIn,
        checkOut: storedCheckOut && /^\d{4}-\d{2}-\d{2}$/.test(storedCheckOut) ? storedCheckOut : defaultCheckOut,
        guests: Math.min(2, listing.maxGuests),
        promoCode: null,
        promoRate: 0,
        payMethod: "card"
    };

    function nights() {
        const a = new Date(state.checkIn + "T00:00:00");
        const b = new Date(state.checkOut + "T00:00:00");
        const diff = Math.round((b - a) / 86400000);
        return diff > 0 ? diff : 1;
    }

    function pricing() {
        const n = nights();
        const subtotal = listing.ratePerNight * n;
        const cleaning = listing.cleaningFee;
        const serviceFee = Math.round((subtotal + cleaning) * listing.serviceFeeRate);
        const taxes = Math.round(subtotal * listing.taxRate);
        const preDiscount = subtotal + cleaning + serviceFee + taxes;
        const discount = state.promoRate ? Math.round(preDiscount * state.promoRate) : 0;
        const total = preDiscount - discount;
        return { n, subtotal, cleaning, serviceFee, taxes, discount, total };
    }

    const mounts = {
        review: document.getElementById("summaryReview"),
        payment: document.getElementById("summaryPayment"),
        confirm: document.getElementById("summaryConfirm")
    };

    // --- Template Rendering ---
    function summaryCardHTML(withPromo) {
        const p = pricing();
        return `
      <div class="summary-card">
        <div class="summary-media">
          <img src="${listing.img}" alt="${listing.name}">
          <span class="summary-rating"><span class="star">&#9733;</span> ${listing.rating.toFixed(2)} <span class="count">(${listing.reviews} reviews)</span></span>
        </div>
        <div class="summary-body">
          <p class="summary-name">${listing.name}</p>
          <p class="summary-loc"><span>&#128205;</span> ${listing.location}</p>

          <div class="summary-dates">
            <div>
              <p class="d-label">Check-in</p>
              <p class="d-value">${fmtDate(state.checkIn)}</p>
            </div>
            <span class="d-arrow">&#8594;</span>
            <div>
              <p class="d-label">Check-out</p>
              <p class="d-value">${fmtDate(state.checkOut)}</p>
            </div>
            <div class="d-meta">${p.n} Night${p.n > 1 ? "s" : ""}<br>${state.guests} Guest${state.guests > 1 ? "s" : ""}</div>
          </div>

          <p class="summary-price-title">Price details</p>
          <div class="price-line"><span>${peso(listing.ratePerNight)} &times; ${p.n} night${p.n > 1 ? "s" : ""}</span><b>${peso(p.subtotal)}</b></div>
          <div class="price-line"><span>Cleaning fee</span><b>${peso(p.cleaning)}</b></div>
          <div class="price-line"><span>TripMate service fee</span><b>${peso(p.serviceFee)}</b></div>
          <div class="price-line"><span>Taxes</span><b>${peso(p.taxes)}</b></div>
          ${state.promoCode ? `<div class="price-line is-promo"><span>Promo &middot; ${state.promoCode} ${withPromo ? '<span class="remove-promo" data-action="remove-promo">Remove</span>' : ""}</span><b>&minus;${peso(p.discount)}</b></div>` : ""}

          <div class="summary-total">
            <span class="t-label">Total</span>
            <span class="t-value">${peso(p.total)}</span>
          </div>

          ${withPromo ? `
          <div class="promo-row">
            ${state.promoCode
                ? ""
                : `<button type="button" class="promo-toggle" data-action="toggle-promo">Have a promo code?</button>
                   <div class="promo-form" id="promoForm">
                     <input type="text" id="promoInput" placeholder="Enter code">
                     <button type="button" data-action="apply-promo">Apply</button>
                   </div>
                   <p class="promo-msg" id="promoMsg"></p>`
            }
          </div>` : ""}
        </div>
      </div>`;
    }

    function renderSummaries() {
        if (mounts.review) mounts.review.innerHTML = summaryCardHTML(true);
        if (mounts.payment) mounts.payment.innerHTML = summaryCardHTML(true);
        if (mounts.confirm) mounts.confirm.innerHTML = summaryCardHTML(false);
        if (mounts.review) bindPromoHandlers(mounts.review);
        if (mounts.payment) bindPromoHandlers(mounts.payment);
        syncPayButtonTotal();
    }

    function bindPromoHandlers(root) {
        const toggle = root.querySelector('[data-action="toggle-promo"]');
        const form = root.querySelector("#promoForm");
        const applyBtn = root.querySelector('[data-action="apply-promo"]');
        const removeBtn = root.querySelector('[data-action="remove-promo"]');

        if (toggle && form) {
            toggle.addEventListener("click", () => form.classList.toggle("is-open"));
        }
        if (applyBtn) {
            applyBtn.addEventListener("click", () => {
                const input = root.querySelector("#promoInput");
                const msg = root.querySelector("#promoMsg");
                const code = (input.value || "").trim().toUpperCase();
                if (!code) {
                    msg.textContent = "Enter a code first.";
                    msg.className = "promo-msg is-error";
                    return;
                }
                if (PROMO_CODES[code]) {
                    state.promoCode = code;
                    state.promoRate = PROMO_CODES[code];
                    renderSummaries();
                } else {
                    msg.textContent = "That code isn't valid.";
                    msg.className = "promo-msg is-error";
                }
            });
        }
        if (removeBtn) {
            removeBtn.addEventListener("click", () => {
                state.promoCode = null;
                state.promoRate = 0;
                renderSummaries();
            });
        }
    }

    function syncPayButtonTotal() {
        const el = document.getElementById("payBtnTotal");
        if (el) el.textContent = pricing().total.toLocaleString("en-PH");
    }

    // --- Review Panel Inputs & Stepper Controls ---
    const checkinInput = document.getElementById("checkin");
    const checkoutInput = document.getElementById("checkout");
    const nightsHint = document.getElementById("nightsHint");
    const guestCountEl = document.getElementById("guestCount");
    const guestMinus = document.getElementById("guestMinus");
    const guestPlus = document.getElementById("guestPlus");

    function initReviewControls() {
        if (checkinInput) {
            checkinInput.min = todayStr();
            checkinInput.value = state.checkIn;
        }
        if (checkoutInput) {
            checkoutInput.value = state.checkOut;
            checkoutInput.min = addDays(state.checkIn, 1);
        }
        if (guestCountEl) guestCountEl.textContent = state.guests;

        const guestHint = document.querySelector(".guest-row .hint");
        if (guestHint) {
            guestHint.textContent = `This stay comfortably fits up to ${listing.maxGuests} guests.`;
        }

        checkinInput?.addEventListener("change", () => {
            if (!checkinInput.value) return;
            state.checkIn = checkinInput.value;
            localStorage.setItem("trip_checkin", state.checkIn);
            if (checkoutInput) checkoutInput.min = addDays(state.checkIn, 1);
            if (state.checkOut <= state.checkIn) {
                state.checkOut = addDays(state.checkIn, 1);
                if (checkoutInput) checkoutInput.value = state.checkOut;
                localStorage.setItem("trip_checkout", state.checkOut);
            }
            refreshTrip();
        });

        checkoutInput?.addEventListener("change", () => {
            if (!checkoutInput.value) return;
            state.checkOut = checkoutInput.value;
            localStorage.setItem("trip_checkout", state.checkOut);
            refreshTrip();
        });

        guestMinus?.addEventListener("click", () => {
            if (state.guests > 1) {
                state.guests -= 1;
                if (guestCountEl) guestCountEl.textContent = state.guests;
                updateGuestButtons();
                renderSummaries();
            }
        });

        guestPlus?.addEventListener("click", () => {
            if (state.guests < listing.maxGuests) {
                state.guests += 1;
                if (guestCountEl) guestCountEl.textContent = state.guests;
                updateGuestButtons();
                renderSummaries();
            }
        });
        updateGuestButtons();
    }

    function updateGuestButtons() {
        if (guestMinus) guestMinus.disabled = state.guests <= 1;
        if (guestPlus) guestPlus.disabled = state.guests >= listing.maxGuests;
    }

    function refreshTrip() {
        if (nightsHint) nightsHint.textContent = nights() + " night" + (nights() > 1 ? "s" : "");
        renderSummaries();
    }

    // --- Multi-Step Navigation & Stepper Logic ---
    const panels = {
        1: document.getElementById("panel-1"),
        2: document.getElementById("panel-2"),
        3: document.getElementById("panel-3")
    };
    const stepEls = document.querySelectorAll(".step");
    const lineEls = document.querySelectorAll(".step-line");
    let currentStep = 1;
    let highestUnlocked = 1;

    function goToStep(step) {
        if (step > highestUnlocked) return;
        Object.keys(panels).forEach((k) => {
            if (panels[k]) panels[k].hidden = Number(k) !== step;
        });
        currentStep = step;
        updateStepper();
        const stepperWrap = document.querySelector(".stepper-wrap");
        if (stepperWrap) {
            window.scrollTo({ top: stepperWrap.offsetTop, behavior: "smooth" });
        }
    }

    function updateStepper() {
        stepEls.forEach((el) => {
            const n = Number(el.dataset.step);
            el.classList.toggle("is-active", n === currentStep);
            el.classList.toggle("is-done", n < currentStep || n < highestUnlocked);
            const btn = el.querySelector(".step-dot");
            if (btn) {
                btn.disabled = n > highestUnlocked;
                btn.setAttribute("aria-current", n === currentStep ? "true" : "false");
            }
        });
        lineEls.forEach((el) => {
            const n = Number(el.dataset.line);
            el.classList.toggle("is-filled", n < highestUnlocked || n < currentStep);
        });
    }

    document.querySelectorAll("[data-goto]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const step = Number(btn.dataset.goto);
            if (step <= highestUnlocked) goToStep(step);
        });
    });

    // Added safety check: validate dates before jumping to Payment
    document.getElementById("toPaymentBtn")?.addEventListener("click", () => {
        if (new Date(state.checkOut) <= new Date(state.checkIn)) {
            alert("Please make sure your check-out date is after your check-in date.");
            return;
        }
        highestUnlocked = Math.max(highestUnlocked, 2);
        goToStep(2);
    });

    document.getElementById("backToReviewBtn")?.addEventListener("click", () => goToStep(1));

    // --- Payment Options Switcher ---
    document.querySelectorAll(".pay-option").forEach((opt) => {
        opt.addEventListener("click", () => {
            document.querySelectorAll(".pay-option").forEach((o) => o.classList.remove("is-selected"));
            opt.classList.add("is-selected");
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            state.payMethod = opt.dataset.method;
        });
    });

    // --- Form Error Handling & Validation ---
    function setError(input, message) {
        if (!input) return;
        const field = input.closest(".field");
        if (!field) return;
        const errEl = field.querySelector(".error-text");
        if (message) {
            field.classList.add("has-error");
            if (errEl) errEl.textContent = message;
        } else {
            field.classList.remove("has-error");
            if (errEl) errEl.textContent = "";
        }
    }

    function validateGuestForm() {
        let ok = true;
        const first = document.getElementById("firstName");
        const last = document.getElementById("lastName");
        const email = document.getElementById("email");
        const phone = document.getElementById("phone");

        if (first && !first.value.trim()) { setError(first, "Enter your first name."); ok = false; } else setError(first, "");
        if (last && !last.value.trim()) { setError(last, "Enter your last name."); ok = false; } else setError(last, "");

        const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        if (!emailOk) { setError(email, "Enter a valid email address."); ok = false; } else setError(email, "");

        const phoneDigits = phone ? phone.value.replace(/\D/g, "") : "";
        if (phoneDigits.length < 10) { setError(phone, "Enter a valid mobile number."); ok = false; } else setError(phone, "");

        return ok;
    }

    function validateCardForm() {
        let ok = true;
        const cardNumber = document.getElementById("cardNumber");
        const expiry = document.getElementById("expiry");
        const cvc = document.getElementById("cvc");

        const digits = cardNumber ? cardNumber.value.replace(/\s/g, "") : "";
        if (digits.length !== 16) { setError(cardNumber, "Enter a 16-digit card number."); ok = false; } else setError(cardNumber, "");

        const expMatch = expiry ? expiry.value.match(/^(\d{2})\/(\d{2})$/) : null;
        if (!expMatch) {
            setError(expiry, "Use MM/YY.");
            ok = false;
        } else {
            const mm = Number(expMatch[1]), yy = Number(expMatch[2]) + 2000;
            const now = new Date();
            const currentYY = now.getFullYear();
            const currentMM = now.getMonth() + 1;
            if (mm < 1 || mm > 12 || yy < currentYY || (yy === currentYY && mm < currentMM)) {
                setError(expiry, "Card has expired.");
                ok = false;
            } else setError(expiry, "");
        }

        if (cvc && !/^\d{3,4}$/.test(cvc.value)) { setError(cvc, "3 or 4 digits."); ok = false; } else setError(cvc, "");

        return ok;
    }

    // --- Input Format Masks ---
    document.getElementById("cardNumber")?.addEventListener("input", (e) => {
        let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
        e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
    });

    document.getElementById("expiry")?.addEventListener("input", (e) => {
        let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
        e.target.value = digits;
    });

    document.getElementById("cvc")?.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });

    document.getElementById("phone")?.addEventListener("input", (e) => {
        let digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        let out = digits;
        if (digits.length > 3) out = digits.slice(0, 3) + " " + digits.slice(3);
        if (digits.length > 6) out = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
        e.target.value = out;
    });

    ["firstName", "lastName", "email"].forEach((id) => {
        document.getElementById(id)?.addEventListener("input", (e) => setError(e.target, ""));
    });

    // --- Checkout Submission Handling ---
    const payBtn = document.getElementById("payBtn");

    payBtn?.addEventListener("click", () => {
        const guestOk = validateGuestForm();
        const cardOk = state.payMethod === "card" ? validateCardForm() : true;
        if (!guestOk || !cardOk) {
            const firstError = document.querySelector(".field.has-error input");
            if (firstError) firstError.focus();
            return;
        }

        const label = payBtn.querySelector(".btn-label");
        const spinner = payBtn.querySelector(".btn-spinner");
        payBtn.disabled = true;
        if (label) label.style.opacity = "0";
        if (spinner) spinner.hidden = false;

        setTimeout(() => {
            if (spinner) spinner.hidden = true;
            if (label) label.style.opacity = "1";
            payBtn.disabled = false;
            completeBooking();
        }, 1100);
    });

    function completeBooking() {
        highestUnlocked = 3;
        const confirmEmail = document.getElementById("confirmEmail");
        const emailInput = document.getElementById("email");
        if (confirmEmail && emailInput) {
            confirmEmail.textContent = emailInput.value.trim();
        }
        const confirmRef = document.getElementById("confirmRef");
        if (confirmRef) {
            confirmRef.textContent = "TM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        }
        renderSummaries();
        goToStep(3);
    }

    document.getElementById("newBookingBtn")?.addEventListener("click", () => {
        highestUnlocked = 1;
        currentStep = 1;
        state.promoCode = null;
        state.promoRate = 0;
        goToStep(1);
    });

    // --- Mobile Navigation Menu Toggle ---
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

    // --- Initial Boot ---
    initReviewControls();
    refreshTrip();
    updateStepper();
    goToStep(1);
})();