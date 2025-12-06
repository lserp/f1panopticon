import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIClient } from './apiClient';
import axios from 'axios';

vi.mock('axios');

describe('APIClient', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock axios.create to return a proper axios instance mock
    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    };

    (axios.create as any) = vi.fn(() => mockAxiosInstance);

    apiClient = new APIClient('https://api.example.com', {
      maxRequestsPerSecond: 2,
      maxRequestsPerHour: 10,
    });
  });

  it('should create an API client with base URL', () => {
    expect(apiClient).toBeDefined();
  });

  it('should track rate limit status', () => {
    const status = apiClient.getRateLimitStatus();
    expect(status.requestsLastSecond).toBe(0);
    expect(status.requestsLastHour).toBe(0);
    expect(status.canMakeRequest).toBe(true);
  });

  it('should return queue length', () => {
    expect(apiClient.getQueueLength()).toBe(0);
  });
});
