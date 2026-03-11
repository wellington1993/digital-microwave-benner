import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Sobe para 20 usuarios
    { duration: '20s', target: 50 }, // Mantem 50 usuarios
    { duration: '10s', target: 0 },  // Desce para 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% das requisicoes devem ser < 200ms
  },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  // 1. Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringfy({
    username: 'admin',
    password: 'admin'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status e 200': (r) => r.status === 200,
    'possui token': (r) => r.json().token !== undefined,
  });

  const token = loginRes.json().token;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // 2. Verifica Status
  const statusRes = http.get(`${BASE_URL}/microwave/status`, params);
  check(statusRes, {
    'status e 200': (r) => r.status === 200,
  });

  sleep(1);
}
