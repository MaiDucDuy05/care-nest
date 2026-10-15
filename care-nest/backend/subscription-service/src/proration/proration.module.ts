import { Module } from '@nestjs/common';

/**
 * ProrationModule is stateless — `proration.ts` is a pure function module.
 * Wrapping it in a Nest module keeps it injectable for testing and gives us
 * a single import surface in `app.module.ts`.
 */
@Module({})
export class ProrationModule {}
