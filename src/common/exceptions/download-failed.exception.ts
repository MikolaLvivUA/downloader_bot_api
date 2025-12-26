export class DownloadFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadFailedException';
  }
}
