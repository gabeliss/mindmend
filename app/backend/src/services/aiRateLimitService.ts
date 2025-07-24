import { PrismaClient } from '@prisma/client';
import { AppError } from '../types';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

export interface RateLimitConfig {
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerDay: number;
  costPerDay: number; // in USD
}

export interface UsageStats {
  requestsThisHour: number;
  requestsToday: number;
  tokensToday: number;
  costToday: number;
}

export class AIRateLimitService {
  private readonly DEFAULT_LIMITS: RateLimitConfig = {
    requestsPerHour: 60,
    requestsPerDay: 500,
    tokensPerDay: 50000,
    costPerDay: 10.00, // $10 per day
  };

  private readonly TOKEN_COSTS = {
    'gpt-3.5-turbo': {
      input: 0.0015 / 1000, // $0.0015 per 1K tokens
      output: 0.002 / 1000,  // $0.002 per 1K tokens
    },
    'gpt-4': {
      input: 0.03 / 1000,    // $0.03 per 1K tokens
      output: 0.06 / 1000,   // $0.06 per 1K tokens
    },
  };

  async checkRateLimit(
    userId: string,
    estimatedTokens: number = 500,
    model = 'gpt-3.5-turbo'
  ): Promise<{ allowed: boolean; reason?: string; usage: UsageStats }> {
    try {
      const usage = await this.getCurrentUsage(userId);
      const estimatedCost = this.calculateCost(estimatedTokens, estimatedTokens / 2, model);

      // Check hourly rate limit
      if (usage.requestsThisHour >= this.DEFAULT_LIMITS.requestsPerHour) {
        return {
          allowed: false,
          reason: 'Hourly request limit exceeded',
          usage,
        };
      }

      // Check daily request limit
      if (usage.requestsToday >= this.DEFAULT_LIMITS.requestsPerDay) {
        return {
          allowed: false,
          reason: 'Daily request limit exceeded',
          usage,
        };
      }

      // Check daily token limit
      if (usage.tokensToday + estimatedTokens > this.DEFAULT_LIMITS.tokensPerDay) {
        return {
          allowed: false,
          reason: 'Daily token limit would be exceeded',
          usage,
        };
      }

      // Check daily cost limit
      if (usage.costToday + estimatedCost > this.DEFAULT_LIMITS.costPerDay) {
        return {
          allowed: false,
          reason: 'Daily cost limit would be exceeded',
          usage,
        };
      }

      return { allowed: true, usage };
    } catch (error) {
      Logger.error('Error checking rate limit', { error, userId });
      // In case of error, allow the request but log it
      return {
        allowed: true,
        usage: {
          requestsThisHour: 0,
          requestsToday: 0,
          tokensToday: 0,
          costToday: 0,
        },
      };
    }
  }

  async recordUsage(
    userId: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<void> {
    try {
      const cost = this.calculateCost(promptTokens, completionTokens, model);
      const totalTokens = promptTokens + completionTokens;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Update monthly usage stats
      await prisma.$executeRaw`
        INSERT INTO ai_usage_stats (user_id, month, total_requests, total_tokens, total_cost, last_updated)
        VALUES (${userId}, ${month}, 1, ${totalTokens}, ${cost}, ${now})
        ON CONFLICT (user_id, month)
        DO UPDATE SET
          total_requests = ai_usage_stats.total_requests + 1,
          total_tokens = ai_usage_stats.total_tokens + ${totalTokens},
          total_cost = ai_usage_stats.total_cost + ${cost},
          last_updated = ${now}
      `;

      // Store detailed usage log for recent analysis
      await this.storeUsageLog(userId, model, promptTokens, completionTokens, cost);

      Logger.info('AI usage recorded', {
        userId,
        model,
        tokens: totalTokens,
        cost: cost.toFixed(4),
      });
    } catch (error) {
      Logger.error('Error recording AI usage', { error, userId });
      // Don't throw error as this shouldn't block the main request
    }
  }

  async getCurrentUsage(userId: string): Promise<UsageStats> {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get usage from the last hour and today
      const usageLogs = await prisma.$queryRaw<Array<{
        created_at: Date;
        total_tokens: number;
        cost: number;
      }>>`
        SELECT created_at, total_tokens, cost
        FROM ai_usage_logs
        WHERE user_id = ${userId}
          AND created_at >= ${todayStart}
        ORDER BY created_at DESC
      `;

      let requestsThisHour = 0;
      let requestsToday = 0;
      let tokensToday = 0;
      let costToday = 0;

      usageLogs.forEach(log => {
        requestsToday++;
        tokensToday += log.total_tokens;
        costToday += log.cost;

        if (log.created_at >= hourAgo) {
          requestsThisHour++;
        }
      });

      return {
        requestsThisHour,
        requestsToday,
        tokensToday,
        costToday,
      };
    } catch (error) {
      Logger.error('Error getting current usage', { error, userId });
      return {
        requestsThisHour: 0,
        requestsToday: 0,
        tokensToday: 0,
        costToday: 0,
      };
    }
  }

  async getUserMonthlyStats(userId: string, month?: string): Promise<{
    month: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  } | null> {
    try {
      const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const stats = await prisma.$queryRaw<Array<{
        month: string;
        total_requests: number;
        total_tokens: number;
        total_cost: number;
      }>>`
        SELECT month, total_requests, total_tokens, total_cost
        FROM ai_usage_stats
        WHERE user_id = ${userId} AND month = ${targetMonth}
        LIMIT 1
      `;

      if (stats.length === 0) {
        return null;
      }

      return {
        month: stats[0].month,
        totalRequests: stats[0].total_requests,
        totalTokens: stats[0].total_tokens,
        totalCost: stats[0].total_cost,
      };
    } catch (error) {
      Logger.error('Error getting monthly stats', { error, userId });
      return null;
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    const costs = this.TOKEN_COSTS[model as keyof typeof this.TOKEN_COSTS] || this.TOKEN_COSTS['gpt-3.5-turbo'];
    
    const inputCost = promptTokens * costs.input;
    const outputCost = completionTokens * costs.output;
    
    return inputCost + outputCost;
  }

  private async storeUsageLog(
    userId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    cost: number
  ): Promise<void> {
    const totalTokens = promptTokens + completionTokens;
    
    // Store in a simple table for recent usage tracking
    await prisma.$executeRaw`
      INSERT INTO ai_usage_logs (user_id, model, prompt_tokens, completion_tokens, total_tokens, cost, created_at)
      VALUES (${userId}, ${model}, ${promptTokens}, ${completionTokens}, ${totalTokens}, ${cost}, ${new Date()})
    `;

    // Clean up old logs (keep only last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.$executeRaw`
      DELETE FROM ai_usage_logs
      WHERE created_at < ${sevenDaysAgo}
    `;
  }

  async resetUserLimits(userId: string): Promise<void> {
    // This method can be used by admins to reset a user's limits
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    await prisma.$executeRaw`
      DELETE FROM ai_usage_logs
      WHERE user_id = ${userId} AND created_at >= ${sevenDaysAgo}
    `;

    Logger.info('AI usage limits reset for user', { userId });
  }
}

export const aiRateLimitService = new AIRateLimitService();