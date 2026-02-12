import { User } from '../../domain/models/user';
import { IUserRepository } from '../../domain/ports/user-repository';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private activeUserEmail: string | null = null;

  async save(user: User): Promise<void> {
    this.users.set(user.email, { ...user });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email) ?? null;
  }

  async updateTokens(email: string, tokens: Partial<User['tokens']>): Promise<void> {
    const user = this.users.get(email);
    if (!user) {
      throw new Error(`User not found: ${email}`);
    }
    user.tokens = { ...user.tokens, ...tokens };
    this.users.set(email, user);
  }

  async getActiveUser(): Promise<User | null> {
    if (!this.activeUserEmail) return null;
    return this.users.get(this.activeUserEmail) ?? null;
  }

  async setActiveUser(email: string): Promise<void> {
    if (!this.users.has(email)) {
      throw new Error(`User not found: ${email}`);
    }
    this.activeUserEmail = email;
  }
}
