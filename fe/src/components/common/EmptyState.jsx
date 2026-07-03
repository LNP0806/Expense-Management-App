export default function EmptyState({ icon = null, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-text-secondary">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      {title && <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>}
      {description && <p className="text-sm text-text-muted mb-6 max-w-[32ch]">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
