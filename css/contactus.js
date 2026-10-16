
(function () {
    "use strict";


    const ContactService = {
        STORAGE_KEY: "tripmate_contact_messages",

        createTicketId() {
            return "TM-" + Date.now().toString(36).toUpperCase().slice(-6);
        },

        async submit(payload) {
            // Example of the real thing:
            //   const res = await fetch("/api/contact", {
            //       method: "POST",
            //       headers: { "Content-Type": "application/json" },
            //       body: JSON.stringify(payload)
            //   });
            //   if (!res.ok) throw new Error("Request failed");
            //   return await res.json(); // { ticketId }

            await new Promise((resolve) => setTimeout(resolve, 700));

            const ticketId = this.createTicketId();
            const messages = this.readAll();
            messages.push({ ...payload, ticketId, sentAt: new Date().toISOString() });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));

            return { ticketId };
        },

        readAll() {
            try {
                const stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
                return Array.isArray(stored) ? stored : [];
            } catch (error) {
                return [];
            }
        }
    };

    class ContactForm {
        constructor() {
            this.card = document.getElementById("contactCard");
            this.form = document.getElementById("contactForm");
            this.alert = document.getElementById("formAlert");
            this.submitBtn = document.getElementById("cfSubmit");
            this.counter = document.getElementById("cfCount");
            this.success = document.getElementById("formSuccess");
            this.sendAnotherBtn = document.getElementById("sendAnother");

            this.fields = {
                name: document.getElementById("cfName"),
                email: document.getElementById("cfEmail"),
                topic: document.getElementById("cfTopic"),
                reference: document.getElementById("cfRef"),
                message: document.getElementById("cfMessage")
            };

            this.maxLength = 1000;
            this.isSending = false;
        }

        init() {
            if (!this.form) return;

            this.prefill();
            this.applyTopicFromUrl();
            this.updateCounter();
            this.bindEvents();
        }

        // ----- Setup -----
        prefill() {
            try {
                const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
                const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");
                if (!user || !session) return;
                if (user.name && !this.fields.name.value) this.fields.name.value = user.name;
                if (user.email && !this.fields.email.value) this.fields.email.value = user.email;
            } catch (error) {
                /* ignore malformed storage */
            }
        }

        // Lets other pages link to e.g. contactus.html?topic=hosting
        applyTopicFromUrl() {
            const topic = new URLSearchParams(window.location.search).get("topic");
            if (!topic) return;
            const exists = Array.from(this.fields.topic.options).some((o) => o.value === topic);
            if (exists) this.fields.topic.value = topic;
        }

        bindEvents() {
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // Clear a field's error as soon as the person starts fixing it
            Object.entries(this.fields).forEach(([key, el]) => {
                const eventName = el.tagName === "SELECT" ? "change" : "input";
                el.addEventListener(eventName, () => {
                    this.clearError(key);
                    this.hideAlert();
                });
            });

            this.fields.message.addEventListener("input", () => this.updateCounter());

            if (this.sendAnotherBtn) {
                this.sendAnotherBtn.addEventListener("click", () => this.reset());
            }
        }

        // ----- Validation -----
        validators = {
            name: (value) => {
                if (!value) return "Enter your full name.";
                if (value.length < 2) return "Enter at least 2 characters.";
                return "";
            },
            email: (value) => {
                if (!value) return "Enter your email so we can reply.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
                    return "Enter a valid email, like juan@example.com.";
                }
                return "";
            },
            topic: (value) => (value ? "" : "Choose a topic so we can send your message to the right person."),
            reference: (value) => {
                if (!value) return "";
                return /^[A-Za-z0-9-]{4,20}$/.test(value) ? "" : "Use 4 to 20 letters, numbers, or dashes.";
            },
            message: (value) => {
                if (!value) return "Write a short message.";
                if (value.length < 10) return "Add a little more detail (at least 10 characters).";
                return "";
            }
        };

        getValues() {
            return {
                name: this.fields.name.value.trim(),
                email: this.fields.email.value.trim(),
                topic: this.fields.topic.value,
                reference: this.fields.reference.value.trim(),
                message: this.fields.message.value.trim()
            };
        }

        validate() {
            const values = this.getValues();
            let firstInvalid = null;

            Object.keys(this.validators).forEach((key) => {
                const error = this.validators[key](values[key]);
                if (error) {
                    this.showError(key, error);
                    if (!firstInvalid) firstInvalid = this.fields[key];
                } else {
                    this.clearError(key);
                }
            });

            if (firstInvalid) firstInvalid.focus();
            return !firstInvalid;
        }

        showError(key, message) {
            const input = this.fields[key];
            const errorEl = document.getElementById(input.id + "-error");
            input.closest(".field").classList.add("invalid");
            input.setAttribute("aria-invalid", "true");
            if (errorEl) errorEl.textContent = message;
        }

        clearError(key) {
            const input = this.fields[key];
            const errorEl = document.getElementById(input.id + "-error");
            input.closest(".field").classList.remove("invalid");
            input.removeAttribute("aria-invalid");
            if (errorEl) errorEl.textContent = "";
        }

        showAlert(message) {
            this.alert.textContent = message;
            this.alert.classList.add("show");
        }

        hideAlert() {
            this.alert.classList.remove("show");
            this.alert.textContent = "";
        }

        // ----- Character counter -----
        updateCounter() {
            const length = this.fields.message.value.length;
            this.counter.textContent = `${length} / ${this.maxLength}`;
            this.counter.classList.toggle("near-limit", length >= this.maxLength - 100);
        }

        // ----- Submit flow -----
        setSending(sending) {
            this.isSending = sending;
            this.submitBtn.disabled = sending;
            const label = this.submitBtn.querySelector(".btn-label");
            if (label) label.textContent = sending ? "Sending…" : "Send message";
        }

        async handleSubmit() {
            if (this.isSending) return;
            this.hideAlert();
            if (!this.validate()) return;

            const payload = this.getValues();
            this.setSending(true);

            try {
                const result = await ContactService.submit(payload);
                this.showSuccess(payload, result.ticketId);
            } catch (error) {
                console.error("Failed to send contact message:", error);
                this.showAlert("We couldn't send your message. Check your connection and try again.");
            } finally {
                this.setSending(false);
            }
        }

        showSuccess(payload, ticketId) {
            const firstName = payload.name.split(/\s+/)[0];
            document.getElementById("successTitle").textContent = `Thanks, ${firstName}. Message sent.`;
            document.getElementById("successText").textContent =
                `We've received your message and will reply to ${payload.email}. Keep the reference below if you need to follow up.`;
            document.getElementById("successTicket").textContent = ticketId;

            this.card.classList.add("is-sent");
            this.success.focus();
            this.card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        reset() {
            this.form.reset();
            Object.keys(this.fields).forEach((key) => this.clearError(key));
            this.hideAlert();
            this.prefill();
            this.updateCounter();
            this.card.classList.remove("is-sent");
            this.fields.topic.focus();
        }
    }


    class FaqAccordion {
        constructor(list) {
            this.list = list;
        }

        init() {
            if (!this.list) return;

            this.list.addEventListener("click", (e) => {
                const button = e.target.closest(".faq-q");
                if (!button) return;
                this.toggle(button);
            });
        }

        toggle(button) {
            const item = button.closest(".faq-item");
            const willOpen = !item.classList.contains("open");
            item.classList.toggle("open", willOpen);
            button.setAttribute("aria-expanded", String(willOpen));
        }
    }

    // ==========================================
    // Safe initialisation
    // ==========================================
    function initAll() {
        new ContactForm().init();
        new FaqAccordion(document.getElementById("faqList")).init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();