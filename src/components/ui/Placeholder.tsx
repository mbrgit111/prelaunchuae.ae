import { showPlaceholders } from '@/lib/contact';

/** "[PHONE FROM MBR]". Renders nothing unless PREVIEW_PLACEHOLDERS=true. */
export function Ph({ label }: { label: string }) {
  if (!showPlaceholders) return null;
  return <span className="ph">[{label} from MBR]</span>;
}
