export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputError";
    this.statusCode = 400;
  }
}

export class ScanUnavailableError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "ScanUnavailableError";
    this.statusCode = 503;
    this.retryAfter = 15;
  }
}
