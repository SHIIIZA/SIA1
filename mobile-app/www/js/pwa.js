(() => {
    const isNativeApp = window.location.protocol === "capacitor:" ||
        window.location.hostname === "localhost" && /;\s*wv\)/i.test(navigator.userAgent);
    if (!("serviceWorker" in navigator) || isNativeApp) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(error => {
            console.error("TripMate offline support could not be enabled:", error);
        });
    }, { once: true });
})();
