import test from "node:test";
import assert from "node:assert/strict";
import { findVerifiedPaidCheckoutPayment } from "./server.js";

function createWebhookFixture() {
    const event = {
        type: "checkout_session.payment.paid",
        livemode: false,
        data: { id: "cs_test_123" }
    };
    const providerSession = {
        data: {
            id: "cs_test_123",
            attributes: {
                livemode: false,
                metadata: { booking_id: "42" },
                payments: [{
                    id: "pay_test_123",
                    attributes: { status: "paid", amount: 1200, currency: "PHP" }
                }]
            }
        }
    };
    const payment = { booking_id: 42, amount: 12 };
    return { event, providerSession, payment };
}

test("accepts a provider-verified paid checkout session matching the booking", () => {
    const { event, providerSession, payment } = createWebhookFixture();
    assert.equal(
        findVerifiedPaidCheckoutPayment(event, providerSession, payment)?.id,
        "pay_test_123"
    );
});

test("rejects a checkout session or mode that does not match the webhook", () => {
    const { event, providerSession, payment } = createWebhookFixture();
    providerSession.data.id = "cs_test_other";
    assert.equal(findVerifiedPaidCheckoutPayment(event, providerSession, payment), null);

    providerSession.data.id = event.data.id;
    providerSession.data.attributes.livemode = true;
    assert.equal(findVerifiedPaidCheckoutPayment(event, providerSession, payment), null);
});

test("rejects a payment with a different booking, status, amount, or currency", () => {
    for (const alter of [
        ({ attributes }) => { attributes.metadata = { booking_id: "43" }; },
        ({ attributes }) => { attributes.payments[0].attributes.status = "pending"; },
        ({ attributes }) => { attributes.payments[0].attributes.amount = 1201; },
        ({ attributes }) => { attributes.payments[0].attributes.currency = "USD"; }
    ]) {
        const { event, providerSession, payment } = createWebhookFixture();
        alter(providerSession.data);
        assert.equal(findVerifiedPaidCheckoutPayment(event, providerSession, payment), null);
    }
});

test("rejects webhook event types other than the paid checkout event", () => {
    const { event, providerSession, payment } = createWebhookFixture();
    event.type = "checkout_session.payment.failed";
    assert.equal(findVerifiedPaidCheckoutPayment(event, providerSession, payment), null);
});
