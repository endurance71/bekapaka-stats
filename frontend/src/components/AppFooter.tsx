import { cn } from '../shared/lib/utils'
import { JerseyStripes } from '../shared/ui/JerseyStripes'
import shipappLogoUrl from '../assets/brand/shipapp-logo-white.svg'

type AppFooterProps = {
  className?: string
}

/** Stopka jak na bekapaka.pl: nazwa organizacji + „Powered by ShipApp”. */
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
      <p>© {new Date().getFullYear()} Bobolicki Klub Przyjaciół Koszykówki „Bekapaka”</p>
      <a
        href="https://shipapp.pl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 min-h-[44px] hover:text-bkpk-text-primary transition-colors"
      >
        Powered by
        <img src={shipappLogoUrl} alt="ShipApp" width={78} height={16} className="h-4 w-auto" loading="lazy" />
      </a>
    </footer>
  )
}
