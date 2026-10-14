import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { assessPayment, PLAN_PRICE_PAISE } from './billing-rules.js';

describe('writer plan payments', () => {
  const secret = 'razorpay-secret';
  const orderId = 'order_1';
  const paymentId = 'pay_1';
  const signature = createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const base = {
    intentUserId: 'writer',
    actorId: 'writer',
    intentAmount: PLAN_PRICE_PAISE.basic,
    expectedAmount: PLAN_PRICE_PAISE.basic,
    intentStatus: 'pending',
    paymentStatus: 'captured',
    paymentId,
    storedPaymentId: null,
    orderId,
    signature,
    secret,
  };

  it('prices basic and pro on the server', () => {
    expect(PLAN_PRICE_PAISE.basic).toBe(19900);
    expect(PLAN_PRICE_PAISE.pro).toBe(99900);
  });

  it('rejects a bad signature, amount, owner, or status', () => {
    expect(assessPayment({ ...base, signature: 'nope' })).toMatchObject({
      ok: false,
      reason: 'signature',
    });
    expect(assessPayment({ ...base, intentAmount: 1 })).toMatchObject({
      ok: false,
      reason: 'amount',
    });
    expect(assessPayment({ ...base, actorId: 'other' })).toMatchObject({
      ok: false,
      reason: 'intent',
    });
    expect(assessPayment({ ...base, paymentStatus: 'failed' })).toMatchObject({
      ok: false,
      reason: 'status',
    });
  });

  it('accepts a captured payment and ignores a replay', () => {
    expect(assessPayment(base)).toEqual({ ok: true, replay: false });
    expect(
      assessPayment({
        ...base,
        signature: 'ignored',
        intentStatus: 'captured',
        storedPaymentId: paymentId,
      }),
    ).toEqual({ ok: true, replay: true });
  });
});
