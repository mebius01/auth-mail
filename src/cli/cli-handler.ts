import * as readline from "readline";
import { AuthService } from "../application/auth-service";
import { EmailService } from "../application/email-service";

export class CliHandler {
  private rl: readline.Interface;

  constructor(
    private authService: AuthService,
    private emailService: EmailService,
  ) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(): Promise<void> {
    console.log("=".repeat(50));
    console.log("  📧 Auth Mail — Gmail Console Client");
    console.log("=".repeat(50));
    console.log("\nCommands:");
    console.log("  auth  — Authenticate via Google OAuth");
    console.log("  send  — Send an email (interactive)");
    console.log("  exit  — Quit the application\n");

    this.promptLoop();
  }

  private promptLoop(): void {
    this.rl.question("> ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        this.promptLoop();
        return;
      }

      try {
        await this.handleCommand(trimmed);
      } catch (error: any) {
        console.error(`\n❌ Error: ${error.message}\n`);
      }

      this.promptLoop();
    });
  }

  private async handleCommand(input: string): Promise<void> {
    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case "auth":
        await this.handleAuth();
        break;
      case "send":
        await this.handleSend();
        break;
      case "exit":
      case "quit":
        console.log("\n👋 Goodbye!\n");
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log(
          `\n⚠️  Unknown command: "${command}". Use: auth, send, exit\n`,
        );
    }
  }

  private async handleAuth(): Promise<void> {
    const status = await this.authService.checkIntegration();

    if (status.isActive) {
      console.log("\n✅ Integration is active\n");
      return;
    }

    console.log("\n🔗 Open this URL in your browser to authorize:\n");
    console.log(status.authUrl);
    console.log("\n⏳ Waiting for authorization...\n");

    const user = await this.authService.authenticate();
    console.log(`\n✅ Authenticated as: ${user.profile.name ?? user.email}\n`);
  }

  private async handleSend(): Promise<void> {
    const to = await this.question("To: ");
    if (!to) {
      console.log("\n⚠️  Recipient address is required.\n");
      return;
    }

    const subject = await this.question("Subject: ");
    if (!subject) {
      console.log("\n⚠️  Subject is required.\n");
      return;
    }

    console.log("Body (enter an empty line to finish):");
    const bodyLines: string[] = [];
    let line = await this.question("");
    while (line !== "") {
      bodyLines.push(line);
      line = await this.question("");
    }
    const body = bodyLines.join("\n");

    if (!body) {
      console.log("\n⚠️  Body is required.\n");
      return;
    }

    console.log("\n📤 Sending email...\n");
    const result = await this.emailService.send(to, subject, body);

    if (result.success) {
      console.log(
        `✅ Email sent successfully! Message ID: ${result.messageId}\n`,
      );
    } else {
      console.log(`❌ Failed to send email: ${result.error}\n`);
    }
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}
