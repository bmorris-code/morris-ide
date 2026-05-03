import { BarChart3, AlertCircle } from 'lucide-react';

interface ContextWindowIndicatorProps {
  usedTokens: number;
  maxTokens: number;
  fileCount?: number;
}

export function ContextWindowIndicator({ 
  usedTokens, 
  maxTokens, 
  fileCount 
}: ContextWindowIndicatorProps) {
  const percentage = Math.min((usedTokens / maxTokens) * 100, 100);
  const formattedUsed = formatTokenCount(usedTokens);
  const formattedMax = formatTokenCount(maxTokens);
  
  const getColor = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-violet-500';
  };
  
  const getTextColor = () => {
    if (percentage > 90) return 'text-red-400';
    if (percentage > 70) return 'text-yellow-400';
    return 'text-violet-400';
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <BarChart3 size={14} className="text-gray-400" />
      
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <span className={`text-xs ${getTextColor()}`}>
          {formattedUsed}/{formattedMax}
        </span>
        
        {percentage > 90 && (
          <span className="text-red-400" title="Near context limit">
            <AlertCircle size={12} />
          </span>
        )}
        
        {fileCount !== undefined && fileCount > 1 && (
          <span className="text-xs text-gray-500">
            ({fileCount} files)
          </span>
        )}
      </div>
    </div>
  );
}

function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}
