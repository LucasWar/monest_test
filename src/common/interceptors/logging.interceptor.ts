import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AppException } from '../exeptions/app.exeption';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(
            JSON.stringify({
              method: req.method,
              path: req.originalUrl,
              params: req.params,
              durationMs: Date.now() - start,
              status: 'success',
            }),
          ),
        error: (err: unknown) =>
          this.logger.error(
            JSON.stringify({
              method: req.method,
              path: req.originalUrl,
              params: req.params,
              durationMs: Date.now() - start,
              status: 'error',
              errorType:
                err instanceof Error ? err.constructor.name : 'UnknownError',
              errorCode:
                err instanceof AppException ? err.errorCode : undefined,
              message: err instanceof Error ? err.message : String(err),
            }),
          ),
      }),
    );
  }
}
