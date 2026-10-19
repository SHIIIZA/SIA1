import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const bootstrap = await readFile(new URL("../mobile-app/www/js/mobile-bootstrap.js", import.meta.url), "utf8");

function runBootstrap(location, userAgent = "Mozilla/5.0") {
    let pushedStates = 0;
    let replacedStates = 0;
    const listeners = [];
    const history = {
        length: 1,
        state: null,
        replaceState() { replacedStates += 1; },
        pushState() { pushedStates += 1; }
    };
    const window = {
        TRIPMATE_API_BASE: undefined,
        history,
        location: { ...location, href: `${location.origin}/homepage.html` },
        addEventListener() {}
    };
    const document = {
        documentElement: { classList: { add() {} } },
        addEventListener(_event, listener) { listeners.push(listener); }
    };

    vm.runInNewContext(bootstrap, {
        window,
        document,
        navigator: { userAgent },
        URL,
        Date,
        Math,
        Element: class Element {}
    });
    return { pushedStates, replacedStates, listeners };
}

test("native Capacitor origin does not add the PWA back-history sentinel", () => {
    const result = runBootstrap({ protocol: "https:", hostname: "localhost", origin: "https://localhost" });
    assert.equal(result.pushedStates, 0);
    assert.equal(result.replacedStates, 0);
});

test("standalone web app still initializes its browser back-history sentinel", () => {
    const result = runBootstrap({ protocol: "https:", hostname: "trypmate.netlify.app", origin: "https://trypmate.netlify.app" });
    assert.equal(result.pushedStates, 1);
    assert.equal(result.replacedStates, 1);
});
