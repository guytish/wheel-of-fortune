import type { Participant } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function exportToFile(participants: Participant[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    participants,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wheel-of-fortune-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; participants: Participant[] }
  | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  // Accept both a bare array of participants and a wrapped { participants: [...] } object.
  const list: unknown = Array.isArray(data)
    ? data
    : (data as { participants?: unknown } | null)?.participants;

  if (!Array.isArray(list)) {
    return { ok: false, error: 'No participants array found in file.' };
  }

  const cleaned: Participant[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    const name = typeof p.name === 'string' ? p.name.trim() : '';
    const donutsRaw = typeof p.donuts === 'number' ? p.donuts : Number(p.donuts);
    if (!name) continue;
    if (!Number.isFinite(donutsRaw) || donutsRaw < 0) continue;
    cleaned.push({
      id: typeof p.id === 'string' && p.id.length > 0 ? p.id : uid(),
      name,
      phone: typeof p.phone === 'string' ? p.phone : '',
      details: typeof p.details === 'string' ? p.details : '',
      donuts: Math.floor(donutsRaw),
    });
  }

  if (cleaned.length === 0) {
    return { ok: false, error: 'No valid participants found in file.' };
  }
  return { ok: true, participants: cleaned };
}
