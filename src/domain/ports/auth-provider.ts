import { UserTokens, UserProfile } from "../models/user";

export interface IAuthProvider {
  getAuthUrl(): string;
  exchangeCodeForTokens(code: string): Promise<UserTokens>;
  refreshAccessToken(refreshToken: string): Promise<UserTokens>;
  getUserProfile(accessToken: string): Promise<UserProfile>;
}
