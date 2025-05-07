# NestJS Auth Supabase

[![npm version](https://badge.fury.io/js/%40dotted-labs%nestjs-supabase-auth.svg)](https://badge.fury.io/js/%40dotted-labs%nestjs-supabase-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simplified NestJS library for authenticating with Supabase.

## Installation

```bash
npm install nestjs-supabase-auth
```

## Usage

### Register the module

```typescript
import { Module } from "@nestjs/common";
import { SupabaseAuthModule } from "nestjs-supabase-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SupabaseAuthModule.forRoot({
      supabaseUrl: "YOUR_SUPABASE_URL",
      supabaseKey: "YOUR_SUPABASE_ANON_KEY",
      supabaseServiceKey: "YOUR_SUPABASE_ROLE_KEY",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Or async configuration:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SupabaseAuthModule } from "nestjs-supabase-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    SupabaseAuthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        supabaseUrl: configService.get("SUPABASE_URL"),
        supabaseKey: configService.get("SUPABASE_ANON_KEY"),
        supabaseServiceKey: configService.get("SUPABASE_ROLE_KEY"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Use the service

```typescript
import { Injectable } from "@nestjs/common";
import { SupabaseAuthService } from "nestjs-supabase-auth";

@Injectable()
export class AuthService {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  async signIn(email: string, password: string) {
    return this.supabaseAuthService.signIn(email, password);
  }

  async getUser(token: string) {
    return this.supabaseAuthService.getUser(token);
  }

  async refreshSession(refreshToken: string) {
    return this.supabaseAuthService.refreshSession(refreshToken);
  }

  async signOut(token?: string) {
    return this.supabaseAuthService.signOut(token);
  }

  async generateMagicLink(token: string) {
    return this.supabaseAuthService.generateMagicLink(token);
  }
}
```

#### Example controller implementation

```typescript
import { Controller, Post, Body, Get, Headers, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "nestjs-supabase-auth";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  async login(@Body() credentials) {
    return this.authService.signIn(credentials.email, credentials.password);
  }

  @Get("profile")
  async getProfile(@Headers("authorization") authHeader: string) {
    // Extract token from 'Bearer TOKEN'
    const token = authHeader.split(" ")[1];
    return this.authService.getUser(token);
  }

  @Public()
  @Post("refresh")
  async refresh(@Body("refresh_token") refreshToken: string) {
    return this.authService.refreshSession(refreshToken);
  }

  @Post("magic-link")
  async generateMagicLink(@Headers("authorization") authHeader: string) {
    const token = authHeader.split(" ")[1];
    return this.authService.generateMagicLink(token);
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // For local sign out (just this session)
    const token = req.headers.authorization?.split(" ")[1];
    await this.authService.signOut(token);

    // Clear cookies if using cookie-based auth
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return { success: true, message: "Signed out successfully" };
  }

  @Post("logout-all")
  async logoutAll(@Res({ passthrough: true }) res: Response) {
    // Global sign out (all user's sessions)
    await this.authService.signOut();

    // Clear cookies if using cookie-based auth
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return { success: true, message: "Signed out from all sessions" };
  }
}
```

### Protect routes with guard

```typescript
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SupabaseStrategyAuthGuard } from "nestjs-supabase-auth";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseStrategyAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Make routes public

```typescript
import { Controller, Get } from "@nestjs/common";
import { Public } from "nestjs-supabase-auth";

@Controller("auth")
export class AuthController {
  @Public()
  @Get("public")
  public() {
    return { message: "This is a public route" };
  }

  @Get("protected")
  protected() {
    return { message: "This is a protected route" };
  }
}
```

### Get user in controllers

```typescript
import { Controller, Get } from "@nestjs/common";
import { User } from "nestjs-supabase-auth";
import { SupabaseAuthUser } from "nestjs-supabase-auth";

@Controller("user")
export class UserController {
  @Get("profile")
  getProfile(@User() user: SupabaseAuthUser) {
    return { user };
  }

  @Get("email")
  getEmail(@User("email") email: string) {
    return { email };
  }
}
```

## Cookie Management and Token Handling

### Usage with Cookies

To store the refresh token in cookies after login:

```typescript
@Post('login')
async login(@Body() credentials) {
  // The interceptor will handle setting the cookie
  return await this.authService.signIn(credentials.email, credentials.password);
}
```

### Automatic Cookie Handling with Interceptor

For easier cookie handling, use the provided `TokenInfoInterceptor`:

```typescript
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TokenInfoInterceptor } from "nestjs-supabase-auth";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TokenInfoInterceptor,
    },
  ],
})
export class AppModule {}
```

This interceptor:

- Automatically stores refresh tokens in HTTP-only cookies
- Removes refresh tokens from response bodies for better security
- Adds token expiration information to responses

With this interceptor, you can simplify your login controllers:

```typescript
@Post('login')
async login(@Body() credentials) {
  // The interceptor will handle setting the cookie
  return await this.authService.signIn(credentials.email, credentials.password);
}
```

### Sign Out with Cookie Clearing

To properly sign out users when using cookies:

```typescript
@Post('logout')
async logout(@Res({ passthrough: true }) response: Response) {
  await this.authService.signOut();

  // Clear auth cookies
  response.clearCookie('access_token');
  response.clearCookie('refresh_token');

  return { success: true };
}
```

## Refresh Token Middleware

This module includes a middleware that automatically refreshes expired access tokens.

### Setup

1. First, install the required dependency:

```bash
npm install cookie-parser
```

2. Configure cookie-parser in your main.ts file:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // Add this line to enable cookie parsing
  await app.listen(3000);
}
bootstrap();
```

The middleware is automatically applied to all routes when you import the SupabaseAuthModule.

### How It Works

1. The middleware checks if the request includes an access token
2. If the token is valid, the request proceeds normally
3. If the token has expired but a refresh token is available (in cookies or x-refresh-token header):
   - The middleware automatically refreshes the session
   - Updates the request with the new access token
   - Sets a new refresh token cookie
   - Allows the request to proceed with the new valid token

## API Reference

### SupabaseAuthService

- `signIn(email: string, password: string)`: Sign in with email and password
- `getUser(token: string)`: Get the current user
- `refreshSession(refreshToken: string)`: Refresh the session
- `signOut(token?: string)`: Sign out the current user. If token is provided, only the current session is invalidated; otherwise, all user sessions are invalidated (global sign out)
- `generateMagicLink(token: string)`: Generate a magic link for the authenticated user. Returns a hashed token that can be used for passwordless authentication.

## Error Handling

This module includes error handling with custom exceptions:

- `InvalidCredentialsException`: Thrown when login credentials are incorrect
- `TokenExpiredException`: Thrown when a JWT token has expired
- `InvalidTokenException`: Thrown when a token is invalid
- `MissingTokenException`: Thrown when no token is provided
- `RefreshTokenException`: Thrown when refresh token is invalid or expired

### Using the Global Exception Filter

For a consistent error handling approach, you can use the included exception filter:

```typescript
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AuthExceptionFilter } from "nestjs-supabase-auth";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
  ],
})
export class AppModule {}
```

The filter formats error responses consistently:

```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "TokenExpiredException",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "path": "/api/protected-resource"
}
```

For token expiration errors, the response includes a `shouldRefresh: true` field that clients can use to trigger token refresh.

### Handling Exceptions in Controllers

You can also catch these exceptions directly in your controllers:

```typescript
import { Controller, Post, Body, HttpCode, Catch } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { InvalidCredentialsException } from "nestjs-supabase-auth";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() credentials) {
    try {
      return await this.authService.signIn(
        credentials.email,
        credentials.password
      );
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        // Handle the specific error
        throw error;
      }
      // Handle other errors
      throw error;
    }
  }
}
```

## Development

### Testing

This library includes comprehensive unit tests. To run the tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:cov
```

See [test/README.md](test/README.md) for more details on the test structure.

### Building

To build the library:

```bash
npm run build
```

## License

MIT
