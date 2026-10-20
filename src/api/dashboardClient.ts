import type { ReminderItem } from '../types';
import { apiJson } from './http';

export type DashboardSummary = {
  phase: number;
  generatedAt: string;
  sources: Record<string, string>;
  staff: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  fleet: {
    totalVehicles: number;
    activeVehicles?: number;
    officers?: number;
    drivers?: number;
    activeTenders: number;
    pendingBillsAmount: number;
    openReminders: number;
    openFuelSlips?: number;
    unpaidFuelVendorBills?: number;
  };
  companyDocuments?: {
    total: number;
    expiringSoon: number;
  };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const data = await apiJson<{ success: true } & DashboardSummary>('/api/dashboard/summary');
  const { success: _s, ...rest } = data;
  return rest;
}

export async function fetchServerReminders(): Promise<ReminderItem[]> {
  const data = await apiJson<{ success: true; reminders: ReminderItem[] }>('/api/reminders');
  return data.reminders;
}

export async function fetchReminderCounts(): Promise<{
  total: number;
  high: number;
  medium: number;
  low: number;
}> {
  const data = await apiJson<{
    success: true;
    counts: { total: number; high: number; medium: number; low: number };
  }>('/api/reminders/counts');
  return data.counts;
}
