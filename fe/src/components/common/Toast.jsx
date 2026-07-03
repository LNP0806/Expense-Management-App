import { CheckCircle, XCircle, Info, Warning, X } from '@phosphor-icons/react';
import { useToast } from '../../context/ToastContext';

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} weight="fill" className="text-income" />;
      case 'error':
        return <XCircle size={20} weight="fill" className="text-error" />;
      case 'warning':
        return <Warning size={20} weight="fill" className="text-warning" />;
      case 'info':
      default:
        return <Info size={20} weight="fill" className="text-info" />;
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[2000] flex flex-col gap-2 max-w-[360px] w-[calc(100vw-32px)] md:w-auto left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-elevated-dark border border-border-dark rounded-xl p-4 flex items-start gap-3 shadow-2xl animate-slide-down"
        >
          <div className="flex-shrink-0 flex">{getIcon(toast.type)}</div>
          <div className="text-sm text-text-primary grow text-left">{toast.message}</div>
          <button 
            className="bg-transparent border-none text-text-muted cursor-pointer flex mt-0.5 transition-colors duration-150 hover:text-text-primary" 
            onClick={() => removeToast(toast.id)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
