import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const bootstrap = await readFile(new URL("../mobile-app/www/js/mobile-bootstrap.js", import.meta.url), "utf8");
const mobileStyles = await readFile(new URL("../mobile-app/www/css/mobile-native.css", import.meta.url), "utf8");

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
        documentElement: { classList: { add() {}, toggle() {} } },
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

test("native pages do not receive a blanket top inset", () => {
    assert.match(mobileStyles, /html\.tripmate-native body\{[^}]*padding-top:0;/);
    assert.match(mobileStyles, /html\.tripmate-native\.tripmate-homepage body \.hero>nav\{padding-top:max\(40px/);
    assert.match(mobileStyles, /html\.tripmate-native\.tripmate-native-webview body \.hero>nav\{padding-top:max\(40px/);
    assert.match(mobileStyles, /body :is\(\.dashboard-nav,\.top-nav,\.host-nav\)\{padding-top:max\(40px/);
    assert.match(mobileStyles, /body\.booking-page \.booking-nav-wrap nav\{padding-top:max\(40px/);
});

test("native stays and booking pages reduce excess vertical whitespace", () => {
    assert.match(mobileStyles, /body\.stays-page \.stays-hero-body\{padding-bottom:24px\}/);
    assert.match(mobileStyles, /body\.stays-page \.stays-main\{padding-top:16px;padding-bottom:max\(24px/);
    assert.match(mobileStyles, /body\.booking-page \.booking-main\{padding-top:24px;padding-bottom:max\(32px/);
    assert.match(mobileStyles, /body :is\(\.dashboard-main,\.property-main\)\{padding-bottom:max\(24px/);
});
