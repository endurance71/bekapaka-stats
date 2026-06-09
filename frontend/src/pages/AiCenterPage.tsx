import { Navigate, useParams } from 'react-router-dom';
import AiCatalogHub from '../components/ai/AiCatalogHub';
import { isValidAiCategorySlug } from '../lib/aiCatalogCategories';

export default function AiCenterPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();

  if (categorySlug && !isValidAiCategorySlug(categorySlug)) {
    return <Navigate to="/ai" replace />;
  }

  return (
    <div className="bg-bkpk-bg p-3 sm:p-4 md:p-8 lg:p-12">
      <div className="max-w-[1000px] mx-auto">
        <AiCatalogHub categorySlug={categorySlug} />
      </div>
    </div>
  );
}
