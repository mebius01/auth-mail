import { loadConfig } from './config/config';
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user-repository';
import { GoogleAuthProvider } from './infrastructure/auth/google-auth-provider';
import { GmailEmailProvider } from './infrastructure/email/gmail-email-provider';
import { ExpressCallbackServer } from './infrastructure/server/express-callback-server';
import { AuthService } from './application/auth-service';
import { EmailService } from './application/email-service';
import { CliHandler } from './cli/cli-handler';

async function main(): Promise<void> {
  const config = loadConfig();

  // Infrastructure (easily swappable implementations)
  const userRepository = new InMemoryUserRepository();
  const authProvider = new GoogleAuthProvider(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri,
  );
  const emailProvider = new GmailEmailProvider(
    config.google.clientId,
    config.google.clientSecret,
  );
  const callbackServer = new ExpressCallbackServer();

  // Application services
  const authService = new AuthService(
    authProvider,
    callbackServer,
    userRepository,
    config.server.callbackPort,
  );
  const emailService = new EmailService(
    emailProvider,
    userRepository,
    authService,
  );

  // CLI
  const cli = new CliHandler(authService, emailService);
  await cli.start();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
