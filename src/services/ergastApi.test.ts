import { describe, it, expect, beforeEach } from 'vitest';
import { ErgastAPI } from './ergastApi';

describe('ErgastAPI', () => {
  let ergastApi: ErgastAPI;

  beforeEach(() => {
    ergastApi = new ErgastAPI();
  });

  it('should create an Ergast API instance', () => {
    expect(ergastApi).toBeDefined();
  });

  it('should provide rate limit status', () => {
    const status = ergastApi.getRateLimitStatus();
    expect(status).toHaveProperty('requestsLastSecond');
    expect(status).toHaveProperty('requestsLastHour');
    expect(status).toHaveProperty('canMakeRequest');
  });
});
