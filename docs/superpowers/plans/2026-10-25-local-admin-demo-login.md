# Local Admin Demo Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing browser-local admin demo reachable from the login page on localhost without accessing or changing Neon.

**Architecture:** Add a browser-only demo sign-in helper to the shared auth script and a localhost-gated entry point to the login page. Reuse the existing `local-demo-admin` token behavior in `js/admin.js`, which skips backend hydration and keeps admin demo data in localStorage; do not add a server endpoint or modify database authentication.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner (`node:test`), `vm` for isolated auth-helper tests.

---

## File map

- `js/auth.js` — identify loopback hostnames, create the browser-local admin session, and preserve that session during auth refresh.
- `login.html` — expose and handle a clearly labeled demo entry only on loopback hostnames.
- `css/login.css` — style the demo entry consistently with the existing login card.
- `tests/ui-regressions.test.js` — test host gating, session storage, persistence, and login-page wiring.
- `README.md` — document the demo login and its database/API limitations.

Do not modify `server.js`, Netlify functions, `.env`, Neon, or generated Android copies. The demo is intentionally browser-local and is not an actual privileged account.

### Task 1: Add failing regression tests for local demo authentication

**Files:**
- Modify: `tests/ui-regressions.test.js`
- Test: `tests/ui-regressions.test.js`

- [ ] **Step 1: Add a VM helper for running the shared auth script**

Add this helper after the existing top-level file reads:

```js
function runAuth(hostname, initialStorage = {}) {
    const values = new Map(Object.entries(initialStorage));
    const events = [];
    class TestCustomEvent {
        constructor(type, init) {
            this.type = type;
            this.detail = init?.detail;
        }
    }
    const localStorage = {
        getItem(key) { return values.get(key) ?? null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
    const context = {
        URL,
        CustomEvent: TestCustomEvent,
        localStorage,
        window: {
            location: { hostname, origin: `http://${hostname}` },
            dispatchEvent(event) { events.push(event); },
            addEventListener() {}
        },
        document: {
            visibilityState: "visible",
            addEventListener() {},
            head: { appendChild() {} }
        },
        console: { error() {} }
    };
    vm.runInNewContext(authScript, context);
    return { context, values, events };
}
```

- [ ] **Step 2: Add tests for loopback detection and session creation**

Add:

```js
test("local demo admin is restricted to loopback hostnames", () => {
    assert.equal(runAuth("localhost").context.isLocalDemoHost(), true);
    assert.equal(runAuth("127.0.0.1").context.isLocalDemoHost(), true);
    assert.equal(runAuth("tripmate.example").context.isLocalDemoHost(), false);
});

test("local demo login creates a browser-only admin session", () => {
    const { context, values, events } = runAuth("127.0.0.1");
    const user = context.loginLocalDemoAdmin();

    assert.equal(user.role, "admin");
    assert.equal(values.get("tripmate_access_token"), "local-demo-admin");
    assert.equal(values.get("tripmate_session"), "true");
    assert.equal(JSON.parse(values.get("tripmate_user")).role, "admin");
    assert.equal(events.at(-1).type, "tripmate-user-updated");
});

test("local demo auth preserves its session on loopback and clears it remotely", () => {
    const initial = {
        tripmate_access_token: "local-demo-admin",
        tripmate_session: "true",
        tripmate_user: JSON.stringify({ id: "local-demo-admin", role: "admin" })
    };
    const local = runAuth("localhost", initial);
    assert.equal(local.values.get("tripmate_access_token"), "local-demo-admin");
    assert.equal(local.values.get("tripmate_session"), "true");

    const remote = runAuth("tripmate.example", initial);
    assert.equal(remote.values.has("tripmate_access_token"), false);
    assert.equal(remote.values.has("tripmate_session"), false);
    assert.equal(remote.values.has("tripmate_user"), false);
});
```

- [ ] **Step 3: Add a regression check for login-page wiring**

Add:

```js
test("login page exposes local demo admin only through its loopback-gated action", () => {
    assert.match(loginPage, /id="local-demo-admin"[^>]*hidden/);
    assert.match(loginPage, /if\s*\(isLocalDemoHost\(\)\)/);
    assert.match(loginPage, /loginLocalDemoAdmin\(\)/);
    assert.match(loginPage, /window\.location\.href\s*=\s*["']admin\.html["']/);
});
```

First read `loginPage` from `../login.html` alongside the existing page reads:

```js
const loginPage = await readFile(new URL("../login.html", import.meta.url), "utf8");
```

- [ ] **Step 4: Run the focused test and verify it fails for the missing feature**

Run: `node --test tests/ui-regressions.test.js`

Expected: the new tests fail because `isLocalDemoHost`, `loginLocalDemoAdmin`, and the login-page demo entry do not exist yet; existing unrelated regression tests retain their current results.

### Task 2: Implement the loopback-only browser demo sign-in

**Files:**
- Modify: `js/auth.js`
- Modify: `login.html`
- Modify: `css/login.css`
- Test: `tests/ui-regressions.test.js`

- [ ] **Step 1: Add shared loopback and session helpers to `js/auth.js`**

Place these functions after the `USER_KEY` and `SESSION_KEY` constants:

```js
const LOCAL_DEMO_TOKEN = "local-demo-admin";
const ACCESS_TOKEN_KEY = "tripmate_access_token";

function isLocalDemoHost() {
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
}

function loginLocalDemoAdmin() {
  if (!isLocalDemoHost()) {
    throw new Error("Local demo admin is only available on localhost.");
  }

  const user = {
    id: LOCAL_DEMO_TOKEN,
    name: "Local Demo Admin",
    email: "admin@localhost",
    role: "admin"
  };
  localStorage.setItem(ACCESS_TOKEN_KEY, LOCAL_DEMO_TOKEN);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, "true");
  window.dispatchEvent(new CustomEvent("tripmate-user-updated", { detail: user }));
  return user;
}
```

- [ ] **Step 2: Preserve the demo session only on loopback hosts**

In `syncAccountFromApi()`, replace the current unconditional `logoutUser()` handling for `local-demo-admin` with:

```js
  if (token === LOCAL_DEMO_TOKEN) {
    if (isLocalDemoHost()) return;
    logoutUser();
    return;
  }
```

Leave normal token refresh and error behavior unchanged.

- [ ] **Step 3: Add a hidden demo button to `login.html`**

Place this button immediately after the login form and before `.foot-link`:

```html
<button type="button" class="local-demo-button" id="local-demo-admin" hidden>
  Enter local demo admin
</button>
```

In the existing inline login script, after retrieving `submitBtn`, wire the button:

```js
    const localDemoButton = document.getElementById("local-demo-admin");
    if (isLocalDemoHost()) {
      localDemoButton.hidden = false;
      localDemoButton.addEventListener("click", () => {
        try {
          loginLocalDemoAdmin();
          window.location.href = "admin.html";
        } catch (error) {
          showToast(error.message || "Unable to start local admin demo.", true);
        }
      });
    }
```

The normal form submission path remains unchanged and continues to use `apiLogin`.

- [ ] **Step 4: Style the demo button in `css/login.css`**

Add:

```css
.local-demo-button {
  width: 100%;
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  background: rgba(6, 43, 39, 0.42);
  color: var(--cream);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.local-demo-button:hover { background: rgba(6, 43, 39, 0.62); }
.local-demo-button:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
.local-demo-button[hidden] { display: none; }
```

- [ ] **Step 5: Run the focused test and verify the new tests pass**

Run: `node --test tests/ui-regressions.test.js`

Expected: the local demo host, session, persistence, and login wiring tests pass. If an existing unrelated UI regression fails, confirm it is the pre-existing PWA metadata assertion before attributing it to this feature.

### Task 3: Document the demo boundary and verify the browser flow

**Files:**
- Modify: `README.md`
- Test: `tests/ui-regressions.test.js`
- Test: local browser at `http://127.0.0.1:3000/login.html`

- [ ] **Step 1: Document local demo access in `README.md`**

In the local development section, add:

```markdown
For a browser-local admin UI demo without Neon, open the login page on
`http://localhost` or `http://127.0.0.1` and choose **Enter local demo admin**.
This session is stored only in that browser and does not create an account or
change Neon. Listings, bookings, account management, and other database-backed
features require the regular Neon setup above. The demo entry is unavailable
on deployed or other remote hosts.
```

- [ ] **Step 2: Run the focused validation**

Run: `node --test tests/ui-regressions.test.js`

Expected: all newly added local-demo tests pass; record any pre-existing PWA metadata failure separately.

- [ ] **Step 3: Verify the actual local login and admin UI**

Open `http://127.0.0.1:3000/login.html`, confirm the demo button is present, select it, and verify `admin.html` opens with the local demo admin identity. Confirm admin settings/content remain browser-local and that unavailable database-backed views do not become successful-looking data.

- [ ] **Step 4: Verify remote-host gating and unchanged API login**

Run the host-gating test for a non-loopback hostname and verify the demo button remains hidden there. Confirm the existing login form still calls `apiLogin` and still reports its API error when the API is unavailable.

- [ ] **Step 5: Commit the implementation**

```bash
git add js/auth.js login.html css/login.css tests/ui-regressions.test.js README.md
git commit -m "feat: enable localhost admin demo login" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
