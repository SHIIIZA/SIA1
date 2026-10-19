(() => {
    const isAndroidWebView = /;\s*wv\)/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true;
    if (!isStandalone || isAndroidWebView) return;

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
