/* TripMate session helpers. Account records and credentials are stored by the API. */
const USER_KEY = "tripmate_user";
const SESSION_KEY = "tripmate_session";

function logoutUser() {
  if (typeof apiLogout === "function") {
    apiLogout();
    return;
  }
  localStorage.removeItem("tripmate_access_token");
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("tripmate-user-updated", { detail: null }));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getCurrentUser() && !!localStorage.getItem(SESSION_KEY);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldEl, message) {
  fieldEl.classList.add("has-error");
  const input = fieldEl.querySelector("input");
  if (input) input.classList.add("invalid");
  const msg = fieldEl.querySelector(".error-msg");
  if (msg) msg.textContent = message;
}

function clearFieldError(fieldEl) {
  fieldEl.classList.remove("has-error");
  const input = fieldEl.querySelector("input");
  if (input) input.classList.remove("invalid");
}

function eyeIcon(open = true) {
  return open
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s4 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/></svg>`;
}

function wirePasswordToggle(toggleBtn, input) {
  let visible = false;
  toggleBtn.addEventListener("click", () => {
    visible = !visible;
    input.type = visible ? "text" : "password";
    toggleBtn.innerHTML = eyeIcon(!visible);
    toggleBtn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  });
}

function showToast(message, isError = false) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error-toast", isError);
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

(function syncAccountFromApi() {
  const token = localStorage.getItem("tripmate_access_token");
  if (!token || token === "local-demo-admin") return;

  const refresh = () => apiGetCurrentUser().catch(error => {
    if (error.status === 401 || error.status === 404) {
      logoutUser();
      return;
    }
    console.error("Unable to refresh TripMate account from the API:", error);
  });

  if (typeof apiGetCurrentUser === "function") {
    refresh();
    return;
  }

  const apiScript = document.createElement("script");
  apiScript.src = new URL("/js/api.js", document.baseURI).href;
  apiScript.addEventListener("load", refresh, { once: true });
  apiScript.addEventListener("error", () => {
    console.error("Unable to load the TripMate account API client.");
  }, { once: true });
  document.head.appendChild(apiScript);
})();