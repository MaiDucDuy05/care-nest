/**
 * Cross-service constants — values referenced by more than one service.
 */

export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  AUTH_SERVICE: 'auth-service',
  CATALOG_SERVICE: 'catalog-service',
  ORDER_SERVICE: 'order-service',
  PAYMENT_SERVICE: 'payment-service',
  INVENTORY_SERVICE: 'inventory-service',
  NOTIFICATION_SERVICE: 'notification-service',
  IOT_GATEWAY: 'iot-gateway',
  HEALTH_SERVICE: 'health-service',
  ANALYTICS_SERVICE: 'analytics-service',
} as const;

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];

/** Kafka topic names */
export const KAFKA_TOPICS = {
  // Inbound (device → server)
  IOT_LOCATION_RECEIVED: 'iot.location.received',
  IOT_VITALS_RECEIVED: 'iot.vitals.received',
  IOT_SOS_RECEIVED: 'iot.sos.received',
  IOT_FALL_RECEIVED: 'iot.fall.received',
  IOT_DEVICE_REGISTERED: 'iot.device.registered',
  IOT_HEARTBEAT_RECEIVED: 'iot.heartbeat.received',

  // Internal
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_RELEASED: 'inventory.released',
  ALERT_TRIGGERED: 'alert.triggered',
  NOTIFICATION_SEND: 'notification.send',

  // Outbound (server → device)
  IOT_DEVICE_COMMAND: 'iot.device.command',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

/** HTTP / gRPC inter-service timeouts (milliseconds) */
export const TIMEOUTS_MS = {
  HTTP_DEFAULT: 5_000,
  HTTP_LONG: 30_000,
  KAFKA_PRODUCER_ACK: 5_000,
  DB_QUERY: 3_000,
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 200,
} as const;

/** Wonlex IoT defaults — keep in sync with @carenest/iot-codec */
export const IOT = {
  DEFAULT_TCP_PORT: 18800,
  MAX_BUFFER_SIZE: 4096,
  HEARTBEAT_INTERVAL_SEC: 60,
} as const;
