import { ModuleMetadata, Type } from "@nestjs/common";
import { User } from "@supabase/supabase-js";

export interface SupabaseAuthModuleOptions {
  supabaseUrl: string;
  supabaseKey: string;
  supabaseOptions?: any;
  isGlobal?: boolean;
}

export interface SupabaseAuthOptionsFactory {
  createSupabaseAuthOptions():
    | Promise<SupabaseAuthModuleOptions>
    | SupabaseAuthModuleOptions;
}

export interface SupabaseAuthModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  useExisting?: Type<SupabaseAuthOptionsFactory>;
  useClass?: Type<SupabaseAuthOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<SupabaseAuthModuleOptions> | SupabaseAuthModuleOptions;
  inject?: any[];
  isGlobal?: boolean;
}

export type SupabaseAuthUser = User;

export interface SupabaseAuthStrategy {
  validate(token: string): Promise<User | null>;
  extractToken(request: any): string | undefined;
}

export interface SupabaseAuthStrategyOptions {
  name: string;
  strategy: Type<SupabaseAuthStrategy>;
}
