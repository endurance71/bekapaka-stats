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
      className="flex min-w-0 flex-col items-center text-center"
    >
      <div
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-xl font-black sm:h-16 sm:w-16 sm:text-2xl md:h-20 md:w-20 md:text-3xl',
          variant === 'home'
            ? 'border-bkpk-primary/30 bg-bkpk-surface-tint-2 text-bkpk-primary'
            : 'border-bkpk-border-strong bg-bkpk-surface-tint-2 text-bkpk-text-primary'
        )}
      >
        {team.name.charAt(0)}
      </div>
      <h1 className="mt-2 line-clamp-2 w-full px-0.5 font-outfit text-xs font-black leading-tight sm:text-sm md:text-lg">
        {team.name}
      </h1>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
        <span className="rounded-full border border-bkpk-border-strong bg-bkpk-surface-tint-4 px-2 py-0.5 text-[10px] font-bold tabular-nums text-bkpk-text-secondary">
          {team.record}
        </span>
        {team.rank ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-bkpk-text-muted">
            {team.rank}. miejsce
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export function ScoutingMatchHeader({ bekapaka, opponent }: ScoutingMatchHeaderProps) {
  return (
    <div className="relative flex flex-col items-center gap-4">
      <span className="rounded-full border border-bkpk-primary/25 bg-bkpk-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-bkpk-primary">
        Scouting
      </span>

      <div className="grid w-full max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 md:max-w-2xl">
        <TeamColumn team={bekapaka} variant="home" />
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-bkpk-border-strong bg-bkpk-navy-light/80 font-outfit text-xs font-black uppercase tracking-wider text-bkpk-text-muted sm:h-11 sm:w-11 sm:text-sm"
          aria-hidden
        >
          VS
        </div>
        <TeamColumn team={opponent} variant="away" />
      </div>
    </div>
  );
}
