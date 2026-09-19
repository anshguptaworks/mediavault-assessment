import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LiveRegionProvider } from '@/components/LiveRegion';
import { AssetLibrary } from '@/features/assets';

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <LiveRegionProvider>
      <ErrorBoundary>
        <AssetLibrary />
      </ErrorBoundary>
    </LiveRegionProvider>
  </QueryClientProvider>
);
