import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Converts database errors into clean 4xx responses and hides internals of
 * unexpected errors (stack traces and SQL never reach the client).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `A record with this ${(exception.meta?.target as string[] | undefined)?.join(', ') ?? 'value'} already exists`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'A related record does not exist';
          break;
        case 'P2023':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid identifier';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid request data';
    }
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.log.error(exception);
    res.status(status).json({ statusCode: status, message, error: HttpStatus[status] });
  }
}
