import type { ReactElement } from 'react';
import { SPIN_DURATION_MS } from '../constants';
import { arcPath, polar } from '../lib/wheel';
import type { WheelEntry } from '../types';

type Props = {
  entries: WheelEntry[];
  rotation: number;
  onSpinClick?: () => void;
  spinning: boolean;
};

const CX = 200;
const CY = 200;
const R = 198;

export function Wheel({ entries, rotation, onSpinClick, spinning }: Props) {
  const clickable = !!onSpinClick && !spinning && entries.length > 0;

  return (
    <div className="relative aspect-square w-full select-none">
      {/* Decorative outer bezel */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: '-14px',
          background:
            'conic-gradient(#fbbf24,#ec4899,#fbbf24,#ec4899,#fbbf24,#ec4899,#fbbf24)',
          boxShadow: '0 0 50px rgba(255,170,200,0.35)',
          animation: 'bezelSpin 18s linear infinite',
        }}
        aria-hidden
      />
      {/* Top pointer */}
      <div
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
        style={{
          top: '-10px',
          width: 0,
          height: 0,
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderTop: '36px solid #fbbf24',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))',
        }}
        aria-hidden
      />
      {/* Wheel itself */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[#1a0f2e]">
        <svg
          viewBox="0 0 400 400"
          className={`h-full w-full ${clickable ? 'cursor-pointer' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.16, 1)`,
            willChange: 'transform',
          }}
          onClick={clickable ? onSpinClick : undefined}
          role={clickable ? 'button' : 'img'}
          aria-label={clickable ? 'Spin the wheel' : 'Prize wheel'}
        >
          {entries.length === 0 ? (
            <EmptyWheel />
          ) : entries.length === 1 ? (
            <SingleSegment entry={entries[0]} />
          ) : (
            <Segments entries={entries} />
          )}
        </svg>
      </div>
      {/* Center hub (above wheel, ignores clicks) */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%,#fff,#fbbf24 55%,#c98a1a)',
          boxShadow: '0 0 20px rgba(0,0,0,.5),inset 0 -4px 8px rgba(0,0,0,.3)',
        }}
        aria-hidden
      />
    </div>
  );
}

function EmptyWheel() {
  return (
    <>
      <circle cx={CX} cy={CY} r={R} fill="#2a1a44" />
      <text x={CX} y={CY} textAnchor="middle" dy="0.35em" fill="#aaa" fontSize="18">
        Add participants in Settings
      </text>
    </>
  );
}

function SingleSegment({ entry }: { entry: WheelEntry }) {
  return (
    <>
      <circle cx={CX} cy={CY} r={R} fill={entry.color} />
      <text
        x={CX}
        y={CY - R * 0.5}
        textAnchor="middle"
        dy="0.35em"
        fill="#fff"
        fontSize="22"
        fontWeight="800"
      >
        {entry.name.slice(0, 20) || '(unnamed)'}
      </text>
    </>
  );
}

function Segments({ entries }: { entries: WheelEntry[] }) {
  let cursor = 0;
  const nodes: ReactElement[] = [];
  for (const p of entries) {
    const angle = p.share * 360;
    const start = cursor;
    const end = cursor + angle;
    const mid = start + angle / 2;
    cursor = end;

    const labelR = R * 0.62;
    const lp = polar(CX, CY, labelR, mid);
    const fontSize = angle < 14 ? 9 : angle < 22 ? 11 : 14;
    const maxLen = angle < 14 ? 8 : angle < 22 ? 12 : 16;
    const raw = p.name || '(unnamed)';
    const name = raw.length > maxLen ? raw.slice(0, maxLen - 1) + '…' : raw;

    nodes.push(
      <g key={p.id}>
        <path
          d={arcPath(CX, CY, R, start, end)}
          fill={p.color}
          stroke="#1a0f2e"
          strokeWidth={1.5}
        />
        <text
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dy="0.35em"
          fill="#fff"
          fontSize={fontSize}
          fontWeight={700}
          transform={`rotate(${mid}, ${lp.x}, ${lp.y})`}
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
      </g>
    );
  }
  return <>{nodes}</>;
}
