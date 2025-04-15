import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { SUPABASE_AUTH_STRATEGY } from "../strategies/supabase-passport.strategy";
import { IS_PUBLIC_KEY } from "../decorators";

@Injectable()
export class SupabaseStrategyAuthGuard extends AuthGuard(
  SUPABASE_AUTH_STRATEGY
) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip authentication for public routes
    if (isPublic) {
      return true;
    }

    // Proceed with authentication for non-public routes
    return super.canActivate(context);
  }
}
