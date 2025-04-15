import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import {
  SupabaseAuthModule,
  SupabaseStrategyAuthGuard,
} from "nestjs-auth-supabase";
import * as dotenv from "dotenv";
import { APP_GUARD, Reflector } from "@nestjs/core";
dotenv.config();

@Module({
  imports: [
    SupabaseAuthModule.forRoot({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }),
  ],
  controllers: [AuthController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => {
        return new SupabaseStrategyAuthGuard(reflector);
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
