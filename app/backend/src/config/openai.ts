import OpenAI from 'openai';
import { AppError } from '../types';
import Logger from '../utils/logger';

export class OpenAIConfig {
  private static instance: OpenAIConfig;
  private client!: OpenAI; // Using definite assignment assertion
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeClient();
  }

  public static getInstance(): OpenAIConfig {
    if (!OpenAIConfig.instance) {
      OpenAIConfig.instance = new OpenAIConfig();
    }
    return OpenAIConfig.instance;
  }

  private initializeClient(): void {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError('OpenAI API key is required in production', 500);
        } else {
          Logger.warn('OpenAI API key not found. Using mock client for development.');
          this.createMockClient();
          return;
        }
      }

      this.client = new OpenAI({
        apiKey: apiKey,
      });

      this.isInitialized = true;
      Logger.info('OpenAI client initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize OpenAI client', error);
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('OpenAI initialization failed', 500);
      } else {
        this.createMockClient();
      }
    }
  }

  private createMockClient(): void {
    // Mock client for development/testing
    this.client = {
      chat: {
        completions: {
          create: async (params: any) => {
            Logger.info('Mock OpenAI call', { params });
            return {
              id: 'mock-completion-id',
              object: 'chat.completion',
              created: Date.now(),
              model: params.model || 'gpt-3.5-turbo',
              usage: {
                prompt_tokens: 50,
                completion_tokens: 100,
                total_tokens: 150,
              },
              choices: [{
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'This is a mock response from OpenAI for development purposes.',
                },
                finish_reason: 'stop',
              }],
            };
          },
        },
      },
    } as any;
    
    this.isInitialized = true;
    Logger.info('Mock OpenAI client initialized for development');
  }

  public getClient(): OpenAI {
    if (!this.isInitialized) {
      throw new AppError('OpenAI client not initialized', 500);
    }
    return this.client;
  }

  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      if (!this.isInitialized) {
        return { status: 'unhealthy', message: 'Client not initialized' };
      }

      // Skip health check for mock client
      if (!process.env.OPENAI_API_KEY) {
        return { status: 'healthy', message: 'Mock client active' };
      }

      // Test with a minimal API call
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });

      return { status: 'healthy', message: 'OpenAI API accessible' };
    } catch (error) {
      Logger.error('OpenAI health check failed', error);
      return { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  public isApiKeyConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

export default OpenAIConfig.getInstance();