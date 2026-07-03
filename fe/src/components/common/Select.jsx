export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Chọn một tùy chọn',
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
        <select
          id={id}
          className={`w-full bg-secondary-dark border text-text-primary font-sans text-base px-4 py-2 pr-10 rounded-xl transition-all duration-150 min-h-[48px] focus:outline-hidden focus:bg-tertiary-dark focus:ring-1 appearance-none 
            bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")] 
            bg-[position:right_16px_center] bg-[size:16px] bg-no-repeat
            ${error 
              ? 'border-expense focus:border-expense focus:ring-expense' 
              : 'border-border-dark focus:border-accent-green focus:ring-accent-green'
            }`}
          value={value}
          onChange={onChange}
          {...rest}
        >
          {placeholder && <option value="" className="bg-secondary-dark text-text-secondary">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-secondary-dark text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="text-[11px] text-expense mt-0.5">{error}</span>}
    </div>
  );
}
