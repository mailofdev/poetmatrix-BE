import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(email: string, url: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.log('Password reset email skipped; SMTP is not configured');
      if (this.config.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Password reset link: ${url}`);
      }
      return;
    }
    const port = this.config.get<number>('SMTP_PORT') ?? 587;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
    });
    await transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM') ?? 'PoetMatrix <noreply@poetmatrix.local>',
      to: email,
      subject: 'Reset your PoetMatrix password',
      text: `Use this link to choose a new password: ${url}`,
    });
  }
}
