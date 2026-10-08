import { useParams } from 'react-router';
import PublicationEditor from '../features/publications/PublicationEditor';
import { usePublication } from '../features/publications/usePublication';
import NotFound from './NotFound';

export default function PublicationPage() {
  const { id = '' } = useParams();
  const publication = usePublication(id);
  if (publication.isError) return <NotFound />;
  if (!publication.data) return <div className="loading">Otwieram publikację…</div>;
  return <PublicationEditor key={id} publication={publication.data} apply={publication.apply} />;
}
