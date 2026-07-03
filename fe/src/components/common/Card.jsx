export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick = null,
  ...rest
}) {
  const isClickable = !!onClick;
  
  const paddings = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-secondary-dark border border-border-dark rounded-xl transition-all duration-250 overflow-hidden 
        ${paddings[padding]} 
        ${hover ? 'hover:-translate-y-0.5 hover:border-border-dark-light hover:shadow-md' : ''} 
        ${isClickable ? 'cursor-pointer' : ''} 
        ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
