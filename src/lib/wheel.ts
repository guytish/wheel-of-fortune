import { MIN_FULL_SPINS } from '../constants';
import type { ChanceResult, Participant, WheelEntry } from '../types';

/** Per-participant winning probability, including those with zero donuts (chance = 0). */
export function calculateChances(participants: Participant[]): ChanceResult[] {
  const total = participants.reduce((sum, p) => sum + Math.max(0, p.donuts), 0);
  return participants.map((p) => ({
    id: p.id,
    name: p.name,
    donuts: p.donuts,
    chance: total > 0 ? Math.max(0, p.donuts) / total : 0,
  }));
}

/** Wheel segments: only participants with > 0 donuts; each share is the fraction of total donuts. */
export function buildWheelEntries(
  participants: Participant[],
  colors: readonly string[]
): WheelEntry[] {
  const eligible = participants.filter((p) => Math.max(0, p.donuts) > 0);
  const total = eligible.reduce((sum, p) => sum + p.donuts, 0);
  if (total === 0) return [];
  return eligible.map((p, i) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    details: p.details,
    donuts: p.donuts,
    share: p.donuts / total,
    color: colors[i % colors.length],
  }));
}

/** Picks a winner index using the entries' shares as weights. */
export function pickWeightedIndex(entries: WheelEntry[]): number {
  if (entries.length === 0) return -1;
  const total = entries.reduce((sum, e) => sum + e.share, 0);
  let r = Math.random() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i].share;
    if (r <= 0) return i;
  }
  return entries.length - 1;
}

/**
 * Computes the next absolute wheel rotation (in degrees) so that the chosen
 * winner's segment lands under the fixed top pointer.
 *
 * The wheel is drawn clockwise starting at 0° (12 o'clock). The pointer is fixed
 * at 0°. After rotating by R, a segment at angle θ ends up at (θ + R) mod 360.
 * For the winner's mid-angle θ_w to land at 0, we need R ≡ -θ_w (mod 360).
 * We add a small jitter inside the slice so the pointer doesn't always land
 * dead-center, plus several full rotations for visual drama.
 */
export function computeTargetRotation(
  current: number,
  entries: WheelEntry[],
  winnerIdx: number,
  minSpins: number = MIN_FULL_SPINS
): number {
  let cursor = 0;
  for (let i = 0; i < winnerIdx; i++) cursor += entries[i].share * 360;
  const sliceAngle = entries[winnerIdx].share * 360;
  const mid = cursor + sliceAngle / 2;
  // Land randomly within the inner 60% of the slice (±30% from center) so it
  // never visually clips the slice boundary.
  const jitter = (Math.random() - 0.5) * sliceAngle * 0.6;

  const targetMod = (((360 - mid - jitter) % 360) + 360) % 360;
  const curMod = ((current % 360) + 360) % 360;
  const delta = ((targetMod - curMod + 360) % 360) + minSpins * 360;
  return current + delta;
}

export function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}
