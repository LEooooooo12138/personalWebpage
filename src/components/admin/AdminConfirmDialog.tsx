"use client";

import { AdminModal } from "./AdminModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
};

export function AdminConfirmDialog({
  open, onClose, onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure? This action cannot be undone.",
}: Props) {
  return (
    <AdminModal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 text-sm leading-relaxed mb-8">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm shadow-red-500/20"
        >
          Delete
        </button>
      </div>
    </AdminModal>
  );
}
