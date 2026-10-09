import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import BkpkCard from '../shared/ui/BkpkCard';
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
            <div className="space-y-8">
                {GLOSSARY_GROUPS.map((group) => {
                    const rows = entries.filter(([, e]) => e.group === group);
                    if (!rows.length) return null;
                    return (
                        <section key={group} aria-labelledby={`slowniczek-${group}`} className="space-y-3">
                            <h2 id={`slowniczek-${group}`} className="text-[22px] text-bkpk-text-primary">
                                {group}
                            </h2>
                            <BkpkCard variant="flat" padding="none" className="overflow-hidden bg-bkpk-bg">
                                <dl className="divide-y divide-bkpk-border-subtle">
                                    {rows.map(([key, e]) => (
                                        <div key={key} className="grid grid-cols-[5.5rem_1fr] gap-x-4 px-4 py-3">
                                            <dt className="font-display text-lg leading-tight text-bkpk-text-primary">{e.perGame ?? e.short}</dt>
                                            <dd>
                                                <span className="font-semibold text-bkpk-text-primary">{e.long}</span>
                                                <p className="text-sm text-bkpk-text-secondary mt-0.5">{e.hint}</p>
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </BkpkCard>
                        </section>
                    );
                })}
            </div>
        </PageContainer>
    );
}
