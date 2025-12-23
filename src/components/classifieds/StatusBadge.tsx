import type { ClassifiedStatus } from '../../types/classifieds';

interface StatusBadgeProps {
  status: ClassifiedStatus;
}

const STATUS_CONFIG: Record<ClassifiedStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  sold: { label: 'Sold', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  archived: { label: 'Archived', className: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${config.className}`}>
      {config.label}
    </span>
  );
}
