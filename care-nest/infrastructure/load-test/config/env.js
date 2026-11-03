/**
 * Environment configuration for CareNest k6 load tests.
 * Values can be overridden at runtime via:
 * k6 run -e BASE_URL=https://staging.carenest.vn script.js
 */

export const config = {
  // Base URLs
  baseUrl: __ENV.BASE_URL || 'http://localhost:8080',
  wsUrl: __ENV.WS_URL || 'http://localhost:3010',
  
  // Specific Microservice endpoints (when bypassing API Gateway)
  authApi: __ENV.AUTH_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1/auth` : 'http://localhost:8080/api/v1/auth'),
  catalogApi: __ENV.CATALOG_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1` : 'http://localhost:8080/api/v1'),
  orderApi: __ENV.ORDER_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1` : 'http://localhost:8080/api/v1'),
  paymentApi: __ENV.PAYMENT_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1` : 'http://localhost:8080/api/v1'),
  deviceApi: __ENV.DEVICE_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1` : 'http://localhost:8080/api/v1'),
  chatApi: __ENV.CHAT_API || (__ENV.BASE_URL ? `${__ENV.BASE_URL}/api/v1/chat` : 'http://localhost:8080/api/v1/chat'),

  // Default seeded test accounts
  users: {
    buyer: {
      email: __ENV.BUYER_EMAIL || 'buyer@carenest.vn',
      password: __ENV.BUYER_PASSWORD || 'Buyer@123456',
    },
    seller: {
      email: __ENV.SELLER_EMAIL || 'seller.wonlex@carenest.vn',
      password: __ENV.SELLER_PASSWORD || 'Seller@123456',
    },
    admin: {
      email: __ENV.ADMIN_EMAIL || 'admin@carenest.vn',
      password: __ENV.ADMIN_PASSWORD || 'Admin@123456',
    },
  },
};
