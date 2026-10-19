window.TRIPMATE_API_BASE = "https://trypmate.netlify.app/api";
document.documentElement.classList.add("tripmate-native");

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
