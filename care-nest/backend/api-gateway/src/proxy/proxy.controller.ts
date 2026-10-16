import { Controller, All, Req, Res, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service.js';
import { GATEWAY_ROUTES } from './gateway-routes.js';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('healthz')
  healthz() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      routesCount: GATEWAY_ROUTES.length,
    };
  }

  @Get()
  root() {
    return {
      name: 'CareNest API Gateway',
      version: '0.1.0',
      routes: GATEWAY_ROUTES.map((r) => ({
        prefix: r.prefix,
        service: r.serviceName,
      })),
    };
  }

  @All('*')
  async handleProxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyService.forward(req, res);
  }
}
