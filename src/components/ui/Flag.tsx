import { showPlaceholders } from '@/lib/contact';

/** Review marker such as [SOURCE REQUIRED]. Visible only in preview builds (PREVIEW_PLACEHOLDERS=true). */
export function Flag({ children }: { children?: string }) {
  if (!showPlaceholders || !children) return null;
  return <span className="ph ml-2 align-middle">[{children}]</span>;
}
