import { Injectable, Logger } from '@nestjs/common';

/**
 * Email delivery abstraction for invites + password resets (PROJECT_MAP.md §1).
 *
 * No SMTP/API provider is configured yet — that requires credentials only the
 * client can supply (a provider account, sender domain verification, etc.), so
 * for now this logs the would-be email. Swap the body of `send()` for a real
 * provider (e.g. SES, SendGrid, Postmark) once credentials are available; every
 * caller in the codebase already goes through this single service.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.warn(
      `[MailerService] لا يوجد مزوّد بريد إلكتروني حقيقي مُهيّأ بعد — تم تسجيل الرسالة بدل إرسالها فعليًا.\n` +
        `إلى: ${to}\nالموضوع: ${subject}\nالمحتوى:\n${body}`,
    );
  }
}
