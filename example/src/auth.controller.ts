import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Public, SupabaseAuthService } from "@dotted-labs/nestjs-supabase-auth";
import { Request, Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: SupabaseAuthService) {}

  @Public()
  @Post("signin")
  async signIn(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const { email, password } = body;
      const data = await this.authService.signIn(email, password);

      // Set cookies with tokens
      res.cookie("access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refresh_token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict", // Prevent CSRF attacks
        path: "/",
      });

      // Also return tokens in response for mobile/API clients
      return {
        message: "Login successful",
        user: data.user,
        tokens: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
        },
      };
    } catch (error) {
      return { error: error.message || "Error during signin" };
    }
  }

  @Public()
  @Post("token/refresh")
  async refreshToken(
    @Body() body: { refresh_token: string },
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const { refresh_token } = body;

      if (!refresh_token) {
        throw new UnauthorizedException("No refresh token provided");
      }

      const data = await this.authService.refreshSession(refresh_token);

      // Update cookies for web clients
      res.cookie("access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refresh_token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
        path: "/",
      });

      // Return tokens in response for mobile/API clients
      return {
        message: "Token refreshed successfully",
        tokens: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
        },
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  @Get("user")
  async getUser(@Req() req: Request) {
    try {
      const token =
        req.cookies["access_token"] ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        throw new UnauthorizedException("No token provided");
      }

      const user = await this.authService.getUser(token);
      return { user };
    } catch (error) {
      return { error: error.message || "Error getting user" };
    }
  }

  @Post("signout")
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const token =
        req.cookies["access_token"] ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      // Sign out the current session
      if (token) {
        await this.authService.signOut(token);
      }

      // Clear cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return { message: "Signed out successfully" };
    } catch (error) {
      return { error: error.message || "Error during signout" };
    }
  }

  @Post("signout/all")
  async signOutAll(@Res({ passthrough: true }) res: Response) {
    try {
      // Sign out all sessions (global sign out)
      await this.authService.signOut();

      // Clear cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return { message: "Signed out from all sessions successfully" };
    } catch (error) {
      return { error: error.message || "Error during global signout" };
    }
  }
}
