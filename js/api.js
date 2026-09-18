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
        throw new Error(isHTML
            ? `API service unavailable (${response.status}). Check the Netlify Function deployment and API environment variables.`
            : data?.error || data?.message || `Request failed (${response.status})`);
    }
    return data;
}

async function apiRegister(payload) {
    const health = await apiRequest("/health");
    if (!health?.databaseConfigured) {
        throw new Error("Backend database is not configured. Set NEON_API_URL and NEON_API_KEY on the server.");
    }
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
