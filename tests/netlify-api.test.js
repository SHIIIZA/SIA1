import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../netlify/functions/api.js";

test("Netlify handler decodes and routes a base64 webhook JSON body", async () => {
    const body = JSON.stringify({
        data: {
            type: "unhandled.test.event",
            livemode: false
        }
    });
    const response = await handler({
        httpMethod: "POST",
        path: "/api/webhooks/paymongo",
        headers: { "content-type": "application/json" },
        body: Buffer.from(body).toString("base64"),
        isBase64Encoded: true
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { received: true, ignored: true });
});
