import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
};

const toneStyles: Record<
  ConfirmTone,
  { iconWrap: string; confirmClass: string; kicker: string }
> = {
  danger: {
    iconWrap: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    confirmClass: 'btn btn-danger',
    kicker: 'Confirm delete',
  },
  warning: {
    iconWrap: 'bg-amber-50 text-amber-700',
    confirmClass: 'btn btn-primary',
    kicker: 'Please confirm',
  },
  info: {
    iconWrap: 'bg-teal-50 text-teal-800',
    confirmClass: 'btn btn-primary',
    kicker: 'Please confirm',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const styles = toneStyles[tone];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-ink)]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="page-kicker !normal-case !tracking-normal">{styles.kicker}</p>
              <h3
                id="confirm-dialog-title"
                className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]"
              >
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost !px-2 !py-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-5 py-4">
          <p
            id="confirm-dialog-message"
            className="text-sm font-semibold leading-relaxed text-[var(--color-ink)]"
          >
            {message}
          </p>
          {detail ? (
            <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
              {detail}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-line)] bg-[var(--color-surface-muted)]/70 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`${styles.confirmClass} w-full sm:w-auto`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
