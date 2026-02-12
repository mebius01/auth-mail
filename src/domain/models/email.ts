export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
