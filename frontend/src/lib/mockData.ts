import { DriverEmployee, Trip, TripEnrollment, TripSettlement, TripExpense } from '../types';

export const initialDrivers: DriverEmployee[] = [];
export const initialTrips: Trip[] = [];
export const initialExpenses: TripExpense[] = [];
export const initialSettlements: TripSettlement[] = [];
export const initialEnrollments: TripEnrollment[] = [];

// Helper to load/save in localStorage if offline/fallback
const STORAGE_PREFIX = 'villalemon_';

export const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

export const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error:', e);
  }
};

// Purge any old dummy storage from previous previews
export const clearLegacyMockStorage = (): void => {
  try {
    const keys = ['trips', 'drivers', 'expenses', 'settlements', 'enrollments'];
    keys.forEach(k => {
      const stored = localStorage.getItem(STORAGE_PREFIX + k);
      if (stored && (stored.includes('Anjali') || stored.includes('Manu') || stored.includes('VH-028'))) {
        localStorage.removeItem(STORAGE_PREFIX + k);
      }
    });
  } catch {
    // Ignore
  }
};

clearLegacyMockStorage();
