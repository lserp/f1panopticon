import axios, { AxiosError } from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { AppError } from '../types';

export interface RequestQueueItem {
  config: AxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (reason: AppError) => void;
  retryCount: number;
}

export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxRequestsPerHour: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class APIClient {
  private client: AxiosInstance;
  private requestQueue: RequestQueueItem[] = [];
  private isProcessingQueue = false;
  private requestTimestamps: number[] = [];
  private rateLimitConfig: RateLimitConfig;
  private retryConfig: RetryConfig;

  constructor(
    baseURL: string,
    rateLimitConfig: RateLimitConfig = {
      maxRequestsPerSecond: 4,
      maxRequestsPerHour: 200,
    },
    retryConfig: RetryConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    }
  ) {
    this.rateLimitConfig = rateLimitConfig;
    this.retryConfig = retryConfig;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.logRequest(config);
        return config;
      },
      (error: AxiosError) => {
        this.logError('Request interceptor error', error);
        return Promise.reject(this.createAppError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logResponse(response);
        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const appError = this.createAppError(error);

    // Check if we should retry
    if (appError.retryable && error.config) {
      const retryCount = (error.config as any).__retryCount || 0;

      if (retryCount < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount);
        this.logRetry(retryCount + 1, delay);

        await this.sleep(delay);

        // Increment retry count
        (error.config as any).__retryCount = retryCount + 1;

        return this.client.request(error.config);
      }
    }

    this.logError('Response error', error);
    throw appError;
  }

  private calculateBackoffDelay(retryCount: number): number {
    const delay =
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createAppError(error: AxiosError): AppError {
    let type: AppError['type'] = 'API_CONNECTION_ERROR';
    let recoverable = false;
    let retryable = false;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 429) {
        type = 'API_RATE_LIMIT';
        recoverable = true;
        retryable = true;
      } else if (status === 401 || status === 403) {
        type = 'API_AUTHENTICATION_ERROR';
        recoverable = true;
        retryable = false;
      } else if (status >= 500) {
        type = 'API_CONNECTION_ERROR';
        recoverable = true;
        retryable = true;
      }
    } else if (error.request) {
      // Request made but no response
      type = 'API_CONNECTION_ERROR';
      recoverable = true;
      retryable = true;
    }

    return {
      type,
      message: error.message || 'An API error occurred',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      },
      timestamp: new Date(),
      recoverable,
      retryable,
    };
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneHourAgo = now - 3600000;

    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => timestamp > oneHourAgo);

    // Check per-second limit
    const recentRequests = this.requestTimestamps.filter((timestamp) => timestamp > oneSecondAgo);
    if (recentRequests.length >= this.rateLimitConfig.maxRequestsPerSecond) {
      return false;
    }

    // Check per-hour limit
    if (this.requestTimestamps.length >= this.rateLimitConfig.maxRequestsPerHour) {
      return false;
    }

    return true;
  }

  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (!this.canMakeRequest()) {
        // Wait before checking again
        await this.sleep(250);
        continue;
      }

      const item = this.requestQueue.shift();
      if (!item) continue;

      this.recordRequest();

      try {
        const response = await this.client.request(item.config);
        item.resolve(response);
      } catch (error) {
        item.reject(error as AppError);
      }
    }

    this.isProcessingQueue = false;
  }

  public async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        resolve: resolve as (value: AxiosResponse) => void,
        reject,
        retryCount: 0,
      });

      this.processQueue();
    });
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  private logRequest(config: InternalAxiosRequestConfig): void {
    // Logging disabled in production
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
  }

  private logResponse(response: AxiosResponse): void {
    // Logging disabled in production
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.status} ${response.config.url} (${response.headers['content-length'] || 'unknown'} bytes)`
      );
    }
  }

  private logError(context: string, error: AxiosError): void {
    // Logging disabled in production
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${context}:`, {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
      });
    }
  }

  private logRetry(retryCount: number, delay: number): void {
    // Logging disabled in production
    if (import.meta.env.DEV) {
      console.log(`[API Retry] Attempt ${retryCount} after ${delay}ms`);
    }
  }

  public getQueueLength(): number {
    return this.requestQueue.length;
  }

  public getRateLimitStatus(): {
    requestsLastSecond: number;
    requestsLastHour: number;
    canMakeRequest: boolean;
  } {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneHourAgo = now - 3600000;

    const requestsLastSecond = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneSecondAgo
    ).length;

    const requestsLastHour = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneHourAgo
    ).length;

    return {
      requestsLastSecond,
      requestsLastHour,
      canMakeRequest: this.canMakeRequest(),
    };
  }
}
