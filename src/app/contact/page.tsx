import { compliance, config, contact, copy } from '@/site';
import { mailHref, showPlaceholders, telHref } from '@/lib/contact';
import { pageMetadata } from '@/lib/seo';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { Ph } from '@/components/ui/Placeholder';
import { LicenceList } from '@/components/ui/Licence';

const c = copy.pages.contact;
export const metadata = pageMetadata({ title: c.metaTitle, description: c.lede, path: '/contact' });

function Row({ icon, label, value, href, ph }: { icon: IconName; label: string; value: string | null; href?: string | null; ph: string }) {
  if (!value && !showPlaceholders) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 border-b border-line py-5">
      <span className="grid size-11 place-items-center border border-line-strong bg-gold-tint text-gold"><Icon name={icon} className="size-5" /></span>
      <div className="grid gap-1">
        <dt className="text-label">{label}</dt>
        <dd className="text-lg font-semibold text-heading">
          {value ? href ? <a href={href} className="break-all hover:text-gold">{value}</a> : value : <Ph label={ph} />}
        </dd>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const tel = telHref();
  const mail = mailHref();
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]} label="Contact" title={c.h1} highlight={c.highlight} lede={c.lede} />
      <section aria-label="Contact details and form" className="on-white bg-page py-14 md:py-20">
        <div className="container-site grid items-start gap-12 lg:grid-cols-2">
          <div>
            <dl>
              <Row icon="phone" label="Phone" value={contact.phone.display} href={tel} ph="Phone" />
              <Row icon="mail" label="Email" value={contact.email} href={mail} ph="Email" />
              <Row icon="pin" label="Office" value={compliance.company.officeAddress} ph="Office address" />
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              {tel ? <a href={tel} className="btn btn-dark"><Icon name="phone" className="size-[18px]" />Call us</a> : null}
              {mail ? <a href={mail} className="btn btn-secondary"><Icon name="mail" className="size-[18px]" />Email us</a> : null}
            </div>
            {!tel && !mail ? (
              <div className="grid justify-items-start gap-4">
                <p className="eyebrow-line-start">How to reach us</p>
                <p className="text-lg text-body">The enquiry form is the way to reach us. An advisor replies to the details you enter.</p>
              </div>
            ) : null}
            <p className="mt-8 text-sm text-muted">{config.name} is operated by {config.operatedBy}.</p>
            <LicenceList className="mt-4 text-sm" withOffice={false} />
          </div>
          {/* id="register": the header's "Register interest" button lands on this form (there is no register band on this page). */}
          <div id="register" className="scroll-mt-28">
            <EnquiryForm source="contact" title="Send an enquiry" intro="Tell us the unit type, budget and timing you have in mind." withMessage headingLevel="h2" submitLabel="Send enquiry" className="border-t-[3px] border-t-gold" />
          </div>
        </div>
      </section>
    </>
  );
}
