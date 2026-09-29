import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Loader, TextInput, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

const SUPPORTED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function withBackendUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${window.strapi?.backendURL || ''}${url}`;
}

function versionedUrl(url, version) {
  if (!version) return withBackendUrl(url);
  const absoluteUrl = withBackendUrl(url);
  const separator = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${separator}updated=${version}`;
}

const RotatePage = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(null);
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get('/upload/files', {
        params: {
          sort: 'updatedAt:DESC',
          page: 1,
          pageSize: 100,
          'filters[mime][$startsWith]': 'image/',
        },
      });
      const supportedAssets = (response.data?.results || []).filter((asset) => SUPPORTED_MIMES.has(asset.mime));
      setAssets(supportedAssets);
      setSelectedAsset((current) => current || supportedAssets[0] || null);
    } catch (error) {
      console.error('[media-tools] Could not load assets', error);
      toggleNotification({ type: 'danger', message: 'Nie udało się wczytać biblioteki mediów.' });
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const visibleAssets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pl');
    if (!query) return assets;
    return assets.filter((asset) => asset.name.toLocaleLowerCase('pl').includes(query));
  }, [assets, search]);

  const handleRotate = async (angle) => {
    if (!selectedAsset || isRotating) return;
    setIsRotating(true);
    try {
      const response = await post('/media-tools/rotate', {
        fileId: selectedAsset.id,
        angle,
      });
      if (!response.data?.file) throw new Error('Brak pliku w odpowiedzi serwera.');

      const updatedAsset = response.data.file;
      setSelectedAsset(updatedAsset);
      setAssets((current) => current.map((asset) => asset.id === updatedAsset.id ? updatedAsset : asset));
      setCacheVersion(response.data.cacheVersion || new Date(updatedAsset.updatedAt).getTime());
      toggleNotification({ type: 'success', message: 'Zdjęcie zostało obrócone.' });
    } catch (error) {
      console.error('[media-tools] Rotate failed', error);
      toggleNotification({
        type: 'danger',
        message: error.response?.data?.error?.message || error.message || 'Nie udało się obrócić zdjęcia.',
      });
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <Box padding={8} background='neutral100' minHeight='100vh'>
      <Box paddingBottom={6}>
        <Typography variant='alpha'>Narzędzia mediów</Typography>
        <Box paddingTop={2}>
          <Typography textColor='neutral600'>Wybierz obraz z biblioteki i obróć jego plik oraz wszystkie warianty Strapi.</Typography>
        </Box>
      </Box>

      <Box background='neutral0' padding={6} shadow='filterShadow' hasRadius>
        <Flex direction='column' alignItems='stretch' gap={5}>
          <TextInput
            label='Szukaj obrazu'
            name='media-search'
            placeholder='Nazwa pliku'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {isLoading ? (
            <Flex justifyContent='center' padding={8}><Loader>Wczytywanie obrazów…</Loader></Flex>
          ) : (
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
                gap: '12px',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
              aria-label='Obrazy w bibliotece mediów'
            >
              {visibleAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    type='button'
                    onClick={() => {
                      setSelectedAsset(asset);
                      setCacheVersion(null);
                    }}
                    aria-pressed={isSelected}
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      borderRadius: '6px',
                      border: `2px solid ${isSelected ? '#4945ff' : '#dcdce4'}`,
                      background: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <img
                      src={withBackendUrl(asset.formats?.thumbnail?.url || asset.url)}
                      alt={asset.alternativeText || asset.name}
                      style={{ width: '100%', height: '104px', display: 'block', objectFit: 'contain', background: '#f6f6f9' }}
                    />
                    <span style={{ display: 'block', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#32324d', fontSize: '12px' }}>
                      {asset.name}
                    </span>
                  </button>
                );
              })}
              {visibleAssets.length === 0 && <Typography textColor='neutral600'>Brak pasujących obrazów JPEG, PNG lub WebP.</Typography>}
            </Box>
          )}

          {selectedAsset && (
            <Box paddingTop={4} borderColor='neutral200' borderStyle='solid' borderWidth='1px 0 0'>
              <Flex alignItems='flex-start' gap={6} wrap='wrap'>
                <Box style={{ flex: '1 1 360px', minWidth: 0 }}>
                  <img
                    key={`${selectedAsset.id}-${cacheVersion || selectedAsset.updatedAt}`}
                    src={versionedUrl(selectedAsset.url, cacheVersion)}
                    alt={selectedAsset.alternativeText || selectedAsset.name}
                    style={{ width: '100%', height: 'min(46vh, 460px)', display: 'block', objectFit: 'contain', borderRadius: '6px', background: '#181826' }}
                  />
                </Box>
                <Flex direction='column' alignItems='flex-start' gap={3} style={{ flex: '1 1 260px' }}>
                  <Typography variant='beta'>{selectedAsset.name}</Typography>
                  <Typography textColor='neutral600'>ID: {selectedAsset.id}</Typography>
                  <Typography textColor='neutral600'>Wymiary: {selectedAsset.width} × {selectedAsset.height} px</Typography>
                  <Typography textColor='neutral600'>Format: {selectedAsset.mime}</Typography>
                  <Flex gap={3} paddingTop={3} wrap='wrap'>
                    <Button variant='secondary' disabled={isRotating} onClick={() => handleRotate(-90)}>
                      ↺ Obróć w lewo
                    </Button>
                    <Button variant='secondary' disabled={isRotating} onClick={() => handleRotate(90)}>
                      ↻ Obróć w prawo
                    </Button>
                  </Flex>
                  {isRotating && <Flex gap={2}><Loader small>Obracanie…</Loader><Typography>Regenerowanie wariantów…</Typography></Flex>}
                </Flex>
              </Flex>
            </Box>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default RotatePage;
