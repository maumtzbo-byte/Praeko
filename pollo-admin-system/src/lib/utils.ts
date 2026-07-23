import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatAxisCurrency(value: number): string {
  return formatCurrency(value).replace('MX$', '$')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  return new Intl.DateTimeFormat('es-MX', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
