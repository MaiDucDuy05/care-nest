import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import http from 'node:http';
import https from 'node:https';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { resolveTargetUrl } from './gateway-routes.js';

export function generateTraceparent(): string {
  const version = '00';
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const traceFlags = '01';
  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  async forward(req: Request, res: Response): Promise<void> {
    const route = resolveTargetUrl(req.path);
    if (!route) {
      throw new NotFoundException(`No gateway route registered for path: ${req.path}`);
    }

    const { targetBase, serviceName } = route;
    const targetUrl = new URL(req.originalUrl || req.url, targetBase);

    // Prepare headers for forwarding
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    // OpenTelemetry W3C traceparent propagation
    if (!headers['traceparent'] || typeof headers['traceparent'] !== 'string' || !headers['traceparent'].startsWith('00-')) {
      headers['traceparent'] = generateTraceparent();
    }

    // Correlation ID propagation
    const requestId = (req as Request & { id?: string }).id || (headers['x-request-id'] as string) || (headers['x-correlation-id'] as string);
    if (requestId) {
      headers['x-request-id'] = requestId;
      headers['x-correlation-id'] = requestId;
    }

    headers['x-forwarded-for'] = req.ip || req.socket.remoteAddress || '127.0.0.1';
    headers['x-forwarded-proto'] = req.protocol || 'http';
    headers['x-forwarded-host'] = req.get('host') || 'localhost';

    const client = targetUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
      const proxyReq = client.request(
        targetUrl,
        {
          method: req.method,
          headers: headers as http.OutgoingHttpHeaders,
        },
        (proxyRes) => {
          res.status(proxyRes.statusCode || 200);

          // Copy response headers
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (value !== undefined) {
              res.setHeader(key, value);
            }
          }

          // Echo correlation & trace headers back to client
          if (headers['traceparent']) {
            res.setHeader('traceparent', headers['traceparent'] as string);
          }
          if (requestId) {
            res.setHeader('x-request-id', requestId);
          }

          proxyRes.pipe(res);
          proxyRes.on('end', () => resolve());
        },
      );

      proxyReq.on('error', (err: NodeJS.ErrnoException) => {
        this.logger.error(`Failed to proxy request to ${serviceName} (${targetUrl}): ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({
            statusCode: 502,
            error: 'Bad Gateway',
            message: `Downstream service '${serviceName}' unavailable: ${err.message}`,
            service: serviceName,
          });
        }
        resolve();
      });

      // Stream request body to downstream
      req.pipe(proxyReq);
    });
  }
}
