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
    <div className={`empty-state empty-state--${mode}`} role={mode === 'error' ? 'alert' : undefined}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
