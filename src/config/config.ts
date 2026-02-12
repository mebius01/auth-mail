import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  server: {
    callbackPort: number;
  };
}

export function loadConfig(): AppConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const callbackPort = parseInt(process.env.CALLBACK_PORT ?? '3000', 10);

  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is required in .env');
  if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is required in .env');
  if (!redirectUri) throw new Error('GOOGLE_REDIRECT_URI is required in .env');

  return {
    google: {
      clientId,
      clientSecret,
      redirectUri,
    },
    server: {
      callbackPort,
    },
  };
}
