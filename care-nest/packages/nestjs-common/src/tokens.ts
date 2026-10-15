/**
 * Injection tokens that span multiple modules. Keeping them in a single file
 * avoids circular imports between module declarations.
 */
export const KAFKA_PRODUCER = Symbol('KAFKA_PRODUCER');
export const DEFAULT_REDIS = Symbol('DEFAULT_REDIS');
export const TENANT_ASYNC_STORAGE = Symbol('TENANT_ASYNC_STORAGE');
