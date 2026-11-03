/**
 * CareNest Load Test: FR-3.4 WebSocket Chat Concurrency Test
 *
 * Tests Socket.IO realtime connection capacity and messaging latency:
 * - Direct WebSocket connection to /chat/?EIO=4&transport=websocket
 * - Handshake, join conversation room, send realtime messages, handle acks
 *
 * Target SLA:
 * - Connection establishment P95 < 1000ms
 * - Message roundtrip P95 < 2000ms
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { config } from '../config/env.js';
import { getAuthToken } from '../helpers/auth.js';

const messageLatency = new Trend('chat_message_latency_ms');
const messagesReceived = new Counter('chat_messages_received');
const messagesSent = new Counter('chat_messages_sent');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up to 50 concurrent connections
    { duration: '1m', target: 200 },   // Ramp-up to 200 concurrent connections
    { duration: '2m', target: 500 },   // High concurrency benchmark (500 VUs)
    { duration: '1m', target: 500 },   // Hold load
    { duration: '30s', target: 0 },    // Disconnect ramp-down
  ],
  thresholds: {
    chat_message_latency_ms: ['p(95)<2000'],
    ws_connecting: ['p(95)<1000'],
    ws_sessions: ['count>0'],
  },
};

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const vuId = __VU;
  const conversationId = `conv_test_room_${vuId % 10}`;
  
  // Convert http/https URL to ws/wss
  const wsHost = config.wsUrl.replace(/^http/, 'ws');
  const endpoint = `${wsHost}/chat/?EIO=4&transport=websocket&userId=loadtest_user_${vuId}`;

  const res = ws.connect(endpoint, {}, function (socket) {
    let sendStartTime = 0;

    socket.on('open', () => {
      // Step 1: Send Engine.IO connect packet for Socket.IO v4
      socket.send('40');
    });

    socket.on('message', (msg) => {
      // Engine.IO open packet: 0{"sid":"..."}
      if (msg.startsWith('0')) {
        socket.send('40');
      }
      
      // Socket.IO connected: 40{"sid":"..."}
      else if (msg.startsWith('40')) {
        // Step 2: Join target conversation room
        const joinPayload = `42["join_conversation",{"conversationId":"${conversationId}"}]`;
        socket.send(joinPayload);

        // Step 3: Send chat message after joining
        socket.setTimeout(() => {
          sendStartTime = Date.now();
          const chatMsg = `42["send_message",{"conversationId":"${conversationId}","content":"Xin chào từ VU ${vuId} lúc ${sendStartTime}","clientTempId":"temp_${vuId}_${sendStartTime}"}]`;
          socket.send(chatMsg);
          messagesSent.add(1);
        }, 1000);
      }

      // Socket.IO message ack or incoming event: 42[...]
      else if (msg.startsWith('42')) {
        messagesReceived.add(1);
        if (sendStartTime > 0) {
          const latency = Date.now() - sendStartTime;
          messageLatency.add(latency);
          sendStartTime = 0;
        }
      }

      // Engine.IO ping -> respond with pong
      else if (msg === '2') {
        socket.send('3');
      }
    });

    socket.on('error', (err) => {
      // Record socket error
    });

    // Keep connection alive for 15s to simulate an active chat session
    socket.setTimeout(() => {
      socket.close();
    }, 15000);
  });

  check(res, {
    'WebSocket connected successfully': (r) => r && r.status === 101,
  });

  sleep(1);
}
