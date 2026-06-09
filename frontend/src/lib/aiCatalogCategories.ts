export const AI_CATEGORY_SLUGS = ['zespol', 'mecze', 'zawodnicy', 'scouting'] as const;

export type AiCategorySlug = (typeof AI_CATEGORY_SLUGS)[number];

export interface AiCategoryMeta {
  slug: AiCategorySlug;
  label: string;
  description: string;
}

export const AI_CATEGORIES: AiCategoryMeta[] = [
  {
    slug: 'zespol',
    label: 'Zespół',
    description: 'Briefing tygodniowy i priorytety drużyny'
  },
  {
    slug: 'mecze',
    label: 'Mecze',
    description: 'Analizy rozegranych spotkań z box score'
  },
  {
    slug: 'zawodnicy',
    label: 'Zawodnicy',
    description: 'Plany rozwoju i rekomendacje treningowe'
  },
  {
    slug: 'scouting',
    label: 'Scouting',
    description: 'Raporty rywali przed nadchodzącymi meczami'
  }
];

const SLUG_TO_LABEL: Record<AiCategorySlug, string> = {
  zespol: 'Zespół',
  mecze: 'Mecze',
  zawodnicy: 'Zawodnicy',
  scouting: 'Scouting'
};

const LABEL_TO_SLUG: Record<string, AiCategorySlug> = {
  Zespół: 'zespol',
  Mecze: 'mecze',
  Zawodnicy: 'zawodnicy',
  Scouting: 'scouting'
};

export function isValidAiCategorySlug(slug: string | undefined): slug is AiCategorySlug {
  return AI_CATEGORY_SLUGS.includes(slug as AiCategorySlug);
}

export function categoryLabelFromSlug(slug: AiCategorySlug): string {
  return SLUG_TO_LABEL[slug];
}

export function categorySlugFromLabel(label: string): AiCategorySlug | null {
  return LABEL_TO_SLUG[label] ?? null;
}

export function getCategoryMeta(slug: AiCategorySlug): AiCategoryMeta {
  return AI_CATEGORIES.find((c) => c.slug === slug)!;
}
