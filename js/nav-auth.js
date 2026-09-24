/* TripMate — shared logged-in nav state.
   Swaps the hero nav's "Get started" pill for an account avatar + dropdown
   on any page that includes this script after auth.js. Assumes the page's
   nav has a `.nav-cta` element and (optionally) a `.nav-links` list with a
   "Become a Host" link. Intended for top-level pages (homepage.html, stays.html). */

(function () {
  "use strict";

  // Escapes a value before it's interpolated into innerHTML, so a user's
  // own name/email (entered at signup, not sanitized there) can't inject
  // markup into the page.
  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loggedIn = typeof isLoggedIn === "function" ? isLoggedIn() : false;
    const user = loggedIn && typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const navCta = document.querySelector(".nav-cta");
    if (!user || !navCta) return; // not logged in, or page has no CTA slot — leave as-is

    const initials = (user.name || "U")
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const dashboardHref = user.type === "host" ? "host/dashboard.html" : "dashboard.html";
    const dashboardLabel = user.type === "host" ? "Host Dashboard" : "My Trips";

    const wrapper = document.createElement("div");
    wrapper.className = "nav-user-menu";
    wrapper.innerHTML = `
      <button class="user-avatar-btn" id="navUserAvatarBtn" aria-label="Account menu" type="button">${initials}</button>
      <div class="user-dropdown" id="navUserDropdown">
        <div class="dropdown-header">
          <span class="dropdown-name">${escapeHtml(user.name)}</span>
          <span class="dropdown-email">${escapeHtml(user.email)}</span>
        </div>
        <a href="${dashboardHref}" class="dropdown-item">${dashboardLabel}</a>
        ${user.type === "guest" ? '<a href="wishlist.html" class="dropdown-item">Wishlist</a>' : ""}
        <a href="profile.html" class="dropdown-item">Profile</a>
        <hr class="dropdown-divider">
        <a href="#" class="dropdown-item" id="navLogoutBtn">Log out</a>
      </div>
    `;

    navCta.replaceWith(wrapper);
    document.querySelector(".nav-login")?.remove();

    const avatarBtn = wrapper.querySelector("#navUserAvatarBtn");
    const dropdown = wrapper.querySelector("#navUserDropdown");

    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) dropdown.classList.remove("open");
    });

    wrapper.querySelector("#navLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
      window.location.href = "homepage.html";
    });

    // If logged in as a host, point "Become a Host" straight at the dashboard.
    if (user.type === "host") {
      const hostLink = Array.from(document.querySelectorAll(".nav-links a"))
        .find(a => /become a host/i.test(a.textContent));
      if (hostLink) {
        hostLink.textContent = "Host Dashboard";
        hostLink.setAttribute("href", "host/dashboard.html");
      }
    }
  });
})();