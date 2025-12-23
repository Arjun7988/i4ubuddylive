interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
}

export function Money({
  amount,
  currency = 'USD',
  className = '',
  showSign = false,
}: MoneyProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Math.abs(amount));

  const sign = amount >= 0 ? '+' : '-';
  const colorClass = amount >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <span className={`font-semibold ${showSign ? colorClass : ''} ${className}`}>
      {showSign && sign}
      {formatted}
    </span>
  );
}
