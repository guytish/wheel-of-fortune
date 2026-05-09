import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ThHTMLAttributes,
} from 'react';
import { Modal } from './Modal';
import type { Participant } from '../types';
import { exportToFile, parseImport } from '../lib/io';
import { calculateChances } from '../lib/wheel';

type Props = {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  onChange: (next: Participant[]) => void;
  onToast: (kind: 'success' | 'error', message: string) => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function SettingsPanel({ open, onClose, participants, onChange, onToast }: Props) {
  const [showChances, setShowChances] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of calculateChances(participants)) map.set(c.id, c.chance);
    return map;
  }, [participants]);

  function update(id: string, patch: Partial<Participant>) {
    onChange(participants.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function remove(id: string) {
    const p = participants.find((x) => x.id === id);
    const label = p?.name?.trim();
    if (label && !window.confirm(`Remove ${label}?`)) return;
    onChange(participants.filter((x) => x.id !== id));
  }

  function add() {
    onChange([
      ...participants,
      { id: uid(), name: '', phone: '', details: '', donuts: 0 },
    ]);
  }

  function clearAll() {
    if (participants.length === 0) return;
    if (!window.confirm('Remove ALL participants? This cannot be undone.')) return;
    onChange([]);
    onToast('success', 'All participants cleared.');
  }

  function doExport() {
    if (participants.length === 0) {
      onToast('error', 'Nothing to export.');
      return;
    }
    try {
      exportToFile(participants);
      onToast('success', `Exported ${participants.length} participants.`);
    } catch {
      onToast('error', 'Export failed.');
    }
  }

  function pickImport() {
    fileInputRef.current?.click();
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseImport(text);
      if (!result.ok) {
        onToast('error', result.error);
        return;
      }
      if (
        participants.length > 0 &&
        !window.confirm(
          `Replace your ${participants.length} current participant${participants.length === 1 ? '' : 's'} with ${result.participants.length} from file?`
        )
      ) {
        return;
      }
      onChange(result.participants);
      onToast(
        'success',
        `Imported ${result.participants.length} participant${result.participants.length === 1 ? '' : 's'}.`
      );
    } catch {
      onToast('error', 'Could not read file.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Participants">
      <p className="mb-4 text-sm text-white/65">
        Manage everyone on the wheel. Each donut counts toward the win chance.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-gradient-to-b from-pink-400 to-pink-600 px-3 py-2 font-bold transition hover:brightness-110"
        >
          + Add
        </button>
        <button
          type="button"
          onClick={() => setShowChances((s) => !s)}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 transition hover:bg-white/20"
        >
          {showChances ? 'Hide Chances' : 'Calculate Chances'}
        </button>
        <button
          type="button"
          onClick={doExport}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 transition hover:bg-white/20"
        >
          Export
        </button>
        <button
          type="button"
          onClick={pickImport}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 transition hover:bg-white/20"
        >
          Import
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-2 transition hover:bg-red-500/30 disabled:opacity-50"
          disabled={participants.length === 0}
        >
          Clear all
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {participants.length === 0 ? (
        <div className="py-12 text-center text-sm opacity-60">
          No participants yet. Click "+ Add" to start.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full min-w-[640px] bg-white/5">
            <thead>
              <tr className="text-xs tracking-wider text-amber-300 uppercase">
                <Th>Name *</Th>
                <Th>Phone</Th>
                <Th>Details</Th>
                <Th>Donuts *</Th>
                {showChances && <Th>Chance</Th>}
                <Th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <Row
                  key={p.id}
                  participant={p}
                  chance={chanceMap.get(p.id) ?? 0}
                  showChance={showChances}
                  onChange={(patch) => update(p.id, patch)}
                  onRemove={() => remove(p.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function Th({ children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="bg-amber-300/10 p-2.5 text-left font-semibold" {...rest}>
      {children}
    </th>
  );
}

type RowProps = {
  participant: Participant;
  chance: number;
  showChance: boolean;
  onChange: (patch: Partial<Participant>) => void;
  onRemove: () => void;
};

function Row({ participant, chance, showChance, onChange, onRemove }: RowProps) {
  const nameInvalid = !participant.name.trim();
  const cellInput =
    'w-full rounded border border-transparent bg-transparent px-2 py-1.5 outline-none focus:border-amber-300 focus:bg-black/30';

  return (
    <tr className="border-b border-white/5">
      <td className="p-2">
        <input
          value={participant.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Name"
          aria-invalid={nameInvalid}
          aria-label="Name"
          className={`${cellInput} ${nameInvalid ? 'border-red-500/50' : ''}`}
        />
      </td>
      <td className="p-2">
        <input
          value={participant.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="Optional"
          aria-label="Phone"
          className={cellInput}
        />
      </td>
      <td className="p-2">
        <input
          value={participant.details || ''}
          onChange={(e) => onChange({ details: e.target.value })}
          placeholder="Optional"
          aria-label="Details"
          className={cellInput}
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          min={0}
          step={1}
          value={participant.donuts}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange({ donuts: 0 });
              return;
            }
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            onChange({ donuts: Math.max(0, Math.floor(n)) });
          }}
          aria-label="Donuts completed"
          className={`${cellInput} max-w-24`}
        />
      </td>
      {showChance && (
        <td className="p-2 tabular-nums">{(chance * 100).toFixed(1)}%</td>
      )}
      <td className="p-2">
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-white/70 transition hover:bg-red-500/20 hover:text-red-300"
          title="Remove"
          aria-label={`Remove ${participant.name || 'participant'}`}
        >
          🗑
        </button>
      </td>
    </tr>
  );
}
