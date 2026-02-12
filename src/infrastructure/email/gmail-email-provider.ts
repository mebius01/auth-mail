import { google } from 'googleapis';
import { IEmailProvider } from '../../domain/ports/email-provider';
import { EmailMessage, SendResult } from '../../domain/models/email';

export class GmailEmailProvider implements IEmailProvider {
  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {}

  async send(accessToken: string, message: EmailMessage): Promise<SendResult> {
    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret);
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const rawMessage = this.buildRawMessage(message);

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      return {
        success: true,
        messageId: response.data.id ?? undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message ?? 'Unknown error sending email',
      };
    }
  }

  private buildRawMessage(message: EmailMessage): string {
    const emailLines = [
      `From: ${message.from}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message.body,
    ];

    const email = emailLines.join('\r\n');

    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
