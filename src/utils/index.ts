import { format } from 'date-fns';

export function formatTime(iso: string) {
  return format(new Date(iso), 'HH:mm:ss');
}

export function formatDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy');
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    free: '#22C55E',
    moderate: '#EAB308',
    heavy: '#F97316',
    critical: '#EF4444',
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
  };
  return map[status] || '#6B7280';
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    free: 'Free Flow',
    moderate: 'Moderate',
    heavy: 'Heavy',
    critical: 'Critical',
  };
  return map[status] || status;
}

export function priorityBadgeClass(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}
