import { HttpException, HttpStatus } from "@nestjs/common";

export class InvalidCredentialsException extends HttpException {
  constructor(
    message = "Invalid email or password",
    public readonly originalError?: any
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(
    message = "Token has expired",
    public readonly originalError?: any
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(
    message = "Invalid token provided",
    public readonly originalError?: any
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class MissingTokenException extends HttpException {
  constructor(
    message = "No token provided",
    public readonly originalError?: any
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenException extends HttpException {
  constructor(
    message = "Invalid or expired refresh token",
    public readonly originalError?: any
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
