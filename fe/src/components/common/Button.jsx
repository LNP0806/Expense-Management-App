import Spinner from './Spinner';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  children,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const baseStyle = 'inline-flex items-center justify-center gap-2 font-sans font-medium rounded-xl border border-transparent cursor-pointer transition-all duration-150 select-none min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-accent-green text-primary-dark hover:bg-accent-green-hover hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-[0.98]',
    secondary: 'bg-tertiary-dark border border-border-dark text-text-primary hover:bg-hover-dark hover:border-border-dark-light active:scale-[0.98]',
    danger: 'bg-expense text-text-primary hover:opacity-90 active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary hover:bg-tertiary-dark hover:text-text-primary',
  };

  const sizes = {
    sm: 'text-xs px-4 min-h-[36px]',
    md: 'text-sm px-6',
    lg: 'text-base px-8 min-h-[52px]',
  };

  const widthStyle = fullWidth ? 'w-full flex' : '';

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" className="animate-spin" />
      ) : (
        <>
          {icon && <span className="inline-flex items-center justify-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
