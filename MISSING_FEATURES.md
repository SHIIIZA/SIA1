# TripMate — Missing Frontend Features

> **Scope:** Client-side only (no API/backend). Based on `architecture.mmd`, `user-flow.mmd`, and existing HTML/JS/CSS.

---

## 🏠 1. Host Dashboard (`host/dashboard.html`)

| Missing Piece | Details |
|---------------|---------|
| **Page shell** | HTML file with dashboard-nav, sidebar tabs (Listings / Bookings / Earnings) |
| **Stats cards** | Total listings, active bookings, monthly earnings, occupancy rate |
| **Recent bookings table** | Columns: Guest, Property, Dates, Status, Amount — with pagination |
| **Listings grid** | Cards showing thumbnail, name, status (Published/Draft), price, quick actions |
| **Empty states** | "No listings yet" with CTA to create first listing |
| **JS module** | `host-dashboard.js` — data binding, tab switching, mock data rendering |
| **CSS** | `host-dashboard.css` — stats grid, tables, listing cards, responsive |

---

## 🏗️ 2. Host Listings Wizard (`host/listings.html`)

| Step | Fields / UI |
|------|-------------|
| **1. Basics** | Property name, type (Hotel/House/Apartment), location (address + map pick), max guests, bedrooms, bathrooms |
| **2. Pricing** | Base price/night, weekend surcharge, cleaning fee, security deposit, discounts (weekly/monthly) |
| **3. Photos** | Drag-drop multi-upload (max 20), reorder, caption, cover picker — preview grid |
| **4. Amenities** | Checklist grouped: Essentials, Facilities, Safety, Accessibility, Outdoors |
| **5. House Rules** | Check-in/out times, smoking, parties, pets, children, custom rules textarea |
| **6. Calendar** | Block dates, set min/max stay, seasonal pricing override |
| **7. Publish** | Summary review, toggle "Published", SEO slug preview |

**Technical needs**
- Multi-step wizard component (stepper, next/prev, validation per step)
- Image upload preview (FileReader + Object URLs, no server)
- Map picker (Leaflet/MapLibre GL — static embed, no API key)
- `host-listings.js` + `host-listings.css`
- Persist draft to `localStorage` key `host_listing_draft`

---

## 📅 3. Booking Wizard — Complete Steps (`booking.html`)

| Step | Current | Missing |
|------|---------|---------|
| **1. Review** | Dates/guests summary | Price breakdown: nightly × nights + cleaning + fees + taxes = total |
| **2. Guest Details** | Form fields | Traveler info (name, email, phone), special requests, T&C checkbox |
| **3. Payment** | Placeholder | **Payment method tabs**: GCash / Maya / Card — each with mock form validation (no real processing) |
| **4. Confirmation** | Reference only | Success animation, booking ref `TM-XXXXXX`, calendar download (.ics), share buttons |

**JS**: Extend `booking.js` with stepper controller, form validation, price calculator, mock payment flow.

---

## 🏨 4. Property Page Enhancements (`property.html` / `property.js`)

| Feature | Spec |
|---------|------|
| **Image gallery** | Thumbnail strip + main viewer, keyboard nav, swipe on mobile, fullscreen lightbox |
| **Amenities accordion** | Categorized, collapsible, icons |
| **Reviews section** | Star summary, paginated cards, "Write review" CTA (opens modal) |
| **Host card** | Avatar, name, "Superhost" badge, response rate, message button |
| **Sticky booking bar** | Fixed on scroll, shows total price, "Reserve" CTA |
| **Map embed** | Static map image → click opens full-screen Leaflet map |
| **Availability calendar** | Visual heatmap (green=available, gray=booked), disabled dates unselectable |

---

## 🔍 5. Stays Page — Filters & UX (`stays.html` / `stays.js`)

| Missing | Details |
|---------|---------|
| **Filter sidebar** | Type checkboxes, price range slider, rating stars, amenities multi-select, guests/beds/baths inputs |
| **Sort dropdown** | Relevance, Price ↑/↓, Rating, Newest |
| **Map toggle** | List ↔ Map split view (Leaflet markers + clustering) |
| **URL sync** | PushState on filter/sort/page → shareable links |
| **Infinite scroll / pagination** | Load more button or intersection observer |
| **Save search** | Heart icon on search bar → adds to wishlist-style saved searches |

---

## ❤️ 6. Wishlist Page — Polish (`wishlist.html` / `wishlist.js`)

| Item | Spec |
|------|------|
| **Grid/List view toggle** | Already in HTML — wire up `data-view` switch in JS |
| **Sort dropdown** | Already in HTML — implement sort logic (recent, price, rating) |
| **Batch actions** | Select multiple → "Move to trip" / "Remove" |
| **Price drop alert** | Mock: show "₱200 off since saved" badge |
| **Empty state** | Already present — ensure it shows when `tripmate_wishlist` empty |

---

## 👤 7. Profile Page — Functionality (`profile.html` / `profile.js`)

| Section | Missing Logic |
|---------|---------------|
| **Avatar upload** | FileReader preview, cropper (Cropper.js), save to `localStorage` as data URL |
| **Account form** | Validate, save to `tripmate_user`, toast confirmation |
| **Password change** | Current + new + confirm, strength meter, match check |
| **Notifications** | Toggle switches → persist to `tripmate_notifications` key |
| **Danger zone** | Delete account modal (type "DELETE" to confirm), clear all user keys |

---

## 🔐 8. Auth Pages — Polish (`login.html`, `signup.html`, `forgot-password.html`)

| Page | Missing |
|------|---------|
| **Login** | "Remember me" (extends session TTL), social login buttons (UI only), password visibility toggle |
| **Signup** | Role selector (Traveler/Host) → shows/hides business fields, password strength, T&C link |
| **Forgot password** | Email input → mock "reset link sent" toast, countdown timer for resend |
| **All** | Redirect `?redirect=` param handling in `auth.js` |

---

## 🧭 9. Shared / Cross-Cutting

| Feature | Files Affected |
|---------|----------------|
| **Mobile nav drawer** | `nav-auth.js` + CSS — hamburger opens slide-over menu (all dashboard pages) |
| **Toast system** | Global `showToast(message, type)` — success/error/info, auto-dismiss |
| **Modal system** | Reusable `<dialog>` wrapper — confirm, form, image preview |
| **Date picker component** | Shared module for homepage, property, booking — range select, min/max, disabled dates |
| **Loading skeletons** | CSS-only placeholders for listings grid, dashboard cards, wishlist |
| **Error boundaries** | Try/catch in each page JS → friendly fallback UI |
| **PWA manifest + SW** | `manifest.json`, `sw.js` (cache-first for static assets, offline fallback) |

---

## 📦 10. Data Layer — localStorage Schemas

Extend `architecture.mmd` Data layer with:

```js
// host_listing_draft
{ step: 3, data: { basics: {...}, pricing: {...}, photos: [...], ... } }

// tripmate_notifications
{ booking: true, payment: true, reminders: true, promo: false }

// tripmate_saved_searches
[{ id, name, filters: {...}, createdAt }]

// tripmate_reviews (demo)
[{ id, listingId, userId, rating, comment, date, response }]
```

---

## 🎯 Priority Order (Frontend Only)

1. **Host Dashboard + Listings Wizard** — unlocks entire host flow
2. **Booking Wizard Steps 2–4** — completes guest journey
3. **Property Gallery + Reviews** — high visibility UX
4. **Stays Filters + Map** — core discovery
5. **Profile Functionality** — account management
6. **Auth Polish + Toasts/Modals** — shared DX
7. **PWA + Mobile Nav** — progressive enhancement

---

## 🛠️ Suggested File Structure Additions

```
host/
  dashboard.html
  listings.html
  css/
    host-dashboard.css
    host-listings.css
  js/
    host-dashboard.js
    host-listings.js

js/
  components/
    date-picker.js
    modal.js
    toast.js
    image-uploader.js
    stepper.js
  utils/
    storage.js
    validation.js
    price-calc.js

css/
  components/
    modal.css
    toast.css
    stepper.css
    date-picker.css
  pages/
    host-dashboard.css
    host-listings.css
```

---

*Generated from architecture/user-flow analysis. Backend/API integration intentionally excluded per instructions.*