export class AdminError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'AdminError';
  }
}
