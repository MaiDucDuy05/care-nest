import { describe, it, expect } from 'vitest';
import { resolveTargetUrl, GATEWAY_ROUTES } from '../src/proxy/gateway-routes.js';
import { generateTraceparent, ProxyService } from '../src/proxy/proxy.service.js';
import { ProxyController } from '../src/proxy/proxy.controller.js';
import { NotFoundException } from '@nestjs/common';

describe('API Gateway Proxy & Routing', () => {
  describe('Gateway Route Registry', () => {
    it('has all core service route mappings configured', () => {
      const services = GATEWAY_ROUTES.map((r) => r.serviceName);
      expect(services).toContain('auth-service');
      expect(services).toContain('catalog-service');
      expect(services).toContain('device-service');
      expect(services).toContain('order-service');
      expect(services).toContain('payment-service');
      expect(services).toContain('notification-service');
      expect(services).toContain('alert-service');
      expect(services).toContain('subscription-service');
      expect(services).toContain('shipping-service');
    });

    it('resolves routes correctly based on path prefix', () => {
      expect(resolveTargetUrl('/api/v1/auth/login')?.serviceName).toBe('auth-service');
      expect(resolveTargetUrl('/api/v1/products/p123')?.serviceName).toBe('catalog-service');
      expect(resolveTargetUrl('/api/v1/devices')?.serviceName).toBe('device-service');
      expect(resolveTargetUrl('/api/v1/orders/checkout')?.serviceName).toBe('order-service');
      expect(resolveTargetUrl('/api/v1/cart/items')?.serviceName).toBe('order-service');
      expect(resolveTargetUrl('/api/v1/payments/create')?.serviceName).toBe('payment-service');
      expect(resolveTargetUrl('/api/v1/notifications')?.serviceName).toBe('notification-service');
      expect(resolveTargetUrl('/api/v1/alerts/a1')?.serviceName).toBe('alert-service');
      expect(resolveTargetUrl('/api/v1/subscriptions/sub1')?.serviceName).toBe('subscription-service');
      expect(resolveTargetUrl('/api/v1/shipments/s1')?.serviceName).toBe('shipping-service');
    });

    it('returns null for unmapped paths', () => {
      expect(resolveTargetUrl('/unknown/path')).toBeNull();
      expect(resolveTargetUrl('/api/v2/unsupported')).toBeNull();
    });
  });

  describe('OpenTelemetry Traceparent Generation', () => {
    it('generates a valid W3C traceparent string (00-{traceId}-{spanId}-01)', () => {
      const tp = generateTraceparent();
      expect(tp).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    });

    it('generates unique traceparent on each call', () => {
      const tp1 = generateTraceparent();
      const tp2 = generateTraceparent();
      expect(tp1).not.toBe(tp2);
    });
  });

  describe('ProxyService', () => {
    it('throws NotFoundException when forwarding an unmapped route', async () => {
      const service = new ProxyService();
      const mockReq = { path: '/unknown/api' } as any;
      const mockRes = {} as any;

      await expect(service.forward(mockReq, mockRes)).rejects.toThrow(NotFoundException);
    });
  });

  describe('ProxyController', () => {
    const service = new ProxyService();
    const controller = new ProxyController(service);

    it('returns healthy status on healthz', () => {
      const res = controller.healthz();
      expect(res.status).toBe('ok');
      expect(res.service).toBe('api-gateway');
      expect(res.routesCount).toBeGreaterThanOrEqual(9);
    });

    it('returns route directory on root GET', () => {
      const res = controller.root();
      expect(res.name).toBe('CareNest API Gateway');
      expect(res.routes.length).toBeGreaterThanOrEqual(9);
    });
  });
});
