import { Inject, Injectable } from "@nestjs/common";
import { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "./constants";
import {
  InvalidCredentialsException,
  InvalidTokenException,
  RefreshTokenException,
} from "./exceptions/auth-exceptions";

@Injectable()
export class SupabaseAuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient
  ) {}

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{
    user: User;
    session: Session;
  }> {
    try {
      // Validate email format
      if (!email || !this.isValidEmail(email)) {
        throw new InvalidCredentialsException("Invalid email format");
      }

      // Validate password is not empty
      if (!password) {
        throw new InvalidCredentialsException("Password cannot be empty");
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new InvalidCredentialsException(
          error.message || "Sign in failed",
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }
      throw new InvalidCredentialsException(
        error.message || "Sign in failed",
        error
      );
    }
  }

  /**
   * Get the current user
   */
  async getUser(token: string): Promise<User> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        throw new InvalidTokenException("Invalid token", error);
      }

      return data.user;
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new InvalidTokenException("Invalid token", error);
    }
  }

  /**
   * Refresh the session
   */
  async refreshSession(
    refreshToken: string
  ): Promise<{ session: Session; user: User }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw new RefreshTokenException(
          "Failed to refresh token: " + error.message,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof RefreshTokenException) {
        throw error;
      }
      // Log the error but don't expose details
      console.error("Token refresh error:", error);
      throw new RefreshTokenException(
        "Failed to refresh authentication token",
        error
      );
    }
  }

  /**
   * Sign out the user
   */
  async signOut(token?: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut({
        scope: token ? "local" : "global",
      });

      if (error) {
        throw new InvalidTokenException(
          "Failed to sign out: " + error.message,
          error
        );
      }
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new InvalidTokenException("Failed to sign out", error);
    }
  }

  /**
   * Utility method to validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
