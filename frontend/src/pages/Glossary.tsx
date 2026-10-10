import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import BkpkCard from '../shared/ui/BkpkCard';
import { CardGrid } from '../shared/ui/PageLayout';
import { GLOSSARY_GROUPS, STAT, type StatKey } from '../shared/lib/statGlossary';

/** „Słowniczek”: wszystkie skróty statystyk panelu z wyjaśnieniem po polsku (ze `statGlossary`). */
export default function Glossary() {
    const entries = Object.entries(STAT) as [StatKey, (typeof STAT)[StatKey]][];

    return (
        <PageContainer>
            <PageHeader
                kicker="Pomoc"
                title="Słowniczek"
                description="Co znaczą skróty i liczby w panelu. Skrót podkreślony kropkami możesz też stuknąć w tabeli."
            />
            {/* Działy jako karty — na szerokim ekranie 2–3 obok siebie */}
            <CardGrid min={440}>
                {GLOSSARY_GROUPS.map((group) => {
                    const rows = entries.filter(([, e]) => e.group === group);
                    if (!rows.length) return null;
                    return (
                        <BkpkCard key={group} variant="flat" title={group}>
                            <dl className="divide-y divide-bkpk-border-subtle -my-3">
                                {rows.map(([key, e]) => (
                                    <div key={key} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-3">
                                        <dt className="font-display text-lg leading-tight text-bkpk-text-primary">{e.perGame ?? e.short}</dt>
                                        <dd>
                                            <span className="font-semibold text-bkpk-text-primary">{e.long}</span>
                                            <p className="text-sm text-bkpk-text-secondary mt-0.5">{e.hint}</p>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </BkpkCard>
                    );
                })}
            </CardGrid>
        </PageContainer>
    );
}
