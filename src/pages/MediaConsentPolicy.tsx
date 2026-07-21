import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { PlainLegalBody } from '@/components/legal/PlainLegalBody';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MEDIA_CONSENT_PLAIN } from '@/legal/legal-plain-text';
import { MEDIA_CONSENT_PAGE } from '@/legal/legal-page-content';
import {
  CONTACT_TERMS_EMAIL,
  MEDIA_CONSENT_VERSION,
  TERMS_EFFECTIVE_LABEL,
} from '@/legal/policy-versions';

const MediaConsentPolicy = () => {
  return (
    <LegalPageShell
      heroSrc={MEDIA_CONSENT_PAGE.heroSrc}
      heroAlt="Crowd photographing a concert"
      eyebrow={MEDIA_CONSENT_PAGE.eyebrow}
      title={MEDIA_CONSENT_PAGE.title}
      meta={
        <>
          Effective {TERMS_EFFECTIVE_LABEL} · Version {MEDIA_CONSENT_VERSION} ·{' '}
          <a className="underline hover:opacity-90" href={`mailto:${CONTACT_TERMS_EMAIL}`}>
            {CONTACT_TERMS_EMAIL}
          </a>
        </>
      }
    >
      <p className="mb-5 text-[15px] leading-6 text-[#656d76] dark:text-[#8b949e]">
        {MEDIA_CONSENT_PAGE.intro}
      </p>
      <div className="space-y-5">
        {MEDIA_CONSENT_PAGE.sections.map((s) => (
          <div key={s.title} className="space-y-2">
            <h2 className="text-[17px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {s.title}
            </h2>
            <p className="text-sm leading-[22px] text-[#656d76] dark:text-[#8b949e]">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="text-[17px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">Your choice</h2>
        <ul className="space-y-2.5">
          {MEDIA_CONSENT_PAGE.choices.map((label) => (
            <li
              key={label}
              className="flex items-start gap-3 rounded-xl border border-[#d0d7de] bg-[#f6f8fa] px-4 py-3 text-sm text-[#656d76] dark:border-[#38404d] dark:bg-[#12161c] dark:text-[#8b949e]"
            >
              <span
                className="mt-0.5 inline-block size-4 shrink-0 rounded-full border border-[#ff6b35]/40"
                aria-hidden
              />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
          Manage your preference in{' '}
          <Link to="/settings" className="text-[#ff6b35] underline hover:text-[#ff8559]">
            account settings
          </Link>
          .
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="mt-8 border-t border-[#d0d7de] pt-4 dark:border-[#38404d]"
      >
        <AccordionItem value="full" className="border-none">
          <AccordionTrigger className="py-3 text-[#1f2328] hover:no-underline dark:text-[#e6edf3] [&_svg]:text-[#ff6b35]">
            Read full media consent policy
          </AccordionTrigger>
          <AccordionContent className="max-h-[60vh] overflow-y-auto pr-1">
            <PlainLegalBody
              text={MEDIA_CONSENT_PLAIN}
              className="text-[#656d76] dark:text-[#8b949e]"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-6 text-xs text-[#656d76] dark:text-[#8b949e]">{MEDIA_CONSENT_PAGE.footer}</p>
    </LegalPageShell>
  );
};

export default MediaConsentPolicy;
