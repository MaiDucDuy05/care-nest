/**
 * Server-side entry point — exports only the mock TCP server so production
 * bundles can import the codec without pulling in `node:net`.
 */

export { startMockServer, type MockServerOptions, type MockFixture } from './mock-server.js';
