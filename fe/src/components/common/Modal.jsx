import { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizes = {
    sm: 'max-w-[400px]',
    md: 'max-w-[500px]',
    lg: 'max-w-[640px]',
    full: 'max-w-[500px] h-[90vh] mt-[10vh] rounded-b-none md:max-w-[500px] md:h-auto md:mt-0 md:rounded-2xl max-w-full h-full mt-0 rounded-none',
  };

  return (
    <div 
      className="fixed inset-0 bg-primary-dark/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-fade-in" 
      onClick={handleOverlayClick}
    >
      <div className={`bg-secondary-dark border border-border-dark rounded-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl animate-scale-up overflow-hidden ${sizes[size]}`}>
        <div className="p-4 md:px-6 border-b border-border-dark flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button 
            className="bg-transparent border-none text-text-secondary cursor-pointer flex p-1.5 rounded-lg transition-all duration-150 hover:bg-tertiary-dark hover:text-text-primary" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto grow">{children}</div>
        {footer && <div className="p-4 md:px-6 border-t border-border-dark bg-tertiary-dark flex justify-end gap-4">{footer}</div>}
      </div>
    </div>
  );
}
