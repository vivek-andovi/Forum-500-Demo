import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { env } from '../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Outgoing email. `log` prints messages to the console (development);
 * `ses` sends through Amazon SES using the task's IAM role.
 */
@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly cfg = env();
  private readonly ses = this.cfg.MAIL_DRIVER === 'ses' ? new SESClient({ region: this.cfg.AWS_REGION }) : null;

  async send(msg: MailMessage): Promise<void> {
    if (!this.ses) {
      this.log.log(`[mail:log] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
      return;
    }
    try {
      await this.ses.send(
        new SendEmailCommand({
          Source: this.cfg.MAIL_FROM,
          Destination: { ToAddresses: [msg.to] },
          Message: {
            Subject: { Data: msg.subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: msg.text, Charset: 'UTF-8' },
              ...(msg.html ? { Html: { Data: msg.html, Charset: 'UTF-8' } } : {}),
            },
          },
        }),
      );
    } catch (e) {
      // Never fail the user's request because email is down; log for follow-up.
      this.log.error(`SES send to ${msg.to} failed: ${(e as Error).message}`);
    }
  }

  private layout(title: string, paragraphs: string[], cta?: { label: string; url: string }) {
    const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${escape(p)}</p>`).join('');
    const button = cta
      ? `<p style="margin:24px 0"><a href="${escape(cta.url)}" style="background:#0f3d2e;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${escape(cta.label)}</a></p>`
      : '';
    return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1c2b25"><h1 style="font-weight:normal">${escape(title)}</h1>${body}${button}<p style="color:#6b7a73;font-size:12px">Forum500 — Making Ideas Happen</p></div>`;
  }

  sendInvite(to: string, name: string, link: string) {
    const lines = [`Dear ${name},`, 'Welcome to Forum500. Your membership has been approved.', 'Use the link below to set your password and sign in. The link expires in 7 days.'];
    return this.send({
      to,
      subject: 'Welcome to Forum500 — set up your account',
      text: `${lines.join('\n\n')}\n\n${link}`,
      html: this.layout('Welcome to Forum500', lines, { label: 'Set your password', url: link }),
    });
  }

  sendPasswordReset(to: string, link: string) {
    const lines = ['We received a request to reset your Forum500 password.', 'The link below expires in 1 hour. If you did not ask for this, you can ignore this email.'];
    return this.send({
      to,
      subject: 'Reset your Forum500 password',
      text: `${lines.join('\n\n')}\n\n${link}`,
      html: this.layout('Reset your password', lines, { label: 'Choose a new password', url: link }),
    });
  }

  sendApplicationDecision(to: string, name: string, status: 'rejected' | 'waitlisted', note?: string | null) {
    const lines = [
      `Dear ${name},`,
      status === 'waitlisted'
        ? 'Thank you for applying to Forum500. Your application has been placed on our waiting list and we will be in touch as places open.'
        : 'Thank you for applying to Forum500. After careful consideration we are unable to offer membership at this time.',
      ...(note ? [note] : []),
    ];
    return this.send({
      to,
      subject: 'Your Forum500 application',
      text: lines.join('\n\n'),
      html: this.layout('Your application', lines),
    });
  }
}
