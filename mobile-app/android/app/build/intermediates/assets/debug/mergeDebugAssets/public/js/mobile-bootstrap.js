window.TRIPMATE_API_BASE = "https://trypmate.netlify.app/api";
document.documentElement.classList.add("tripmate-native");
if (/\/(?:|index|homepage)\.html$/i.test(window.location.pathname)) {
    document.documentElement.classList.add("tripmate-homepage");
}

const isNativeWebView = /;\s*wv\)/i.test(navigator.userAgent) ||
    (window.location.protocol === "https:" && window.location.hostname === "localhost") ||
    window.location.protocol === "capacitor:";
document.documentElement.classList.toggle("tripmate-native-webview", isNativeWebView);

if (!isNativeWebView) {
(() => {
    const history = window.history;
    const hadPreviousEntry = history.length > 1;
    const backEntryId = `tripmate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const withBackEntry = (state) => ({
        ...(state && typeof state === "object" ? state : {}),
        __tripmateBackEntryId: backEntryId
    });
    const replaceState = history.replaceState.bind(history);

    history.replaceState = (state, title, url) =>
        replaceState(withBackEntry(state), title, url);

    replaceState(withBackEntry(history.state), "", window.location.href);
    history.pushState({
        __tripmateBackEntryId: backEntryId,
        __tripmateBackSentinel: true
    }, "", window.location.href);

    window.addEventListener("popstate", (event) => {
        if (event.state?.__tripmateBackEntryId !== backEntryId) return;
        if (hadPreviousEntry) history.back();
    });
})();
}

document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const target = event.target instanceof Element ? event.target.closest("a.back-link") : null;
    if (!target || !document.referrer) {
        return;
    }

    const previousPage = new URL(document.referrer, window.location.href);
    if (previousPage.origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
    }
});
