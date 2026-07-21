import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { PlainLegalBody } from '@/components/legal/PlainLegalBody';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PRIVACY_POLICY_PLAIN } from '@/legal/legal-plain-text';
import { PRIVACY_PAGE } from '@/legal/legal-page-content';
import {
  CONTACT_PRIVACY_EMAIL,
  PRIVACY_POLICY_VERSION,
  TERMS_EFFECTIVE_LABEL,
} from '@/legal/policy-versions';

const PrivacyPolicy = () => {
  return (
    <LegalPageShell
      heroSrc={PRIVACY_PAGE.heroSrc}
      heroAlt="City skyline at night"
      eyebrow={PRIVACY_PAGE.eyebrow}
      title={PRIVACY_PAGE.title}
      meta={
        <>
          Effective {TERMS_EFFECTIVE_LABEL} · Version {PRIVACY_POLICY_VERSION} ·{' '}
          <a className="underline hover:opacity-90" href={`mailto:${CONTACT_PRIVACY_EMAIL}`}>
            {CONTACT_PRIVACY_EMAIL}
          </a>
        </>
      }
    >
      <p className="mb-5 text-[15px] leading-6 text-[#656d76] dark:text-[#8b949e]">
        {PRIVACY_PAGE.intro}
      </p>
      <div className="space-y-5">
        {PRIVACY_PAGE.sections.map((s) => (
          <div key={s.title} className="space-y-2">
            <h2 className="text-[17px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {s.title}
            </h2>
            <p className="text-sm leading-[22px] text-[#656d76] dark:text-[#8b949e]">{s.body}</p>
          </div>
        ))}
      </div>

      <Accordion
        type="single"
        collapsible
        className="mt-8 border-t border-[#d0d7de] pt-4 dark:border-[#38404d]"
      >
        <AccordionItem value="full" className="border-none">
          <AccordionTrigger className="py-3 text-[#1f2328] hover:no-underline dark:text-[#e6edf3] [&_svg]:text-[#ff6b35]">
            Read full privacy policy
          </AccordionTrigger>
          <AccordionContent className="max-h-[60vh] overflow-y-auto pr-1">
            <PlainLegalBody
              text={PRIVACY_POLICY_PLAIN}
              className="text-[#656d76] dark:text-[#8b949e]"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-6 text-xs text-[#656d76] dark:text-[#8b949e]">{PRIVACY_PAGE.footer}</p>
    </LegalPageShell>
  );
};

export default PrivacyPolicy;
