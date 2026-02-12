export interface IAuthCallbackServer {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  waitForCode(): Promise<string>;
}
