import { loadIotEnv } from '@carenest/shared-config';
import { createLogger } from '@carenest/shared-utils';
import { IotTcpServer } from './server/tcp-server.js';

const logger = createLogger({ service: 'iot-gateway-main' });

async function bootstrap() {
  const env = loadIotEnv();
  const server = new IotTcpServer(env.IOT_GATEWAY_PORT, env.IOT_GATEWAY_HOST);

  await server.start();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down IoT Gateway...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start IoT Gateway');
  process.exit(1);
});
