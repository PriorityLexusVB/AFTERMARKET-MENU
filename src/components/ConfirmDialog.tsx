import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      icon: '⚠️',
    },
    warning: {
      bg: 'bg-yellow-600',
      hover: 'hover:bg-yellow-700',
      icon: '⚡',
    },
    info: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      icon: 'ℹ️',
    },
  };

  const style = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full animate-scale-in">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{style.icon}</span>
              <div>
                <h3 className="text-xl font-teko tracking-wider text-white">
                  {title}
                </h3>
                <p className="text-gray-300 mt-2 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-md font-semibold text-sm hover:bg-gray-600 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 ${style.bg} text-white rounded-md font-semibold text-sm ${style.hover} transition-colors`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
