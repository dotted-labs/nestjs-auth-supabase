import { Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SupabaseStrategyAuthGuard } from "./supabase-passport-auth.guard";

/**
 * @deprecated Use SupabaseStrategyAuthGuard instead
 */
@Injectable()
export class SupabaseAuthGuard extends SupabaseStrategyAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }
}
