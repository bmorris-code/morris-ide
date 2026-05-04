import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Zap, Settings, RefreshCw } from 'lucide-react';
import { usageTracker } from '../../backend/ai/usage-tracker';
import type { UsageStats } from '../../backend/ai/usage-tracker';

export function UsageDashboard() {
  const [usageStats, setUsageStats] = useState<{ [provider: string]: UsageStats }>({});
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const stats = await usageTracker.getUsageSummary();
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, []);

  const getQuotaPercentage = (stats: UsageStats): number => {
    const dailyQuota = 100000; // Default quota
    return (stats.dailyTokens / dailyQuota) * 100;
  };

  const getQuotaColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getQuotaBgColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-gray-400" size={20} />
          <span className="ml-2 text-gray-400">Loading usage data...</span>
        </div>
      </div>
    );
  }

  const totalStats = Object.values(usageStats).reduce(
    (acc, stats) => ({
      totalTokens: acc.totalTokens + stats.totalTokens,
      totalCost: acc.totalCost + stats.totalCost,
      totalRequests: acc.totalRequests + stats.totalRequests,
      dailyTokens: acc.dailyTokens + stats.dailyTokens,
      dailyCost: acc.dailyCost + stats.dailyCost,
      dailyRequests: acc.dailyRequests + stats.dailyRequests,
    }),
    {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0,
      dailyTokens: 0,
      dailyCost: 0,
      dailyRequests: 0,
    }
  );

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">API Usage Dashboard</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsageStats}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="Settings"
            >
              <Settings size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Today's Tokens</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatTokens(totalStats.dailyTokens)}
            </div>
            <div className="text-xs text-gray-500">
              {totalStats.dailyRequests} requests
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-xs text-gray-400">Today's Cost</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatCost(totalStats.dailyCost)}
            </div>
            <div className="text-xs text-gray-500">
              Avg: {totalStats.dailyTokens > 0 ? formatCost(totalStats.dailyCost / totalStats.dailyTokens * 1000000) : '0'} / 1M tokens
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-purple-400" />
              <span className="text-xs text-gray-400">Total Tokens</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatTokens(totalStats.totalTokens)}
            </div>
            <div className="text-xs text-gray-500">
              All time
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Quota Usage</span>
            </div>
            <div className="text-xl font-bold text-white">
              {Math.round((totalStats.dailyTokens / 100000) * 100)}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all ${getQuotaBgColor(
                  (totalStats.dailyTokens / 100000) * 100
                )}`}
                style={{ width: `${Math.min((totalStats.dailyTokens / 100000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Provider Breakdown</h4>
          {Object.entries(usageStats).map(([provider, stats]) => {
            const quotaPercentage = getQuotaPercentage(stats);
            return (
              <div key={provider} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-sm font-medium text-white capitalize">{provider}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{formatTokens(stats.dailyTokens)} tokens</span>
                    <span>{formatCost(stats.dailyCost)}</span>
                    <span>{stats.dailyRequests} req</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${getQuotaBgColor(quotaPercentage)}`}
                      style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getQuotaColor(quotaPercentage)}`}>
                    {Math.round(quotaPercentage)}%
                  </span>
                </div>
                {quotaPercentage >= 80 && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Approaching daily quota</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-3">Usage Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Daily Quota</span>
                <select className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600">
                  <option>50K tokens</option>
                  <option selected>100K tokens</option>
                  <option>250K tokens</option>
                  <option>500K tokens</option>
                  <option>Unlimited</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Cost Alerts</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Privacy Mode</span>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>Code sent to AI services is processed by external servers. Consider enabling privacy mode to anonymize sensitive data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
