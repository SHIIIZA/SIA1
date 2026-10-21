import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const homepage = await readFile(new URL("../homepage.html", import.meta.url), "utf8");
const propertyScript = await readFile(new URL("../js/property.js", import.meta.url), "utf8");
const authScript = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");
const serverScript = await readFile(new URL("../server.js", import.meta.url), "utf8");
const serviceWorker = await readFile(new URL("../sw.js", import.meta.url), "utf8");
const propertyPage = await readFile(new URL("../property.html", import.meta.url), "utf8");
const profilePage = await readFile(new URL("../profile.html", import.meta.url), "utf8");
const staysPage = await readFile(new URL("../stays.html", import.meta.url), "utf8");
const wishlistPage = await readFile(new URL("../wishlist.html", import.meta.url), "utf8");
const wishlistScript = await readFile(new URL("../js/wishlist.js", import.meta.url), "utf8");
const dashboardPage = await readFile(new URL("../dashboard.html", import.meta.url), "utf8");
const dashboardScript = await readFile(new URL("../js/dashboard.js", import.meta.url), "utf8");
const staysScript = await readFile(new URL("../js/stays.js", import.meta.url), "utf8");
const hostListingsPage = await readFile(new URL("../host/listings.html", import.meta.url), "utf8");
const hostListingsScript = await readFile(new URL("../js/host-listings.js", import.meta.url), "utf8");
const contactStyles = await readFile(new URL("../css/contactus.css", import.meta.url), "utf8");
const staysStyles = await readFile(new URL("../css/stays.css", import.meta.url), "utf8");
const pwaPages = await Promise.all([
    "about.html", "admin.html", "booking.html", "cancellation.html", "contactus.html",
    "dashboard.html", "forgot-password.html", "homepage.html", "index.html", "login.html",
    "profile.html", "property.html", "signup.html", "stays.html", "wishlist.html",
    "host/dashboard.html", "host/listings.html"
].map(page => readFile(new URL(`../${page}`, import.meta.url), "utf8")));

test("homepage search submits destination and dates to stays", () => {
    assert.match(homepage, /<form class="search-bar" action="stays\.html" method="get">/);
    assert.match(homepage, /<select id="destinationSelect" name="search">/);
    assert.match(homepage, /<input type="date" id="checkinInput" name="checkin">/);
    assert.match(homepage, /<input type="date" id="checkoutInput" name="checkout">/);
    assert.match(homepage, /<button class="search-btn" id="homeSearchBtn" type="submit">/);
});

test("login redirects stay on the TripMate origin", () => {
    const localStorage = { getItem: () => null };
    const context = {
        URL,
        localStorage,
        window: { location: { origin: "https://tripmate.example" } },
        document: {}
    };
    vm.runInNewContext(authScript, context);

    assert.equal(context.getSafeRedirectPath("profile.html?tab=security", "dashboard.html"), "/profile.html?tab=security");
    assert.equal(context.getSafeRedirectPath("https://attacker.example/collect", "dashboard.html"), "dashboard.html");
    assert.equal(context.getSafeRedirectPath("//attacker.example", "dashboard.html"), "dashboard.html");
    assert.equal(context.getSafeRedirectPath("https://tripmate.example//attacker.example", "dashboard.html"), "dashboard.html");
});

test("remember-me changes the server token lifetime without changing the default", () => {
    assert.match(serverScript, /const sessionDays = rememberMe \? 30 : 7/);
    assert.match(homepage, /rel="manifest" href="\/manifest\.webmanifest"/);
    assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
});

test("PWA install metadata and offline registration are available across site pages", () => {
    for (const page of pwaPages) {
        assert.match(page, /rel="manifest" href="\/manifest\.webmanifest"/);
        assert.match(page, /src="\/?js\/pwa\.js" defer/);
    }
});

test("property reviews and profile deletion require explicit UI actions", () => {
    assert.match(propertyPage, /id="reviewForm"/);
    assert.match(propertyScript, /localStorage\.setItem\("tripmate_reviews"/);
    assert.match(profilePage, /id="deleteAccountPhrase"/);
    assert.match(profilePage, /id="avatarInput"/);
});

test("stays pagination and wishlist batch actions are exposed", () => {
    assert.match(staysPage, /id="loadMoreStays"/);
    assert.match(staysPage, /id="showMapView"/);
    assert.match(wishlistPage, /id="moveSelectedToTrip"/);
    assert.match(wishlistPage, /id="removeSelectedWishlist"/);
    assert.match(wishlistScript, /tripmate_saved_trip/);
    assert.match(dashboardPage, /id="savedTripGrid"/);
    assert.match(dashboardScript, /tripmate_saved_trip:\$\{user\.id\}/);
    assert.match(dashboardScript, /data-remove-trip-id/);
});

test("saved searches can be saved, restored, listed, and deleted", () => {
    assert.match(staysPage, /id="saveSearchBtn"/);
    assert.match(staysPage, /id="savedSearchesList"/);
    assert.match(staysScript, /apiRequest\("\/saved-searches"/);
    assert.match(staysScript, /data-action="apply-saved-search"/);
    assert.match(staysScript, /data-action="remove-saved-search"/);
    assert.match(serverScript, /req\.method === "GET" && url\.pathname === "\/api\/saved-searches"/);
    assert.match(serverScript, /req\.method === "DELETE" && savedSearchMatch/);
});

test("host listing descriptions persist through drafts and publication", () => {
    assert.match(hostListingsPage, /id="propertyDescription"[^>]*maxlength="1000"/);
    assert.match(hostListingsScript, /description: document\.getElementById\('propertyDescription'\)\.value\.trim\(\)\.slice\(0, 1000\)/);
    assert.match(hostListingsScript, /setValue\('propertyDescription', basics\.description\)/);
    assert.match(hostListingsScript, /description: localListing\.description/);
    assert.match(hostListingsScript, /<div class="review-summary-description"><dt>Description<\/dt><dd>\$\{description \? escapeHtml\(description\) : 'Not provided'\}<\/dd><\/div>/);
    assert.match(hostListingsScript, /const createdListing = await apiRequest\('\/host\/listings'/);
    assert.match(hostListingsScript, /createdListing\.id == null/);
    assert.match(hostListingsScript, /Unable to publish the listing:/);
    assert.match(serverScript, /description\.length > 1000/);
});

test("responsive contact navigation and stays card alignment are styled", () => {
    assert.match(contactStyles, /\.hero\.page-hero nav \.nav-links\s*\{[^}]*flex: 0 0 100%/s);
    assert.match(staysStyles, /\.stays-grid \.listing-card\s*\{[^}]*display: flex/);
    assert.match(staysStyles, /\.stays-grid \.listing-footer\s*\{\s*margin-top: auto/s);
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
