import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";
import {
  InvalidCredentialsException,
  InvalidTokenException,
  MissingTokenException,
  RefreshTokenException,
  TokenExpiredException,
} from "./auth-exceptions";

@Catch(
  InvalidCredentialsException,
  InvalidTokenException,
  MissingTokenException,
  RefreshTokenException,
  TokenExpiredException
)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      message: exception.message,
      error: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      ...(typeof exceptionResponse === "object" ? exceptionResponse : {}),
    };

    // Include original Supabase error if available
    const authException = exception as any;
    if (authException.originalError) {
      errorResponse["originalError"] = authException.originalError;
    }

    if (exception instanceof TokenExpiredException) {
      errorResponse["shouldRefresh"] = true;
    }

    response.status(status).json(errorResponse);
  }
}
