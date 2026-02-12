import { IAuthProvider } from '../domain/ports/auth-provider';
import { IAuthCallbackServer } from '../domain/ports/auth-callback-server';
import { IUserRepository } from '../domain/ports/user-repository';
import { User } from '../domain/models/user';

export class AuthService {
  constructor(
    private authProvider: IAuthProvider,
    private callbackServer: IAuthCallbackServer,
    private userRepository: IUserRepository,
    private callbackPort: number,
  ) {}

  async authenticate(email: string): Promise<User> {
    const authUrl = this.authProvider.getAuthUrl(email);

    console.log('\n🔗 Open this URL in your browser to authorize:\n');
    console.log(authUrl);
    console.log('\n⏳ Waiting for authorization...\n');

    await this.callbackServer.start(this.callbackPort);

    try {
      const code = await this.callbackServer.waitForCode();

      console.log('✅ Authorization code received. Exchanging for tokens...\n');

      const tokens = await this.authProvider.exchangeCodeForTokens(code);
      const profile = await this.authProvider.getUserProfile(tokens.accessToken);

      const user: User = {
        email: profile.email,
        profile,
        tokens,
      };

      await this.userRepository.save(user);
      await this.userRepository.setActiveUser(user.email);

      return user;
    } finally {
      await this.callbackServer.stop();
    }
  }

  async ensureValidToken(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error(`User not found: ${email}. Please authenticate first.`);
    }

    const now = Date.now();
    const bufferMs = 60 * 1000;

    if (user.tokens.expiresAt - bufferMs > now) {
      return user.tokens.accessToken;
    }

    console.log('🔄 Access token expired, refreshing...');
    const newTokens = await this.authProvider.refreshAccessToken(user.tokens.refreshToken);
    await this.userRepository.updateTokens(email, newTokens);

    return newTokens.accessToken;
  }
}
