# auth-mail

OAuth2-driven console email client for seamless Gmail integration.

## Architecture

```
src/
├── domain/
│   ├── models/          # User, EmailMessage, SendResult
│   └── ports/           # Interfaces: IUserRepository, IAuthProvider, IEmailProvider, IAuthCallbackServer
├── infrastructure/
│   ├── auth/            # GoogleAuthProvider (OAuth2 via googleapis)
│   ├── email/           # GmailEmailProvider (Gmail API send)
│   ├── repositories/    # InMemoryUserRepository
│   └── server/          # ExpressCallbackServer (OAuth callback)
├── application/         # AuthService, EmailService
├── cli/                 # CliHandler (interactive console)
├── config/              # Environment config loader
└── main.ts              # Composition root (DI wiring)
```

**Design principles:** SOLID, GRASP, Dependency Inversion. All infrastructure is behind interfaces (`ports/`), making it trivial to swap Gmail for another provider or replace in-memory storage with a database.

## Prerequisites

1. **Node.js** ≥ 18
2. **ngrok** — to expose the local OAuth callback server over HTTPS
3. **Google Cloud project** with Gmail API enabled and OAuth 2.0 credentials

## Setup

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable the **Gmail API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URI**: `https://<your-ngrok-subdomain>.ngrok-free.app/auth/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. ngrok

```bash
# Start ngrok forwarding to the local callback port
ngrok http 3000
```

Copy the HTTPS forwarding URL (e.g. `https://abc123.ngrok-free.app`).

### 3. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://abc123.ngrok-free.app/auth/callback
CALLBACK_PORT=3000
```

### 4. Install & Run

```bash
npm install
npm run dev
```

## Usage

```
==================================================
  📧 Auth Mail — Gmail Console Client
==================================================

Commands:
  auth <email>  — Authenticate via Google OAuth
  send          — Send an email (interactive)
  exit          — Quit the application

> auth user@gmail.com
🔗 Open this URL in your browser to authorize:
https://accounts.google.com/o/oauth2/v2/auth?...

⏳ Waiting for authorization...
✅ Authorization code received. Exchanging for tokens...
✅ Authenticated as: User Name

> send
To: recipient@example.com
Subject: Hello
Body (enter an empty line to finish):
This is a test email.

📤 Sending email...
✅ Email sent successfully! Message ID: 18a1b2c3d4e5f6
```

## Extending — Adding a New Provider

All infrastructure is behind interfaces in `src/domain/ports/`. To add a new provider (e.g. Outlook, Yahoo), you need to implement two interfaces and wire them in the composition root.

### Step 1: Implement `IAuthProvider`

Create `src/infrastructure/auth/<provider>-auth-provider.ts`:

```typescript
import { IAuthProvider } from '../../domain/ports/auth-provider';
import { UserTokens, UserProfile } from '../../domain/models/user';

export class MyProviderAuthProvider implements IAuthProvider {
  getAuthUrl(email: string): string {
    // Return the OAuth authorization URL for your provider
  }

  async exchangeCodeForTokens(code: string): Promise<UserTokens> {
    // Exchange the authorization code for access + refresh tokens
  }

  async refreshAccessToken(refreshToken: string): Promise<UserTokens> {
    // Use the refresh token to obtain a new access token
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    // Fetch user email and name from the provider's API
  }
}
```

### Step 2: Implement `IEmailProvider`

Create `src/infrastructure/email/<provider>-email-provider.ts`:

```typescript
import { IEmailProvider } from '../../domain/ports/email-provider';
import { EmailMessage, SendResult } from '../../domain/models/email';

export class MyProviderEmailProvider implements IEmailProvider {
  async send(accessToken: string, message: EmailMessage): Promise<SendResult> {
    // Send the email via the provider's API (e.g. Microsoft Graph, Yahoo SMTP)
    // Return { success: true, messageId: '...' } or { success: false, error: '...' }
  }
}
```

### Step 3: Wire in `src/main.ts`

Replace the Google implementations with your new ones in the composition root:

```typescript
// Before (Google)
const authProvider = new GoogleAuthProvider(clientId, clientSecret, redirectUri);
const emailProvider = new GmailEmailProvider(clientId, clientSecret);

// After (your provider)
const authProvider = new MyProviderAuthProvider(clientId, clientSecret, redirectUri);
const emailProvider = new MyProviderEmailProvider(clientId, clientSecret);
```

The rest of the application (`AuthService`, `EmailService`, `CliHandler`) requires **no changes** — they depend only on the interfaces.

### Step 4: Update config

Add your provider's credentials to `.env` and update `src/config/config.ts` accordingly.

### Other extension points

- **Database storage** — implement `IUserRepository` (e.g. `PostgresUserRepository`) to replace `InMemoryUserRepository`
- **Custom callback server** — implement `IAuthCallbackServer` if your provider needs a different callback mechanism
