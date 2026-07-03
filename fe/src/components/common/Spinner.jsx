export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div 
      className={`border-white/5 border-t-accent-green rounded-full animate-spin inline-block ${sizes[size]} ${className}`} 
      role="status" 
    />
  );
}
