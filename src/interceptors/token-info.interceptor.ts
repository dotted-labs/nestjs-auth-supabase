import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";

@Injectable()
export class TokenInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data && data.session) {
          if (data.session.refresh_token) {
            response.cookie("refresh_token", data.session.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            const { refresh_token, ...sessionWithoutRefreshToken } =
              data.session;
            data.session = sessionWithoutRefreshToken;

            if (data.session.expires_at) {
              const expiresInMs =
                new Date(data.session.expires_at).getTime() - Date.now();
              data.session.expires_in_ms = expiresInMs;
            }
          }
        }

        return data;
      })
    );
  }
}
