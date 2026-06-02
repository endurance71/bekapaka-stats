import BkpkCard from '../../shared/ui/BkpkCard';
import { Crosshair } from 'lucide-react';
import { usePortraitMobile } from '../../hooks/useIsMobile';
import { MatchupRadar } from './MatchupRadar';
import { MatchupStatCards } from './MatchupStatCards';

interface TeamStats {
  name: string;
  ppg: number;
  oppg: number;
  winPct: number;
  pace: number;
  threePtPct: number;
}

interface MatchupComparisonProps {
  opponent: TeamStats;
  bekapaka: TeamStats;
}

/** Karty na wąskim ekranie w pionie; radar + karty na desktopie. */
export function MatchupComparison({ opponent, bekapaka }: MatchupComparisonProps) {
  const useCardsOnly = usePortraitMobile();

  if (useCardsOnly) {
    return (
      <BkpkCard
        title="Porównanie drużyn"
        icon={<Crosshair className="h-5 w-5 text-bkpk-primary" />}
        variant="glass"
        overflowVisible
      >
        <MatchupStatCards opponent={opponent} bekapaka={bekapaka} />
      </BkpkCard>
    );
  }

  return <MatchupRadar opponent={opponent} bekapaka={bekapaka} />;
}
