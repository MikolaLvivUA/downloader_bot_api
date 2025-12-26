export class PrivateContentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivateContentException';
  }
}
