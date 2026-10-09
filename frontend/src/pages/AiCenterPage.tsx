import { Navigate, useParams } from 'react-router-dom';
import AiCatalogHub from '../components/ai/AiCatalogHub';
import PageContainer from '../shared/ui/PageContainer';
import { isValidAiCategorySlug, type AiCategorySlug } from '../lib/aiCatalogCategories';

export default function AiCenterPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();

  if (categorySlug && !isValidAiCategorySlug(categorySlug)) {
    return <Navigate to="/ai" replace />;
  }

  return (
    <PageContainer>
        <AiCatalogHub
          categorySlug={
            categorySlug && isValidAiCategorySlug(categorySlug)
              ? (categorySlug as AiCategorySlug)
              : undefined
          }
        />
    </PageContainer>
  );
}
