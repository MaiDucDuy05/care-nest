import { Global, Module, DynamicModule } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService, ConfigModuleOptions } from '@nestjs/config';
import { loadBaseEnv } from '@carenest/shared-config';

/**
 * Thin ConfigModule — wraps NestJS @nestjs/config and centralises env loading
 * via `@carenest/shared-config`.
 *
 * The Zod schema there validates the env at boot. If the env is invalid the
 * process exits with a non-zero code BEFORE any listener binds.
 */
@Global()
@Module({})
export class AppConfigModule {
  static forRoot(opts: ConfigModuleOptions = {}): DynamicModule {
    const env = loadBaseEnv();
    return {
      module: AppConfigModule,
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          ...opts,
          validate: () => env as unknown as Record<string, unknown>,
        }),
      ],
      exports: [NestConfigModule, ConfigService],
    };
  }
}
