import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/env.js';

// Cache tokens to avoid re-authenticating on every iteration
const tokenCache = {};

export function getAuthToken(role = 'buyer') {
  if (tokenCache[role]) {
    return tokenCache[role];
  }

  const credentials = config.users[role] || config.users.buyer;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'Auth_Login' },
  };

  const res = http.post(`${config.baseUrl}/api/v1/auth/login`, payload, params);

  const success = check(res, {
    'auth login status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'auth login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.accessToken || body.token);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    const body = JSON.parse(res.body);
    const token = body.accessToken || body.token;
    tokenCache[role] = token;
    return token;
  }

  return null;
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
