import { logger } from '../../utils/logger';
import { secureStorage } from '../../utils/secureStorage';

// Usage tracking interface
export interface UsageStats {
  totalTokens: number;
  totalRequests: number;
  totalCost: number;
  provider: string;
  model: string;
  lastReset: string;
  dailyTokens: number;
  dailyRequests: number;
  dailyCost: number;
}

// Cost per 1M tokens (approximate, update as needed)
const COST_PER_MILLION_TOKENS = {
  'groq': {
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    'mixtral-8x7b-32768': { input: 0.27, output: 0.27 },
    'default': { input: 0.5, output: 0.7 }
  },
  'moonshot': {
    'kimi-latest': { input: 3.0, output: 12.0 },
    'default': { input: 3.0, output: 12.0 }
  },
  'openai': {
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'default': { input: 5.0, output: 15.0 }
  },
  'deepseek': {
    'deepseek-coder': { input: 0.14, output: 0.28 },
    'default': { input: 0.14, output: 0.28 }
  }
};

// User quotas (tokens per day)
const DEFAULT_DAILY_QUOTA = 100000; // 100K tokens/day
const WARNING_THRESHOLD = 0.8; // Warn at 80% of quota

export class UsageTracker {
  private static instance: UsageTracker;
  private stats: Map<string, UsageStats> = new Map();

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  // Get usage stats for a provider
  async getUsageStats(provider: string): Promise<UsageStats> {
    const key = `usage_${provider}`;
    let stats = this.stats.get(key);
    
    if (!stats) {
      // Try to load from storage
      const stored = await secureStorage.getData(key);
      stats = stored || {
        totalTokens: 0,
        totalRequests: 0,
        totalCost: 0,
        provider,
        model: '',
        lastReset: new Date().toDateString(),
        dailyTokens: 0,
        dailyRequests: 0,
        dailyCost: 0
      };
      this.stats.set(key, stats);
    }

    // Ensure stats is defined
    if (!stats) {
      throw new Error(`Failed to initialize usage stats for provider: ${provider}`);
    }

    // Reset daily stats if needed
    const today = new Date().toDateString();
    if (stats.lastReset !== today) {
      stats.dailyTokens = 0;
      stats.dailyRequests = 0;
      stats.dailyCost = 0;
      stats.lastReset = today;
      await this.saveStats(provider);
    }

    return stats;
  }

  // Track API usage
  async trackUsage(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<{ cost: number; nearQuota: boolean; exceededQuota: boolean }> {
    const stats = await this.getUsageStats(provider);
    const totalTokens = inputTokens + outputTokens;
    
    // Calculate cost
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);
    
    // Update stats
    stats.totalTokens += totalTokens;
    stats.totalRequests += 1;
    stats.totalCost += cost;
    stats.dailyTokens += totalTokens;
    stats.dailyRequests += 1;
    stats.dailyCost += cost;
    stats.model = model;
    
    // Check quotas
    const dailyQuota = await this.getDailyQuota(provider);
    const usagePercentage = stats.dailyTokens / dailyQuota;
    
    const nearQuota = usagePercentage >= WARNING_THRESHOLD;
    const exceededQuota = usagePercentage >= 1.0;
    
    // Save and log
    await this.saveStats(provider);
    
    logger.info('Usage tracked', 'AI', {
      provider,
      model,
      tokens: totalTokens,
      cost: cost.toFixed(4),
      dailyTokens: stats.dailyTokens,
      dailyQuota,
      usagePercentage: `${(usagePercentage * 100).toFixed(1)}%`
    });
    
    if (nearQuota && !exceededQuota) {
      logger.warn('Approaching daily quota', 'AI', {
        provider,
        usage: `${(usagePercentage * 100).toFixed(1)}%`,
        remaining: dailyQuota - stats.dailyTokens
      });
    }
    
    if (exceededQuota) {
      logger.error('Daily quota exceeded', 'AI', {
        provider,
        usage: stats.dailyTokens,
        quota: dailyQuota
      });
    }
    
    return { cost, nearQuota, exceededQuota };
  }

  // Calculate cost based on provider and model
  private calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const providerCosts = COST_PER_MILLION_TOKENS[provider as keyof typeof COST_PER_MILLION_TOKENS];
    if (!providerCosts) return 0;
    
    const modelCosts = providerCosts[model as keyof typeof providerCosts] || providerCosts.default;
    
    const inputCost = (inputTokens / 1000000) * modelCosts.input;
    const outputCost = (outputTokens / 1000000) * modelCosts.output;
    
    return inputCost + outputCost;
  }

  // Get user's daily quota
  private async getDailyQuota(provider: string): Promise<number> {
    const customQuota = await secureStorage.getData(`quota_${provider}`);
    return customQuota || DEFAULT_DAILY_QUOTA;
  }

  // Set custom daily quota
  async setDailyQuota(provider: string, quota: number): Promise<void> {
    await secureStorage.setData(`quota_${provider}`, quota);
    logger.info('Daily quota updated', 'AI', { provider, quota });
  }

  // Get usage summary for all providers
  async getUsageSummary(): Promise<{ [provider: string]: UsageStats }> {
    const providers = ['groq', 'moonshot', 'openai', 'deepseek'];
    const summary: { [provider: string]: UsageStats } = {};
    
    for (const provider of providers) {
      summary[provider] = await this.getUsageStats(provider);
    }
    
    return summary;
  }

  // Save stats to storage
  private async saveStats(provider: string): Promise<void> {
    const stats = this.stats.get(`usage_${provider}`);
    if (stats) {
      await secureStorage.setData(`usage_${provider}`, stats);
    }
  }

  // Reset usage stats
  async resetUsage(provider?: string): Promise<void> {
    if (provider) {
      const key = `usage_${provider}`;
      this.stats.delete(key);
      await secureStorage.removeData(key);
      logger.info('Usage stats reset', 'AI', { provider });
    } else {
      // Reset all
      for (const key of this.stats.keys()) {
        this.stats.delete(key);
        await secureStorage.removeData(key);
      }
      logger.info('All usage stats reset', 'AI');
    }
  }
}

export const usageTracker = UsageTracker.getInstance();
