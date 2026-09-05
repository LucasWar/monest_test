import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly errorCode: string;
  public readonly originalError: unknown;

  constructor(
    message: string,
    errorCode: string,
    statusCode: number,
    originalError?: unknown,
  ) {
    super({ message, errorCode }, statusCode);
    this.errorCode = errorCode;
    this.originalError = originalError;

    if (originalError instanceof Error && originalError.stack) {
      this.stack = originalError.stack;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
