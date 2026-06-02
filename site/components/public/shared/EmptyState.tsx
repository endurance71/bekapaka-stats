export function EmptyState({
  title,
  description,
  mode = 'empty'
}: {
  title: string
  description: string
  mode?: 'empty' | 'error'
}) {
  return (
    <div className={`empty-state empty-state--${mode}`}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
