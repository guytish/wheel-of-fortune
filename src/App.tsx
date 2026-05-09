import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './components/Modal';
import { PasswordModal } from './components/PasswordModal';
import { SettingsPanel } from './components/SettingsPanel';
import { Wheel } from './components/Wheel';
import { SPIN_DURATION_MS, WHEEL_COLORS } from './constants';
import {
  buildWheelEntries,
  computeTargetRotation,
  pickWeightedIndex,
} from './lib/wheel';
import { loadParticipants, saveParticipants } from './lib/storage';
import type { Participant, WheelEntry } from './types';

type Toast = { id: number; kind: 'success' | 'error'; message: string };

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(() =>
    loadParticipants()
  );
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelEntry | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const spinTimerRef = useRef<number | null>(null);

  // Persist participants to localStorage whenever they change.
  useEffect(() => {
    saveParticipants(participants);
  }, [participants]);

  // Cancel any pending spin timer on unmount.
  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  const entries = useMemo(
    () => buildWheelEntries(participants, WHEEL_COLORS),
    [participants]
  );

  const totalDonuts = useMemo(
    () => participants.reduce((s, p) => s + Math.max(0, p.donuts), 0),
    [participants]
  );

  const canSpin = entries.length > 0 && !spinning;

  function pushToast(kind: 'success' | 'error', message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }

  function handleSpin() {
    if (!canSpin) return;
    const idx = pickWeightedIndex(entries);
    if (idx < 0) return;
    const chosen = entries[idx];
    const target = computeTargetRotation(rotation, entries, idx);

    setRotation(target);
    setSpinning(true);

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
    }
    // Buffer the timer slightly past the CSS transition end so reveal is reliable.
    spinTimerRef.current = window.setTimeout(() => {
      spinTimerRef.current = null;
      setSpinning(false);
      setWinner(chosen);
    }, SPIN_DURATION_MS + 200);
  }

  function openSettingsFlow() {
    setPwOpen(true);
  }

  function onPasswordSuccess() {
    setPwOpen(false);
    setSettingsOpen(true);
  }

  let helper: string | null = null;
  if (participants.length === 0) {
    helper = 'Open settings (bottom-right) to add participants.';
  } else if (totalDonuts === 0) {
    helper =
      'No donuts logged yet. Add donut counts in settings to enable spinning.';
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-6 pb-28">
      <h1 className="bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-center text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
        🍩 Donut Wheel of Fortune
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-white/70 sm:text-base">
        Spin to pick a winner. More donuts = better odds.
      </p>

      <div className="w-full max-w-[560px] px-2">
        <Wheel
          entries={entries}
          rotation={rotation}
          spinning={spinning}
          onSpinClick={canSpin ? handleSpin : undefined}
        />
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={!canSpin}
        className="mt-7 rounded-full bg-gradient-to-b from-pink-400 to-pink-600 px-12 py-3.5 text-lg font-extrabold tracking-[3px] shadow-[0_8px_22px_rgba(233,78,133,.5)] transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {spinning ? 'SPINNING…' : 'SPIN'}
      </button>

      {helper && (
        <p className="mt-4 max-w-md text-center text-sm text-amber-200/80">{helper}</p>
      )}

      <button
        type="button"
        onClick={openSettingsFlow}
        className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:bg-white/20"
        aria-label="Open settings"
        title="Settings"
      >
        ⚙
      </button>

      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onSuccess={onPasswordSuccess}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        participants={participants}
        onChange={setParticipants}
        onToast={pushToast}
      />

      <Modal open={!!winner} onClose={() => setWinner(null)} maxWidth="max-w-md">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-amber-300">🎉 Winner!</h2>
          <div className="my-4 break-words bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-4xl leading-tight font-extrabold text-transparent sm:text-5xl">
            {winner?.name || '(unnamed)'}
          </div>
          <p className="mb-1 text-white/80">
            🍩 {winner?.donuts ?? 0} donut{winner?.donuts === 1 ? '' : 's'}
          </p>
          {winner?.phone && (
            <p className="text-sm text-white/70">📞 {winner.phone}</p>
          )}
          {winner?.details && (
            <p className="mt-1 text-sm text-white/70">{winner.details}</p>
          )}
          <button
            type="button"
            onClick={() => setWinner(null)}
            className="mt-6 w-full rounded-lg bg-gradient-to-b from-pink-400 to-pink-600 py-2.5 font-bold transition hover:brightness-110"
          >
            Close
          </button>
        </div>
      </Modal>

      <div className="pointer-events-none fixed top-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.kind === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
