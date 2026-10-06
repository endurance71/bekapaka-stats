export function EmptyState({
  title,
  description,
  mode = 'empty',
  action
}: {
  title: string
  description: string
  mode?: 'empty' | 'error'
  action?: React.ReactNode
}) {
  return (
    <div className={`empty-state empty-state--${mode}`}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state__action" style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  )
}
