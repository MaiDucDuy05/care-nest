export interface RouteMapping {
  prefix: string;
  targetEnvKey: string;
  defaultUrl: string;
  serviceName: string;
}

export const GATEWAY_ROUTES: RouteMapping[] = [
  // Auth Service (Port 3001)
  { prefix: '/api/v1/auth', targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },
  { prefix: '/api/v1/mfa', targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },
  { prefix: '/api/v1/audit', targetEnvKey: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:3001', serviceName: 'auth-service' },

  // Catalog Service (Port 3002)
  { prefix: '/api/v1/products', targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: '/api/v1/categories', targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: '/api/v1/kyc', targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },
  { prefix: '/api/v1/imei', targetEnvKey: 'CATALOG_SERVICE_URL', defaultUrl: 'http://localhost:3002', serviceName: 'catalog-service' },

  // Device Service (Port 3003)
  { prefix: '/api/v1/devices', targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },
  { prefix: '/api/v1/geofences', targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },
  { prefix: '/api/v1/caregivers', targetEnvKey: 'DEVICE_SERVICE_URL', defaultUrl: 'http://localhost:3003', serviceName: 'device-service' },

  // Order Service (Port 3004)
  { prefix: '/api/v1/orders', targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: '/api/v1/cart', targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: '/api/v1/reviews', targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },
  { prefix: '/api/v1/analytics', targetEnvKey: 'ORDER_SERVICE_URL', defaultUrl: 'http://localhost:3004', serviceName: 'order-service' },

  // Payment Service (Port 3005)
  { prefix: '/api/v1/payments', targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },
  { prefix: '/api/v1/payouts', targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },
  { prefix: '/api/v1/webhooks', targetEnvKey: 'PAYMENT_SERVICE_URL', defaultUrl: 'http://localhost:3005', serviceName: 'payment-service' },

  // Notification Service (Port 3006)
  { prefix: '/api/v1/notifications', targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },
  { prefix: '/api/v1/preferences', targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },
  { prefix: '/api/v1/push-subscriptions', targetEnvKey: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:3006', serviceName: 'notification-service' },

  // Alert Service (Port 3007)
  { prefix: '/api/v1/alerts', targetEnvKey: 'ALERT_SERVICE_URL', defaultUrl: 'http://localhost:3007', serviceName: 'alert-service' },

  // Subscription Service (Port 3008)
  { prefix: '/api/v1/subscriptions', targetEnvKey: 'SUBSCRIPTION_SERVICE_URL', defaultUrl: 'http://localhost:3008', serviceName: 'subscription-service' },
  { prefix: '/api/v1/plans', targetEnvKey: 'SUBSCRIPTION_SERVICE_URL', defaultUrl: 'http://localhost:3008', serviceName: 'subscription-service' },

  // Shipping Service (Port 3009)
  { prefix: '/api/v1/shipments', targetEnvKey: 'SHIPPING_SERVICE_URL', defaultUrl: 'http://localhost:3009', serviceName: 'shipping-service' },
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
