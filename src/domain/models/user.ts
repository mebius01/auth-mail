export interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfile {
  email: string;
  name?: string;
}

export interface User {
  email: string;
  profile: UserProfile;
  tokens: UserTokens;
}
