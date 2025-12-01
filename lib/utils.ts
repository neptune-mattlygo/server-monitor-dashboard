import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'up':
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'down':
    case 'fail':
    case 'failed':
      return 'text-red-600 bg-red-50';
    case 'degraded':
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'maintenance':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusDotColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'up':
    case 'success':
      return 'bg-green-500';
    case 'down':
    case 'fail':
    case 'failed':
      return 'bg-red-500';
    case 'degraded':
    case 'warning':
      return 'bg-yellow-500';
    case 'maintenance':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}
