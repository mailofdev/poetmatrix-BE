import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { Role } from '../users/role.js';
import { BillingService } from './billing.service.js';

class CheckoutDto {
  @ApiProperty({ enum: ['basic', 'pro'] })
  @IsIn(['basic', 'pro'])
  plan: 'basic' | 'pro';
}

class VerifyDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  orderId: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  paymentId: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  signature: string;
}

class WebhookDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  plan: string;
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.billing.plans();
  }

  @ApiBearerAuth()
  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.billing.status(user.id);
  }

  @ApiBearerAuth()
  @Post('checkout')
  @Roles(Role.Writer)
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.billing.checkout(user, dto.plan);
  }

  @ApiBearerAuth()
  @Post('verify')
  @Roles(Role.Writer)
  verify(@CurrentUser() user: AuthUser, @Body() dto: VerifyDto) {
    return this.billing.verify(user, dto);
  }

  @Public()
  @Post('webhook')
  webhook(
    @Headers('x-poetmatrix-webhook-secret') secret: string | undefined,
    @Body() dto: WebhookDto,
  ) {
    return this.billing.webhook(secret, dto);
  }
}
