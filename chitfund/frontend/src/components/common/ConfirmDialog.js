import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          <ExclamationTriangleIcon className={`w-7 h-7 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
