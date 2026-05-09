import { useEffect, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Tailwind max-width class, e.g. "max-w-md" */
  maxWidth?: string;
};

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a0f2e] p-6 shadow-2xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl leading-none text-white/60 hover:text-white"
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        {title && <h2 className="mb-4 pr-8 text-xl font-bold text-amber-300">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
