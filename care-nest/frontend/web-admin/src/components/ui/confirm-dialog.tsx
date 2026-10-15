'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './button';
import { Modal } from './modal';
import { Input } from './input';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmText = 'Confirm',
  cancelText = 'Cancel', variant = 'danger', requireReason, reasonPlaceholder,
  loading,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');

  async function handleConfirm() {
    if (requireReason && !reason.trim()) return;
    await onConfirm(requireReason ? reason : undefined);
    setReason('');
  }

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>{cancelText}</Button>
          <Button variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'} onClick={handleConfirm} loading={loading} disabled={requireReason && !reason.trim()}>
            {confirmText}
          </Button>
        </>
      }
    >
      {description && <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>{description}</p>}
      {requireReason && (
        <Input
          label="Reason"
          placeholder={reasonPlaceholder || 'Enter reason...'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          error={requireReason && !reason.trim() ? 'Reason is required' : undefined}
        />
      )}
    </Modal>
  );
}
