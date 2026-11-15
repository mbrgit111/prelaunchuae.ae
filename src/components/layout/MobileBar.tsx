import { config } from '@/site';
import { Icon } from '../ui/Icon';

/**
 * Phones only: one gold "Register" within thumb reach. The enquiry form is the only channel (no call, email or WhatsApp cells).
 * The bar stays 64px tall: the phone hero's first screen is measured against it.
 */
export function MobileBar() {
  return (
    <nav aria-label="Quick contact" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="flex h-16 items-center px-4">
        <li className="flex-1">
          <a href="#register" className="btn btn-primary w-full">
            <Icon name="file" className="size-5" />
            Register
          </a>
        </li>
      </ul>
      <span className="sr-only">{config.name}</span>
    </nav>
  );
}
