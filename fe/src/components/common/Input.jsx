export default function Input({
  label,
  error,
  helperText,
  icon = null,
  type = 'text',
  id,
  className = '',
  value,
  onChange,
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 mb-4 w-full text-left ${className}`}>
      {label && (
        <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-4 text-text-muted flex items-center justify-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`w-full bg-secondary-dark border text-text-primary font-sans text-base px-4 py-2 rounded-xl transition-all duration-150 min-h-[48px] focus:outline-hidden focus:bg-tertiary-dark focus:ring-1 
            ${icon ? 'pl-12' : ''} 
            ${error 
              ? 'border-expense focus:border-expense focus:ring-expense' 
              : 'border-border-dark focus:border-accent-green focus:ring-accent-green'
            }`}
          value={value}
          onChange={onChange}
          {...rest}
        />
      </div>
      {error && <span className="text-[11px] text-expense mt-0.5">{error}</span>}
      {!error && helperText && <span className="text-[11px] text-text-muted">{helperText}</span>}
    </div>
  );
}
