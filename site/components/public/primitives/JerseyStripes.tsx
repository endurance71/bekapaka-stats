/** Paski stroju A: poziome, wygaszane ku górze. Separator, nigdy tło pod tekstem. */
export function JerseyStripes({ className = '' }: { className?: string }) {
  return (
    <div className={`jersey-stripes ${className}`.trim()} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}
