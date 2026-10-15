import { format, formatDistanceToNow, parseISO, type Locale } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const locales: Record<string, Locale> = { vi, en: enUS };

export function formatDate(dateStr: string, fmt = 'dd/MM/yyyy', locale = 'vi') {
  try {
    return format(parseISO(dateStr), fmt, { locale: locales[locale] ?? vi });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string, locale = 'vi') {
  return formatDate(dateStr, 'dd/MM/yyyy HH:mm', locale);
}

export function formatRelative(dateStr: string, locale = 'vi') {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: locales[locale] ?? vi });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(vnd: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(vnd);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = Math.ceil(name.length / 2);
  return `${name.slice(0, visible)}${'*'.repeat(name.length - visible)}@${domain}`;
}
