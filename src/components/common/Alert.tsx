import React from 'react';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
}) => {
  const variantConfig = {
    success: {
      containerClass: 'bg-green-50 border-green-200 text-green-800',
      titleClass: 'text-green-800',
    },
    error: {
      containerClass: 'bg-red-50 border-red-200 text-red-800',
      titleClass: 'text-red-800',
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      titleClass: 'text-yellow-800',
    },
    info: {
      containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
      titleClass: 'text-blue-800',
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={`border rounded-lg p-4 ${config.containerClass} ${className}`}>
      <div className="flex">
        <div className="flex-1">
          {title && <h3 className={`text-sm font-medium ${config.titleClass} mb-1`}>{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <span className="sr-only">Dismiss</span>×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
