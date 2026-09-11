/* TripMate — shared auth helpers (front-end demo, no real backend).
   Canonical schema, used by login/signup/forgot-password and every
   logged-in page (dashboard, host/dashboard, profile, wishlist, property):

   localStorage:
     tripmate_users    -> array of { id, name, email, password, type, businessName?, phone? }
     tripmate_user     -> currently logged-in user object (password stripped)
     tripmate_session  -> "true" while logged in (JSON-parseable AND truthy as a raw string)
*/

const USERS_KEY = "tripmate_users";
const USER_KEY = "tripmate_user";
const SESSION_KEY = "tripmate_session";

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  return getUsers().find(u => (u.email || "").toLowerCase() === normalized) || null;
}

function findUserById(id) {
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}

function generateId() {
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createUser({ name, email, password, type, businessName }) {
  const users = getUsers();
  const user = {
    id: generateId(),
    name,
    email: email.trim(),
    password,
    type,
    businessName: businessName || "",
    phone: "",
  };
  users.push(user);
  saveUsers(users);
  return user;
}

/* Logs a user in: stores the session flag + a password-stripped copy
   of the user record that dashboard/profile/wishlist/property pages read. */
function loginUser(user) {
  const { password, ...safeUser } = user;
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  localStorage.setItem(SESSION_KEY, JSON.stringify(true));
}

function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
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

/* Persists a partial update (e.g. from the profile page) to both the
   master users array and, if it's the currently-logged-in user, the
   mirrored session copy. Returns the updated (password-stripped) user,
   or null if no user with that id exists. */
function updateUser(id, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  // Never let a partial update silently wipe or leak the password field
  // through a generic form submit.
  const { password, id: _ignoredId, ...safeUpdates } = updates || {};
  users[index] = { ...users[index], ...safeUpdates };
  saveUsers(users);

  const current = getCurrentUser();
  if (current && current.id === id) {
    const { password: _pw, ...safeUser } = users[index];
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  }

  const { password: _pw2, ...result } = users[index];
  return result;
}

/* Changes a user's password given their current password (used from the
   logged-in profile page). Returns { ok: true } or { ok: false, error }. */
function changePassword(id, currentPassword, newPassword) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { ok: false, error: "User not found." };
  if (users[index].password !== currentPassword) {
    return { ok: false, error: "Current password is incorrect." };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  users[index] = { ...users[index], password: newPassword };
  saveUsers(users);
  return { ok: true };
}

/* Resets a user's password directly by email (used from the
   forgot-password page, standing in for an emailed-link flow in this
   front-end-only demo). Returns { ok: true } or { ok: false, error }. */
function resetPassword(email, newPassword) {
  const user = findUser(email);
  if (!user) return { ok: false, error: "No account found with that email." };
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  users[index] = { ...users[index], password: newPassword };
  saveUsers(users);
  return { ok: true };
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