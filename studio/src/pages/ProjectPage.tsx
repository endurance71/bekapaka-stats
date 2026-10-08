import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { keys, useAssets, useCatalog, usePartners, usePlayers } from '../lib/queries';
import type { View } from '../lib/types';
import GraphicEditor from '../features/graphic-editor/GraphicEditor';
import NotFound from './NotFound';

export default function ProjectPage() {
  const { id = '' } = useParams();
  const project = useQuery({
    queryKey: keys.project(id),
    queryFn: () => api<View>(`/projects/${id}`),
    // Every visit starts from the newest server revision; the editor owns the draft afterwards.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
  const catalog = useCatalog();
  const assets = useAssets();
  const partners = usePartners();
  const players = usePlayers();

  if (project.isError) return <NotFound />;
  if (!project.isFetchedAfterMount || !project.data || !catalog.data)
    return <div className="loading">Otwieram projekt…</div>;
  return (
    <GraphicEditor
      key={id}
      initial={project.data}
      posts={catalog.data.posts}
      templates={catalog.data.templates}
      assets={assets.data || []}
      partners={partners.data || []}
      players={players.data || []}
    />
  );
}
