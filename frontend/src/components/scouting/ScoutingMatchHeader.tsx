import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';

interface TeamSide {
  name: string;
  record: string;
  rank: number | null;
}

interface ScoutingMatchHeaderProps {
  bekapaka: TeamSide;
  opponent: TeamSide;
}

function TeamColumn({
  team,
  variant
}: {
  team: TeamSide;
  variant: 'home' | 'away';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex min-w-0 flex-col gap-3',
        variant === 'home' ? 'items-start text-left' : 'items-end text-right'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center border-[1.5px] font-display text-2xl sm:h-14 sm:w-14 sm:text-[28px] md:h-16 md:w-16 md:text-[32px]',
          variant === 'home'
            ? 'border-bkpk-primary bg-bkpk-primary text-bkpk-on-primary'
            : 'border-bkpk-border-strong text-bkpk-text-primary'
        )}
      >
        {team.name.charAt(0)}
      </div>
      <h2
        className={cn(
          'line-clamp-2 w-full font-display text-xl leading-[0.95] uppercase sm:text-2xl md:text-[32px]',
          variant === 'home' ? 'text-bkpk-text-primary' : 'text-bkpk-text-secondary'
        )}
      >
        {team.name}
      </h2>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          variant === 'home' ? 'justify-start' : 'justify-end'
        )}
      >
        <span className="status-flag tabular-nums text-bkpk-text-secondary">
          {team.record}
        </span>
        {team.rank ? (
          <span className="label-caps text-[11px] text-bkpk-text-muted">
            {team.rank}. miejsce
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export function ScoutingMatchHeader({ bekapaka, opponent }: ScoutingMatchHeaderProps) {
  // BeKaPaKa zawsze po lewej (Brandbook 2.0) — płaski panel z linią zamiast poświaty
  return (
    <div className="relative border border-bkpk-border-subtle bg-bkpk-surface px-4 py-5 sm:px-6 sm:py-6 md:px-8">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
        <TeamColumn team={bekapaka} variant="home" />
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-bkpk-border-strong font-display text-sm uppercase text-bkpk-text-muted sm:h-12 sm:w-12 sm:text-base"
          aria-hidden
        >
          VS
        </div>
        <TeamColumn team={opponent} variant="away" />
      </div>
    </div>
  );
}
