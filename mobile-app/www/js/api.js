const TRIPMATE_TOKEN_KEY = "tripmate_access_token";
// Set window.TRIPMATE_API_BASE before this script when the API is deployed separately.
const TRIPMATE_API_BASE = window.TRIPMATE_API_BASE || "/api";

async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = localStorage.getItem(TRIPMATE_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
        response = await fetch(`${TRIPMATE_API_BASE}${path}`, { ...options, headers, signal: controller.signal });
    } catch (error) {
        if (error.name === "AbortError") throw new Error("API request timed out. Check the Netlify Function and Neon configuration.");
        throw error;
    } finally {
        clearTimeout(timeout);
    }
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
    if (!response.ok) {
        const isHTML = /^\s*<!doctype html|^\s*<html/i.test(text);
        const error = new Error(isHTML
            ? `API service unavailable (${response.status}). Check the Netlify Function deployment and API environment variables.`
            : data?.error || data?.message || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
}

function saveApiUser(user) {
    if (!user || !user.id) throw new Error("The API returned an incomplete user response.");
    localStorage.setItem("tripmate_user", JSON.stringify(user));
    localStorage.setItem("tripmate_session", "true");
    window.dispatchEvent(new CustomEvent("tripmate-user-updated", { detail: user }));
    return user;
}

async function apiRegister(payload) {
    const health = await apiRequest("/health");
    if (!health?.databaseConfigured) {
        throw new Error(health?.databaseError || "Backend database is not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL on the server.");
    }
    const result = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    if (!result?.token || !result?.user) throw new Error("The API returned an incomplete registration response.");
    localStorage.setItem(TRIPMATE_TOKEN_KEY, result.token);
    return saveApiUser(result.user);
}

async function apiLogin(payload) {
    const result = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify(payload) });
    if (!result?.token || !result?.user) throw new Error("The API returned an incomplete login response.");
    localStorage.setItem(TRIPMATE_TOKEN_KEY, result.token);
    return saveApiUser(result.user);
}

async function apiGetCurrentUser() {
    const result = await apiRequest("/me");
    return saveApiUser(result?.user);
}

async function apiUpdateProfile(updates) {
    const result = await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify(updates)
    });
    return saveApiUser(result?.user);
}

async function apiChangePassword(currentPassword, newPassword) {
    return apiRequest("/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword })
    });
}

async function apiGetNotificationPreferences() {
    const result = await apiRequest("/notifications/preferences");
    return result?.preferences || {};
}

async function apiSaveNotificationPreferences(preferences) {
    return apiRequest("/notifications/preferences", {
        method: "POST",
        body: JSON.stringify({ preferences })
    });
}

async function apiDeleteAccount(password) {
    await apiRequest("/me", {
        method: "DELETE",
        body: JSON.stringify({ password })
    });
    apiLogout();
}

function apiLogout() {
    localStorage.removeItem(TRIPMATE_TOKEN_KEY);
    localStorage.removeItem("tripmate_user");
    localStorage.removeItem("tripmate_session");
    window.dispatchEvent(new CustomEvent("tripmate-user-updated", { detail: null }));
}

// Share the notification inbox across signed-in pages, including mobile pages.
const notificationScriptUrl = new URL('notifications.js', document.currentScript.src).href;
const loadNotificationInbox = () => {
    if (!localStorage.getItem(TRIPMATE_TOKEN_KEY) || document.querySelector('script[data-notification-inbox]')) return;
    const script = document.createElement('script');
    script.src = notificationScriptUrl;
    script.dataset.notificationInbox = 'true';
    document.body.append(script);
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadNotificationInbox);
else loadNotificationInbox();
