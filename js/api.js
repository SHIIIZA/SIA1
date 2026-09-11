const TRIPMATE_TOKEN_KEY = "tripmate_access_token";
// Set window.TRIPMATE_API_BASE before this script when the API is deployed separately.
const TRIPMATE_API_BASE = window.TRIPMATE_API_BASE || "/api";

async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = localStorage.getItem(TRIPMATE_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${TRIPMATE_API_BASE}${path}`, { ...options, headers });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
    if (!response.ok) {
        const isHTML = /^\s*<!doctype html|^\s*<html/i.test(text);
        throw new Error(isHTML
            ? `API server unavailable (${response.status}). Deploy the Render API and check the Netlify API proxy URL.`
            : data?.error || data?.message || "Request failed");
    }
    return data;
}

async function apiRegister(payload) {
    const result = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    if (!result?.token || !result?.user) throw new Error("The API returned an incomplete registration response.");
    localStorage.setItem(TRIPMATE_TOKEN_KEY, result.token);
    localStorage.setItem("tripmate_user", JSON.stringify(result.user));
    return result.user;
}

async function apiLogin(payload) {
    const result = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify(payload) });
    if (!result?.token || !result?.user) throw new Error("The API returned an incomplete login response.");
    localStorage.setItem(TRIPMATE_TOKEN_KEY, result.token);
    localStorage.setItem("tripmate_user", JSON.stringify(result.user));
    localStorage.setItem("tripmate_session", "true");
    return result.user;
}

function apiLogout() {
    localStorage.removeItem(TRIPMATE_TOKEN_KEY);
    localStorage.removeItem("tripmate_user");
    localStorage.removeItem("tripmate_session");
}
