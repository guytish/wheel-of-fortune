import type { Participant } from '../types';

const CSV_COLUMNS = ['Name', 'Phone', 'Details', 'Donations'] as const;

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToJsonFile(participants: Participant[]): void {
  const payload = { exportedAt: new Date().toISOString(), participants };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `wheel-of-fortune-${new Date().toISOString().slice(0, 10)}.json`);
}

/** Wraps a value in quotes when it contains a comma, quote, or line break. */
function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCsvFile(participants: Participant[]): void {
  const lines = [CSV_COLUMNS.join(',')];
  for (const p of participants) {
    lines.push(
      [
        csvEscape(p.name),
        csvEscape(p.phone || ''),
        csvEscape(p.details || ''),
        String(Math.max(0, Math.floor(p.donations))),
      ].join(',')
    );
  }
  // \r\n per RFC 4180; prepend a UTF-8 BOM so Excel opens unicode correctly.
  const csv = '﻿' + lines.join('\r\n') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `wheel-of-fortune-${new Date().toISOString().slice(0, 10)}.csv`);
}

export type ImportResult =
  | { ok: true; participants: Participant[] }
  | { ok: false; error: string };

export function parseJsonImport(text: string): ImportResult {
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
    // Accept legacy "donuts" key alongside "donations" so old exports import cleanly.
    const rawValue =
      typeof p.donations === 'number' || typeof p.donations === 'string'
        ? Number(p.donations)
        : typeof p.donuts === 'number' || typeof p.donuts === 'string'
          ? Number(p.donuts)
          : NaN;
    if (!name) continue;
    if (!Number.isFinite(rawValue) || rawValue < 0) continue;
    cleaned.push({
      id: typeof p.id === 'string' && p.id.length > 0 ? p.id : uid(),
      name,
      phone: typeof p.phone === 'string' ? p.phone : '',
      details: typeof p.details === 'string' ? p.details : '',
      donations: Math.floor(rawValue),
    });
  }

  if (cleaned.length === 0) {
    return { ok: false, error: 'No valid participants found in file.' };
  }
  return { ok: true, participants: cleaned };
}

/**
 * Minimal RFC-4180-style CSV parser. Handles quoted fields (with `""` escapes),
 * commas inside quotes, and both `\n` and `\r\n` line endings.
 */
function parseCsvRows(text: string): string[][] {
  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // Escaped quote (`""`) → literal `"`; otherwise close the quoted field.
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      // Eat the second char of a CRLF pair so we don't emit an empty row.
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseCsvImport(text: string): ImportResult {
  const rows = parseCsvRows(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length === 0) {
    return { ok: false, error: 'CSV is empty.' };
  }
  if (rows.length === 1) {
    return { ok: false, error: 'CSV needs a header row plus at least one data row.' };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const donationsIdx = header.indexOf('donations');
  const phoneIdx = header.indexOf('phone');
  const detailsIdx = header.indexOf('details');

  if (nameIdx === -1 || donationsIdx === -1) {
    return {
      ok: false,
      error: 'CSV must include "Name" and "Donations" columns.',
    };
  }

  const cleaned: Participant[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[nameIdx] || '').trim();
    if (!name) continue;
    const donationsRaw = (r[donationsIdx] || '').trim().replace(/,/g, '');
    const donations = Number(donationsRaw);
    if (!Number.isFinite(donations) || donations < 0) continue;
    cleaned.push({
      id: uid(),
      name,
      phone: phoneIdx !== -1 ? (r[phoneIdx] || '').trim() : '',
      details: detailsIdx !== -1 ? (r[detailsIdx] || '').trim() : '',
      donations: Math.floor(donations),
    });
  }

  if (cleaned.length === 0) {
    return { ok: false, error: 'No valid rows in CSV (need a Name and a non-negative Donations value).' };
  }
  return { ok: true, participants: cleaned };
}

/**
 * Picks the right parser. CSV vs JSON is decided by the filename suffix when
 * available, otherwise by sniffing the first non-whitespace character.
 */
export function parseImport(text: string, filename?: string): ImportResult {
  const lowerName = filename?.toLowerCase() ?? '';
  if (lowerName.endsWith('.csv')) return parseCsvImport(text);
  if (lowerName.endsWith('.json')) return parseJsonImport(text);

  const trimmed = text.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJsonImport(text);
  }
  return parseCsvImport(text);
}
