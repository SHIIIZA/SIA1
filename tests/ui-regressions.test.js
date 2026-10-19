import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const homepage = await readFile(new URL("../homepage.html", import.meta.url), "utf8");
const propertyScript = await readFile(new URL("../js/property.js", import.meta.url), "utf8");

test("homepage search submits destination and dates to stays", () => {
    assert.match(homepage, /<form class="search-bar" action="stays\.html" method="get">/);
    assert.match(homepage, /<select id="destinationSelect" name="search">/);
    assert.match(homepage, /<input type="date" id="checkinInput" name="checkin">/);
    assert.match(homepage, /<input type="date" id="checkoutInput" name="checkout">/);
    assert.match(homepage, /<button class="search-btn" id="homeSearchBtn" type="submit">/);
});

test("selecting a property thumbnail updates the main image and active state", () => {
    class FakeElement {
        constructor(tagName = "div") {
            this.tagName = tagName.toUpperCase();
            this.children = [];
            this.listeners = {};
            this.dataset = {};
            this.attributes = {};
            this.className = "";
            this.classList = {
                add: name => this.setClass(name, true),
                remove: name => this.setClass(name, false),
                toggle: (name, force) => this.setClass(name, force)
            };
        }

        setClass(name, force) {
            const classes = new Set(this.className.split(/\s+/).filter(Boolean));
            if (force) classes.add(name);
            else classes.delete(name);
            this.className = [...classes].join(" ");
        }

        addEventListener(type, listener) {
            this.listeners[type] = listener;
        }

        appendChild(child) {
            this.children.push(child);
            return child;
        }

        append(...children) {
            children.forEach(child => this.appendChild(child));
        }

        replaceChildren(...children) {
            this.children = [];
            this.append(...children);
        }

        contains(element) {
            return this.children.includes(element) || this.children.some(child => child.contains(element));
        }

        querySelectorAll(selector) {
            return selector === ".thumb"
                ? this.children.filter(child => child.className.split(/\s+/).includes("thumb"))
                : [];
        }

        setAttribute(name, value) {
            this.attributes[name] = value;
        }

        closest(selector) {
            return selector === "button.thumb"
                && this.tagName === "BUTTON"
                && this.className.split(/\s+/).includes("thumb")
                ? this
                : null;
        }
    }

    const ids = [
        "mainImage", "galleryThumbs", "propertyType", "propertyName", "propertyLocation",
        "propertyStars", "propertyRatingValue", "propertyHost", "propertyDescription",
        "amenitiesGrid", "houseRules", "nightlyPrice", "bookingBreakdown", "bookingForm",
        "checkinDate", "checkoutDate", "guestCount", "guestMinus", "guestPlus", "bookNowBtn",
        "imageLightbox", "lightboxImage", "closeLightbox"
    ];
    const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
    elements.bookingForm.dataset = {};
    elements.guestCount.value = "1";
    const document = {
        title: "",
        head: new FakeElement(),
        body: new FakeElement(),
        getElementById: id => elements[id],
        createElement: tagName => new FakeElement(tagName),
        querySelector: () => null
    };
    const localStorage = { getItem: () => null, setItem() {} };

    vm.runInNewContext(propertyScript, {
        document,
        window: { location: { search: "", href: "https://trypmate.netlify.app/property.html" } },
        localStorage,
        URL,
        URLSearchParams,
        Element: FakeElement,
        console,
        setTimeout,
        clearTimeout
    });

    const gallery = elements.galleryThumbs;
    const thumbnails = gallery.children;
    assert.equal(thumbnails.length, 4);

    gallery.listeners.click({ target: thumbnails[1] });

    assert.match(elements.mainImage.src, /photo-1518509562904-e7ef99cdcc86/);
    assert.equal(thumbnails[0].attributes["aria-pressed"], "false");
    assert.equal(thumbnails[1].attributes["aria-pressed"], "true");
    assert.equal(thumbnails[0].className.includes("active"), false);
    assert.equal(thumbnails[1].className.includes("active"), true);
});
