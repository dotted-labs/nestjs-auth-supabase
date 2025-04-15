import {
  DynamicModule,
  Module,
  Provider,
  MiddlewareConsumer,
} from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_CLIENT,
  SUPABASE_OPTIONS,
  SUPABASE_STRATEGY_OPTIONS,
} from "./constants";
import { SupabaseAuthService } from "./supabase-auth.service";
import {
  SupabaseAuthModuleAsyncOptions,
  SupabaseAuthModuleOptions,
  SupabaseAuthOptionsFactory,
} from "./interfaces";
import { RefreshTokenMiddleware } from "./middlewares/refresh-token.middleware";
import { PassportModule } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import {
  SupabaseAuthStrategy,
  SupabaseStrategyOptions,
} from "./strategies/supabase-passport.strategy";
import { SupabaseStrategyAuthGuard } from "./guards/supabase-passport-auth.guard";

@Module({
  imports: [PassportModule],
  providers: [SupabaseAuthService, Reflector],
  exports: [SupabaseAuthService],
})
export class SupabaseAuthModule {
  static forRoot(
    options: SupabaseAuthModuleOptions,
    strategyOptions?: SupabaseStrategyOptions
  ): DynamicModule {
    const supabaseClient = createClient(
      options.supabaseUrl,
      options.supabaseKey,
      options.supabaseOptions
    );

    const supabaseClientProvider: Provider = {
      provide: SUPABASE_CLIENT,
      useValue: supabaseClient,
    };

    const strategyOptionsProvider: Provider = {
      provide: SUPABASE_STRATEGY_OPTIONS,
      useValue: strategyOptions || {},
    };

    return {
      module: SupabaseAuthModule,
      imports: [PassportModule.register({ defaultStrategy: "supabase" })],
      providers: [
        supabaseClientProvider,
        strategyOptionsProvider,
        SupabaseAuthService,
        SupabaseAuthStrategy,
        Reflector,
        {
          provide: SupabaseStrategyAuthGuard,
          useFactory: (reflector: Reflector) => {
            return new SupabaseStrategyAuthGuard(reflector);
          },
          inject: [Reflector],
        },
      ],
      exports: [
        supabaseClientProvider,
        SupabaseAuthService,
        SupabaseStrategyAuthGuard,
      ],
      global: options.isGlobal || false,
    };
  }

  static forRootAsync(
    options: SupabaseAuthModuleAsyncOptions,
    strategyOptions?: SupabaseStrategyOptions
  ): DynamicModule {
    const supabaseClientProvider: Provider = {
      provide: SUPABASE_CLIENT,
      useFactory: (supabaseOptions: SupabaseAuthModuleOptions) => {
        return createClient(
          supabaseOptions.supabaseUrl,
          supabaseOptions.supabaseKey,
          supabaseOptions.supabaseOptions
        );
      },
      inject: [SUPABASE_OPTIONS],
    };

    const strategyOptionsProvider: Provider = {
      provide: SUPABASE_STRATEGY_OPTIONS,
      useValue: strategyOptions || {},
    };

    return {
      module: SupabaseAuthModule,
      imports: [
        ...(options.imports || []),
        PassportModule.register({ defaultStrategy: "supabase" }),
      ],
      providers: [
        ...this.createAsyncProviders(options),
        supabaseClientProvider,
        strategyOptionsProvider,
        SupabaseAuthService,
        SupabaseAuthStrategy,
        Reflector,
        {
          provide: SupabaseStrategyAuthGuard,
          useFactory: (reflector: Reflector) => {
            return new SupabaseStrategyAuthGuard(reflector);
          },
          inject: [Reflector],
        },
      ],
      exports: [
        supabaseClientProvider,
        SupabaseAuthService,
        SupabaseStrategyAuthGuard,
      ],
      global: options.isGlobal || false,
    };
  }

  private static createAsyncProviders(
    options: SupabaseAuthModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: SupabaseAuthModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SUPABASE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: SUPABASE_OPTIONS,
      useFactory: async (optionsFactory: SupabaseAuthOptionsFactory) =>
        await optionsFactory.createSupabaseAuthOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RefreshTokenMiddleware).forRoutes("*");
  }
}
