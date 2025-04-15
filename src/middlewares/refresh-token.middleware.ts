import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { SupabaseAuthService } from "../supabase-auth.service";
import { RefreshTokenException } from "../exceptions/auth-exceptions";

@Injectable()
export class RefreshTokenMiddleware implements NestMiddleware {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Only attempt to refresh if the tokens exist
      const refreshToken = this.extractRefreshToken(req);
      const accessToken = this.extractAccessToken(req);

      if (!refreshToken || !accessToken) {
        return next();
      }

      // First try to validate the token with getUser
      try {
        (req as any).user = await this.supabaseAuthService.getUser(accessToken);
        return next();
      } catch (error) {
        // If token is expired or invalid, try to refresh
        if (
          error.message &&
          (error.message.includes("expired") ||
            error.message.includes("JWT expired") ||
            error.message.includes("Invalid token"))
        ) {
          // Try to refresh the token
          try {
            const { session } = await this.supabaseAuthService.refreshSession(
              refreshToken
            );

            if (session) {
              // Update cookies with new tokens
              this.setAuthCookies(
                res,
                session.access_token,
                session.refresh_token
              );

              // Also update Authorization header for the current request
              req.headers.authorization = `Bearer ${session.access_token}`;

              // Update user in request
              (req as any).user = await this.supabaseAuthService.getUser(
                session.access_token
              );
            }
          } catch (refreshError) {
            // Only log the error but continue the request
            console.error("Token refresh error:", refreshError);
          }
        }
      }

      // Continue with the request either way
      next();
    } catch (error) {
      // Use the specific RefreshTokenException for handling
      if (!(error instanceof RefreshTokenException)) {
        console.error("Token refresh error:", error);
      }
      // Continue the request anyway - don't block the flow
      next();
    }
  }

  private extractRefreshToken(req: Request): string | undefined {
    // Try to extract from cookies first
    if (req.cookies && req.cookies["refresh_token"]) {
      return req.cookies["refresh_token"];
    }

    // Try to extract from headers
    const refreshHeader = req.headers["x-refresh-token"] as string;
    if (refreshHeader) {
      return refreshHeader;
    }

    return undefined;
  }

  private extractAccessToken(req: Request): string | undefined {
    // Try to extract from authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Try to extract from cookies
    if (req.cookies && req.cookies["access_token"]) {
      return req.cookies["access_token"];
    }

    return undefined;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ) {
    // Set secure and httpOnly cookies
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 3600 * 1000, // 1 hour
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/auth/refresh", // Restrict to refresh endpoint for security
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });
  }
}
