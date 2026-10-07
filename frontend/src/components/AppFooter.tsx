import { cn } from '../shared/lib/utils'
import { JerseyStripes } from '../shared/ui/JerseyStripes'

type AppFooterProps = {
  className?: string
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={cn('text-xs text-bkpk-text-muted space-y-1.5', className)}>
      <JerseyStripes className="max-w-[96px] mb-3" />
      <p className="label-caps text-[11px] text-bkpk-text-secondary">BeKaPaKa Bobolice — BKPK</p>
      <a
        href="https://bekapaka.pl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center min-h-[44px] underline decoration-bkpk-primary decoration-2 underline-offset-4 hover:text-bkpk-text-primary transition-colors"
      >
        bekapaka.pl
      </a>
      <p>© 2026 by MT HUB Damian Motyliński</p>
      <a
        href="mailto:kontakt@damianmotylinski.pl"
        className="flex items-center min-h-[44px] hover:text-bkpk-text-primary transition-colors break-all"
      >
        kontakt@damianmotylinski.pl
      </a>
    </footer>
  )
}
