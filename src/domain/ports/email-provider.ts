import { EmailMessage, SendResult } from '../models/email';

export interface IEmailProvider {
  send(accessToken: string, message: EmailMessage): Promise<SendResult>;
}
