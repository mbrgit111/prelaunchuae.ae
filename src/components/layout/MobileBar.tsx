import { config } from '@/site';
import { mailHref, showPlaceholders, telHref, waHref } from '@/lib/contact';
import { Icon } from '../ui/Icon';

/** Phones only: Call, Email, Register, always within thumb reach. Call and Email hide until the details exist. */
export function MobileBar() {
  const tel = telHref();
  const wa = waHref();
  const mail = mailHref();
  const cells = [
    tel || showPlaceholders ? { key: 'call', href: tel ?? '#', label: 'Call', icon: 'phone' as const, ph: !tel } : null,
    wa ? { key: 'whatsapp', href: wa, label: 'WhatsApp', icon: 'whatsapp' as const, ph: false, external: true } : null,
    mail || showPlaceholders ? { key: 'mail', href: mail ?? '#', label: 'Email', icon: 'mail' as const, ph: !mail } : null,
  ].filter((c) => c !== null);
  return (
    <nav aria-label="Quick contact" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex h-16">
        {cells.map((c) => (
          <li key={c.key} className="flex-1 border-r border-line">
            <a
              href={c.href}
              title={c.ph ? `[${c.label.toUpperCase()} FROM MBR]` : undefined}
              {...('external' in c && c.external ? { target: '_blank', rel: 'noopener' } : {})}
              className={`flex h-full flex-col items-center justify-center gap-1 text-[13px] font-semibold ${c.ph ? 'text-survey-deep' : 'text-datum'}`}
            >
              <Icon name={c.icon} className={`size-5 ${c.key === 'whatsapp' ? 'text-[#0b7a3f]' : ''}`} />
              {c.label}
            </a>
          </li>
        ))}
        <li className="flex-1">
          <a href="#register" className="flex h-full flex-col items-center justify-center gap-1 bg-survey text-[13px] font-semibold text-datum">
            <Icon name="file" className="size-5" />
            Register
          </a>
        </li>
      </ul>
      <span className="sr-only">{config.name}</span>
    </nav>
  );
}
