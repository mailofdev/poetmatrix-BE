import { createHmac, timingSafeEqual } from 'node:crypto';
import { Plan } from '../users/account-rules.js';

export const PLAN_PRICE_PAISE: Record<'basic' | 'pro', number> = {
  basic: 19_900,
  pro: 99_900,
};

export function priceForPlan(plan: string): number | null {
  if (plan === Plan.Basic) {
    return PLAN_PRICE_PAISE.basic;
  }
  if (plan === Plan.Pro) {
    return PLAN_PRICE_PAISE.pro;
  }
  return null;
}

export function razorpaySignature(
  orderId: string,
  paymentId: string,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function signaturesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export type PaymentCheck =
  | { ok: true; replay: boolean }
  | { ok: false; reason: string };

export function assessPayment(input: {
  intentUserId: string;
  actorId: string;
  intentAmount: number;
  expectedAmount: number;
  intentStatus: string;
  paymentStatus: string;
  paymentId: string;
  storedPaymentId: string | null;
  orderId: string;
  signature: string;
  secret: string;
}): PaymentCheck {
  if (input.intentUserId !== input.actorId) {
    return { ok: false, reason: 'intent' };
  }
  if (input.intentAmount !== input.expectedAmount) {
    return { ok: false, reason: 'amount' };
  }
  if (
    input.storedPaymentId &&
    input.storedPaymentId === input.paymentId &&
    input.intentStatus === 'captured'
  ) {
    return { ok: true, replay: true };
  }
  const expected = razorpaySignature(
    input.orderId,
    input.paymentId,
    input.secret,
  );
  if (!signaturesMatch(expected, input.signature)) {
    return { ok: false, reason: 'signature' };
  }
  if (
    input.paymentStatus !== 'captured' &&
    input.paymentStatus !== 'authorized'
  ) {
    return { ok: false, reason: 'status' };
  }
  return { ok: true, replay: false };
}
