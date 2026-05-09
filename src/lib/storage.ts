import { STORAGE_KEY } from '../constants';
import type { Participant } from '../types';

function isValidParticipant(x: unknown): x is Participant {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.donuts === 'number' &&
    Number.isFinite(p.donuts) &&
    p.donuts >= 0
  );
}

export function loadParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidParticipant).map((p) => ({
      id: p.id,
      name: p.name,
      phone: typeof p.phone === 'string' ? p.phone : '',
      details: typeof p.details === 'string' ? p.details : '',
      donuts: Math.max(0, Math.floor(p.donuts)),
    }));
  } catch {
    return [];
  }
}

export function saveParticipants(list: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable or full — fail silently
  }
}
