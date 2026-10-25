export interface RouteMapping {
  prefix: string;
  targetEnvKey: string;
  defaultUrl: string;
  serviceName: string;
}

const rawPrefix = (process.env.API_PREFIX || 'api/v1').replace(/^\/+|\/+$/g, '');
export const API_PREFIX = `/${rawPrefix}`;

export const GATEWAY_ROUTES: RouteMapping[] = [
  // Auth Service (Port 3001)
  { prefix: `${API_PREFIX}/auth`, targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },
  { prefix: `${API_PREFIX}/mfa`, targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },
  { prefix: `${API_PREFIX}/audit`, targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },

  // Catalog Service (Port 3002)
  { prefix: `${API_PREFIX}/products`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: `${API_PREFIX}/categories`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: `${API_PREFIX}/kyc`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: `${API_PREFIX}/seller/kyc`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: `${API_PREFIX}/imei`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: `${API_PREFIX}/seller/imeis`, targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },

  // Device Service (Port 3003)
  { prefix: `${API_PREFIX}/devices`, targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },
  { prefix: `${API_PREFIX}/geofences`, targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },
  { prefix: `${API_PREFIX}/caregivers`, targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },

  // Order Service (Port 3004)
  { prefix: `${API_PREFIX}/orders`, targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: `${API_PREFIX}/cart`, targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: `${API_PREFIX}/reviews`, targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: `${API_PREFIX}/analytics`, targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },

  // Payment Service (Port 3005)
  { prefix: `${API_PREFIX}/payments`, targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },
  { prefix: `${API_PREFIX}/payouts`, targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },
  { prefix: `${API_PREFIX}/webhooks`, targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },

  // Notification Service (Port 3006)
  { prefix: `${API_PREFIX}/notifications`, targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },
  { prefix: `${API_PREFIX}/preferences`, targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },
  { prefix: `${API_PREFIX}/push-subscriptions`, targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },

  // Alert Service (Port 3007)
  { prefix: `${API_PREFIX}/alerts`, targetEnvKey: 'ALERT_SERVICE_URL', defaultUrl: 'http://localhost:3007', serviceName: 'alert-service' },

  // Subscription Service (Port 3008)
  { prefix: `${API_PREFIX}/subscriptions`, targetEnvKey: 'SUBSCRIPTION_SERVICE_URL', defaultUrl: 'http://localhost:3008', serviceName: 'subscription-service' },
  { prefix: `${API_PREFIX}/plans`, targetEnvKey: 'SUBSCRIPTION_SERVICE_URL', defaultUrl: 'http://localhost:3008', serviceName: 'subscription-service' },

  // Shipping Service (Port 3009)
  { prefix: `${API_PREFIX}/shipments`, targetEnvKey: 'SHIPPING_SERVICE_URL', defaultUrl: 'http://localhost:3009', serviceName: 'shipping-service' },

  // Chat Service (Port 3010)
  { prefix: `${API_PREFIX}/chat`, targetEnvKey: 'CHAT_SERVICE_URL', defaultUrl: 'http://localhost:3010', serviceName: 'chat-service' },
];

export function resolveTargetUrl(path: string): { targetBase: string; serviceName: string } | null {
  for (const route of GATEWAY_ROUTES) {
    if (path === route.prefix || path.startsWith(`${route.prefix}/`)) {
      const targetBase = (process.env[route.targetEnvKey] || route.defaultUrl).replace(/\/+$/, '');
      return { targetBase, serviceName: route.serviceName };
    }
  }
  return null;
}
