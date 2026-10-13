/**
 * @carenest/shared-config
 *
 * Centralized env loader + cross-service constants.
 *
 * - Each service calls `loadConfig()` to get a validated config object.
 * - Use `zod` schemas to make missing/invalid env vars fail fast at boot.
 */

export * from './env.js';
export * from './constants.js';
