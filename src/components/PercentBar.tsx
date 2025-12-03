interface PercentBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

export function PercentBar({ percent, className = '', showLabel = true }: PercentBarProps) {
  const normalizedPercent = Math.min(Math.max(percent, 0), 100);
  const isOverBudget = percent > 100;

  const barColor = isOverBudget
    ? 'bg-gradient-to-r from-red-500 to-red-600'
    : 'bg-gradient-primary';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{normalizedPercent.toFixed(0)}%</span>
          {isOverBudget && <span className="text-red-400">Over budget</span>}
        </div>
      )}
    </div>
  );
}
