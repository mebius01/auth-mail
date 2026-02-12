import { User } from '../models/user';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  updateTokens(email: string, tokens: Partial<User['tokens']>): Promise<void>;
  getActiveUser(): Promise<User | null>;
  setActiveUser(email: string): Promise<void>;
}
