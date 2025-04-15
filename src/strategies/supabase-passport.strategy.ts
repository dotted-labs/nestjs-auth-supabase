import { Inject, Injectable, Optional } from "@nestjs/common";
import { Request } from "express";
import { Strategy } from "passport-strategy";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../constants";
import { SupabaseAuthUser } from "../interfaces";
import * as passport from "passport";

/**
 * Strategy name to use with AuthGuard
 */
export const SUPABASE_AUTH_STRATEGY = "supabase";

// Default token extractor from request
const defaultExtractor = (req: Request): string | null => {
  let token: string | null = null;

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  } else if (req.query?.access_token) {
    token = req.query.access_token as string;
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  return token;
};

/**
 * Error thrown when validation fails
 */
export class InvalidTokenError extends Error {
  constructor(message = "Invalid token") {
    super(message);
    this.name = "InvalidTokenError";
  }
}

/**
 * Options for Supabase authentication strategy
 */
export interface SupabaseStrategyOptions {
  /**
   * Function to extract JWT token from request
   */
  extractor?: (req: Request) => string | null;
}

/**
 * Passport strategy for Supabase authentication
 */
@Injectable()
export class SupabaseAuthStrategy extends Strategy {
  name = SUPABASE_AUTH_STRATEGY;
  private readonly extractor: (req: Request) => string | null;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Optional() options: SupabaseStrategyOptions = {}
  ) {
    super();
    this.extractor = options.extractor || defaultExtractor;

    // Register this strategy with passport
    passport.use(SUPABASE_AUTH_STRATEGY, this);
  }

  // Override these methods to match Strategy interface
  success(user: SupabaseAuthUser, info?: any): void {}
  fail(challenge: any, status?: number): void {}

  authenticate(req: Request): void {
    const token = this.extractor(req);

    if (!token) {
      return this.fail("No auth token", 401);
    }

    this.validateToken(token)
      .then((user) => {
        if (user) {
          this.success(user);
        } else {
          this.fail(new InvalidTokenError(), 401);
        }
      })
      .catch((error) => {
        this.fail(error, 401);
      });
  }

  async validate(user: User): Promise<User | null> {
    return user;
  }

  private async validateToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        throw new InvalidTokenError(error.message);
      }

      return this.validate(data.user);
    } catch (error) {
      throw new InvalidTokenError(error.message || "Failed to validate token");
    }
  }
}
