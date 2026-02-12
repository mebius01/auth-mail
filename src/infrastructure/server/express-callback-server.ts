import express, { Application } from 'express';
import http from 'http';
import { IAuthCallbackServer } from '../../domain/ports/auth-callback-server';

export class ExpressCallbackServer implements IAuthCallbackServer {
  private app: Application;
  private server: http.Server | null = null;
  private codeResolver: ((code: string) => void) | null = null;
  private codeRejecter: ((err: Error) => void) | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/auth/callback', (req, res) => {
      const code = req.query.code as string | undefined;
      const error = req.query.error as string | undefined;

      if (error) {
        res.status(400).send(`
          <html><body style="font-family:sans-serif;text-align:center;padding:50px">
            <h2>Authorization Failed</h2>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
          </body></html>
        `);
        if (this.codeRejecter) {
          this.codeRejecter(new Error(`Authorization denied: ${error}`));
        }
        return;
      }

      if (!code) {
        res.status(400).send(`
          <html><body style="font-family:sans-serif;text-align:center;padding:50px">
            <h2>Authorization Failed</h2>
            <p>No authorization code received.</p>
            <p>You can close this window.</p>
          </body></html>
        `);
        if (this.codeRejecter) {
          this.codeRejecter(new Error('No authorization code received'));
        }
        return;
      }

      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>Authorization Successful!</h2>
          <p>You can close this window and return to the terminal.</p>
        </body></html>
      `);

      if (this.codeResolver) {
        this.codeResolver(code);
      }
    });
  }

  async start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
        this.server = null;
      });
    });
  }

  async waitForCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.codeResolver = resolve;
      this.codeRejecter = reject;
    });
  }
}
