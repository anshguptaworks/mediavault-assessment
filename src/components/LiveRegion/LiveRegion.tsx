import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import styles from './LiveRegion.module.css';

interface AnnounceOptions {
  /** Use the assertive region (interrupts) for errors; polite (default) for
   *  routine updates like result counts or a bulk-action outcome. */
  assertive?: boolean;
}

type AnnounceFn = (message: string, options?: AnnounceOptions) => void;

const AnnounceContext = createContext<AnnounceFn | null>(null);

export function useAnnounce(): AnnounceFn {
  const context = useContext(AnnounceContext);
  if (!context) throw new Error('useAnnounce must be used within a LiveRegionProvider');
  return context;
}

/** Two permanently-mounted regions (polite/assertive) instead of one with a
 *  toggled `aria-live` — more reliable across screen readers. Clearing the
 *  text before re-setting it lets the same message announce twice in a row. */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback<AnnounceFn>((message, options) => {
    const setMessage = options?.assertive ? setAssertiveMessage : setPoliteMessage;
    setMessage('');
    requestAnimationFrame(() => setMessage(message));
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <p className={styles.region} role="status" aria-live="polite">
        {politeMessage}
      </p>
      <p className={styles.region} role="alert" aria-live="assertive">
        {assertiveMessage}
      </p>
    </AnnounceContext.Provider>
  );
}
