import { useOnlineStatus } from '@/hooks';
import { Banner } from '@/components/Banner';

/** Renders nothing while online — mounted once near the app root. */
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <Banner tone="warning" title="You're offline" icon="wifi-off">
      Showing what was already loaded. New requests will resume automatically once your
      connection comes back.
    </Banner>
  );
};
