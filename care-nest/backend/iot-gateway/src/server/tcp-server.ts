import net from 'node:net';
import { createLogger } from '@carenest/shared-utils';
import { handleConnection } from './connection-handler.js';

const logger = createLogger({ service: 'tcp-server' });

export class IotTcpServer {
  private server: net.Server | null = null;

  constructor(
    public readonly port: number = 18800,
    public readonly host: string = '0.0.0.0',
  ) {}

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer(handleConnection);

      this.server.on('error', (err) => {
        logger.error({ err }, 'TCP Server encountered an error');
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        logger.info({ port: this.port, host: this.host }, `📡 CareNest Wonlex IoT Gateway listening on tcp://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) return resolve();
      this.server.close(() => {
        logger.info('TCP Server stopped');
        this.server = null;
        resolve();
      });
    });
  }
}
