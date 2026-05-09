import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { SETTINGS_PASSWORD } from '../constants';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function PasswordModal({ open, onClose, onSuccess }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  function submit() {
    if (value === SETTINGS_PASSWORD) {
      onSuccess();
    } else {
      setError('Incorrect password.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings Password" maxWidth="max-w-sm">
      <p className="mb-4 text-sm text-white/70">
        Enter the password to manage participants.
      </p>
      <label className="block">
        <span className="sr-only">Password</span>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none transition focus:border-amber-300"
          placeholder="Password"
          aria-label="Password"
          aria-invalid={!!error}
        />
      </label>
      <p className="mt-2 min-h-[1.2em] text-sm text-red-400" role="alert">
        {error}
      </p>
      <button
        onClick={submit}
        type="button"
        className="mt-3 w-full rounded-lg bg-gradient-to-b from-pink-400 to-pink-600 py-2.5 font-bold transition hover:brightness-110"
      >
        Unlock
      </button>
    </Modal>
  );
}
