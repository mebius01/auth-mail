import { IEmailProvider } from '../domain/ports/email-provider';
import { IUserRepository } from '../domain/ports/user-repository';
import { EmailMessage, SendResult } from '../domain/models/email';
import { AuthService } from './auth-service';

export class EmailService {
  constructor(
    private emailProvider: IEmailProvider,
    private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async send(to: string, subject: string, body: string): Promise<SendResult> {
    const activeUser = await this.userRepository.getActiveUser();
    if (!activeUser) {
      throw new Error('No active user. Please authenticate first with: auth <email>');
    }

    const accessToken = await this.authService.ensureValidToken(activeUser.email);

    const message: EmailMessage = {
      from: activeUser.email,
      to,
      subject,
      body,
    };

    return this.emailProvider.send(accessToken, message);
  }
}
