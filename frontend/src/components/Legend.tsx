type LegendItem = { term: string; desc: string };

type LegendProps = {
  title?: string;
  items: LegendItem[];
};

export default function Legend({ title = 'Legenda', items }: LegendProps) {
  return (
    <div className="mt-3 p-3 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl">
      <div className="font-bold mb-2 text-bkpk-text-primary">{title}</div>
      <ul className="grid gap-1.5 list-none">
        {items.map((item) => (
          <li key={item.term} className="grid grid-cols-[90px_1fr] gap-2.5 text-xs text-bkpk-text-muted">
            <span className="font-semibold text-bkpk-text-primary">{item.term}</span>
            <span className="leading-snug">{item.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
