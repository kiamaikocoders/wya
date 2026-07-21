import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTheme } from '@/contexts/ThemeContext';
import { FAQ_ITEMS, SUPPORT_EMAIL } from '@/legal/legal-page-content';
import { cn } from '@/lib/utils';

const FAQ = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <LegalPageShell
      heroSrc="/legal/faq-hero.jpg"
      heroAlt="Friends looking at a phone together"
      eyebrow="HELP CENTER"
      title="Frequently asked questions"
      metaClassName={isDark ? 'text-[#d9e0eb]' : 'text-[#ff6b35]'}
      meta={
        <>
          Answers before you even ask — or contact{' '}
          <a className="underline hover:opacity-90" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </>
      }
    >
      <Accordion type="multiple" defaultValue={[FAQ_ITEMS[0].q]} className="space-y-3.5">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem
            key={item.q}
            value={item.q}
            className={cn(
              'rounded-2xl border px-5 py-1 data-[state=open]:border-[#ff6b35]/35',
              isDark
                ? 'border-[#38404d] bg-[#12161c]'
                : 'border-[#d0d7de] bg-[#f6f8fa]'
            )}
          >
            <AccordionTrigger
              className={cn(
                'py-4 text-left text-base font-semibold hover:no-underline [&_svg]:text-[#ff6b35]',
                isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'
              )}
            >
              {item.q}
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                'pb-4 text-sm leading-[22px]',
                isDark ? 'text-[#8b949e]' : 'text-[#656d76]'
              )}
            >
              {item.q === 'How is my data protected?' ? (
                <>
                  See our{' '}
                  <Link to="/privacy-policy" className="text-[#ff6b35] underline">
                    Privacy Policy
                  </Link>
                  . We follow the Kenya Data Protection Act, 2019 and let you manage marketing
                  preferences.
                </>
              ) : item.q === 'How do I contact support?' ? (
                <>
                  Email{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff6b35] underline">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  or use{' '}
                  <Link to="/contact" className="text-[#ff6b35] underline">
                    Contact Support
                  </Link>{' '}
                  from the footer. We typically reply within 24 hours.
                </>
              ) : (
                item.a
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LegalPageShell>
  );
};

export default FAQ;
