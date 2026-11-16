import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de Carga y Umbrales Formales (Thresholds)
export const options = {
  stages: [
    { duration: '5s', target: 5 },   // Ramp-up inicial
    { duration: '15s', target: 15 },  // Plateau: Carga sostenida concurrente
    { duration: '5s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // Tasa de fallos HTTP estrictamente menor al 1%
    http_req_failed: ['rate<0.01'],
    // Latencia Percentil 95 por debajo de 800 ms
    http_req_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://espocrm/api/v1';

// Autenticación Basic para usuario Andrés
const params = {
  headers: {
    'Authorization': 'Basic ' + (__ENV.AUTH_BASE64 || 'YW5kcmVzOmFuZHJlczEyMzQ1'),
    'Content-Type': 'application/json',
  },
};

export default function () {
  // 1. Consulta de Casos de Soporte (F1 & F2)
  const resCases = http.get(`${BASE_URL}/Case?maxSize=10`, params);
  check(resCases, {
    'GET /Case status is 200': (r) => r.status === 200,
    'GET /Case duration < 800ms': (r) => r.timings.duration < 800,
  });

  // 2. Consulta de Cotizaciones / Ventas (F3)
  const resOpps = http.get(`${BASE_URL}/Opportunity?maxSize=10`, params);
  check(resOpps, {
    'GET /Opportunity status is 200': (r) => r.status === 200,
  });

  // 3. Consulta de Tareas y Actividades (F4)
  const resTasks = http.get(`${BASE_URL}/Task?maxSize=10`, params);
  check(resTasks, {
    'GET /Task status is 200': (r) => r.status === 200,
  });

  // 4. Búsqueda de Cuentas Corporativas (F5)
  const resAccounts = http.get(`${BASE_URL}/Account?maxSize=10`, params);
  check(resAccounts, {
    'GET /Account status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
