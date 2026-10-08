import { STAT, type StatKey } from '../lib/statGlossary';
import BkpkTooltip from './BkpkTooltip';
import { cn } from '../lib/utils';

/**
 * Skrót statystyki z wyjaśnieniem: na komputerze dymek po najechaniu, na telefonie po stuknięciu.
 * `perGame` = skrót średniej („Pkt/m”), domyślnie skrót z tabeli („Pkt”).
 */
export default function StatLabel({ k, perGame = false, className }: { k: StatKey; perGame?: boolean; className?: string }) {
    const entry = STAT[k];
    const text = perGame ? entry.perGame ?? entry.short : entry.short;
    return (
        <BkpkTooltip content={`${entry.long} — ${entry.hint}`} className={cn('underline decoration-dotted decoration-from-font underline-offset-2', className)}>
            <abbr title={entry.long} className="no-underline">
                {text}
            </abbr>
        </BkpkTooltip>
    );
}
