/**
 * mock: true  -> the UI runs fully on in-memory sample data (no backend needed).
 * mock: false -> the UI talks to the Spring Boot backend through /api (see proxy.conf.json).
 */
export const API_CONFIG = {
  baseUrl: '/api',
  mock: true,
  projectId: 'demo',
};
