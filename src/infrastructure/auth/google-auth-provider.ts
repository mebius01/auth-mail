import { google } from "googleapis";
import { IAuthProvider } from "../../domain/ports/auth-provider";
import { UserTokens, UserProfile } from "../../domain/models/user";

export class GoogleAuthProvider implements IAuthProvider {
  private oauth2Client;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    });
  }

  async exchangeCodeForTokens(code: string): Promise<UserTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to obtain tokens from Google");
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<UserTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: refreshToken,
      expiresAt: credentials.expiry_date ?? Date.now() + 3600 * 1000,
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new Error("Failed to get user profile from Google");
    }

    return {
      email: data.email,
      name: data.name ?? undefined,
    };
  }
}
