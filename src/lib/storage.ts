import { STORAGE_KEY } from '../constants';
import type { Participant } from '../types';

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function toParticipant(x: unknown): Participant | null {
  if (!isObj(x)) return null;
  if (typeof x.id !== 'string' || typeof x.name !== 'string') return null;
  // Accept either the new "donations" field or the legacy "donuts" field.
  const raw =
    typeof x.donations === 'number'
      ? x.donations
      : typeof x.donuts === 'number'
        ? x.donuts
        : NaN;
  if (!Number.isFinite(raw) || raw < 0) return null;
  return {
    id: x.id,
    name: x.name,
    phone: typeof x.phone === 'string' ? x.phone : '',
    details: typeof x.details === 'string' ? x.details : '',
    donations: Math.max(0, Math.floor(raw)),
  };
}

export function loadParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(toParticipant)
      .filter((p): p is Participant => p !== null);
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
