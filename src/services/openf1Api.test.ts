import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenF1API } from './openf1Api';

describe('OpenF1API', () => {
  let openf1Api: OpenF1API;

  beforeEach(() => {
    openf1Api = new OpenF1API();
  });

  afterEach(() => {
    openf1Api.stopAllPolling();
  });

  it('should create an OpenF1 API instance', () => {
    expect(openf1Api).toBeDefined();
  });

  it('should provide rate limit status', () => {
    const status = openf1Api.getRateLimitStatus();
    expect(status).toHaveProperty('requestsLastSecond');
    expect(status).toHaveProperty('requestsLastHour');
    expect(status).toHaveProperty('canMakeRequest');
  });

  it('should stop all polling on cleanup', () => {
    expect(() => openf1Api.stopAllPolling()).not.toThrow();
  });
});
