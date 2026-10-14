import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { resolveActor, Plan } from '../users/account-rules.js';
import { UsersService } from '../users/users.service.js';
import { assessPayment, PLAN_PRICE_PAISE, priceForPlan } from './billing-rules.js';
import { PaymentIntent } from './payment-intent.entity.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(PaymentIntent)
    private readonly intents: Repository<PaymentIntent>,
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly activity: ActivityService,
  ) {}

  plans() {
    return [
      { plan: 'free', pricePaise: 0, priceLabel: '₹0', cap: 5, visibility: 'public' },
      { plan: 'basic', pricePaise: PLAN_PRICE_PAISE.basic, priceLabel: '₹199', cap: 50, visibility: 'public' },
      { plan: 'pro', pricePaise: PLAN_PRICE_PAISE.pro, priceLabel: '₹999', cap: null, visibility: 'public' },
    ];
  }

  async status(userId: string) {
    const user = await this.users.findById(userId);
    return { plan: user?.plan ?? Plan.Free, writer: Boolean(user?.writerSubscription) };
  }

  async checkout(actor: AuthUser, plan: 'basic' | 'pro') {
    if (resolveActor(actor) !== 'writer') {
      throw new ForbiddenException('Checkout is for writers');
    }
    const amount = priceForPlan(plan);
    if (!amount) {
      throw new BadRequestException('Choose a paid plan');
    }
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: randomUUID(),
      }),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not start checkout');
    }
    const order = (await response.json()) as { id: string; amount: number };
    if (order.amount !== amount) {
      throw new ServiceUnavailableException('Checkout amount was rejected');
    }
    await this.intents.save(
      this.intents.create({
        userId: actor.id,
        plan,
        amount,
        orderId: order.id,
        paymentId: null,
        status: 'pending',
      }),
    );
    return { orderId: order.id, amount, currency: 'INR', keyId, plan };
  }

  async verify(
    actor: AuthUser,
    input: { orderId: string; paymentId: string; signature: string },
  ) {
    const intent = await this.intents.findOne({ where: { orderId: input.orderId } });
    if (!intent) {
      throw new BadRequestException('Payment could not be verified');
    }
    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    const payment = await this.fetchPayment(input.paymentId, secret);
    const expected = priceForPlan(intent.plan) ?? intent.amount;
    const decision = assessPayment({
      intentUserId: intent.userId,
      actorId: actor.id,
      intentAmount: intent.amount,
      expectedAmount: expected,
      intentStatus: intent.status,
      paymentStatus: payment.status,
      paymentId: input.paymentId,
      storedPaymentId: intent.paymentId,
      orderId: input.orderId,
      signature: input.signature,
      secret,
    });
    if (!decision.ok) {
      throw new BadRequestException('Payment could not be verified');
    }
    if (!decision.replay) {
      intent.paymentId = input.paymentId;
      intent.status = 'captured';
      await this.intents.save(intent);
      await this.users.applyPaidPlan(
        actor.id,
        intent.plan === 'pro' ? Plan.Pro : Plan.Basic,
      );
      await this.activity.record(actor.id, 'plan_purchase', 'user', actor.id);
    }
    return { ok: true, plan: intent.plan };
  }

  async webhook(secretHeader: string | undefined, body: { type?: string; userId?: string; plan?: string }) {
    const secret = this.config.get<string>('PLAN_WEBHOOK_SECRET');
    if (!secret || !secretHeader || !this.secretMatches(secret, secretHeader)) {
      throw new ForbiddenException('Webhook was rejected');
    }
    if (body.type !== 'writer_plan_updated' || !body.userId || !body.plan) {
      throw new BadRequestException('Webhook payload was rejected');
    }
    const plan = body.plan === Plan.Pro ? Plan.Pro : body.plan === Plan.Basic ? Plan.Basic : Plan.Free;
    await this.users.applyPaidPlan(body.userId, plan);
    return { ok: true };
  }

  private async fetchPayment(paymentId: string, secret: string) {
    const keyId = this.config.getOrThrow<string>('RAZORPAY_KEY_ID');
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
        },
      },
    );
    if (!response.ok) {
      throw new BadRequestException('Payment could not be verified');
    }
    const payload = (await response.json()) as { status?: string; amount?: number };
    if (payload.amount && payload.amount !== undefined) {
      return { status: payload.status ?? '' };
    }
    return { status: payload.status ?? '' };
  }

  private secretMatches(expected: string, received: string): boolean {
    const left = Buffer.from(expected);
    const right = Buffer.from(received);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }
}
