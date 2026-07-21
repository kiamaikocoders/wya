import {
  ATTENDEE_TERMS_VERSION,
  CONTACT_PRIVACY_EMAIL,
  CONTACT_TERMS_EMAIL,
  MEDIA_CONSENT_VERSION,
  PRIVACY_POLICY_VERSION,
  TERMS_EFFECTIVE_LABEL,
} from '@/legal/policy-versions';

export type LegalSection = { title: string; body: string };

export const PRIVACY_PAGE = {
  heroSrc: '/legal/privacy-hero.jpg',
  eyebrow: 'LEGAL',
  title: 'Privacy Policy',
  meta: `Effective ${TERMS_EFFECTIVE_LABEL} · Version ${PRIVACY_POLICY_VERSION} · ${CONTACT_PRIVACY_EMAIL}`,
  intro:
    'How Eventsphere Ltd (WYA) collects, uses, stores, and protects your personal data under the Kenya Data Protection Act, 2019.',
  sections: [
    {
      title: '1. Who We Are',
      body: `Eventsphere Ltd, trading as WYA — Where You At?, is the Data Controller. Registered in Nairobi, Kenya. Contact: ${CONTACT_PRIVACY_EMAIL}`,
    },
    {
      title: '2. Personal Data We Collect',
      body: 'Account details, preferences, device/log data, optional location, and user-generated content you choose to share on the Platform.',
    },
    {
      title: '3. How We Use Your Data',
      body: 'To run and improve WYA, personalize discovery, provide support, send optional marketing (with opt-out), and meet safety and legal duties.',
    },
    {
      title: '4. Your Rights',
      body: 'Access, update, or delete your data, and opt out of marketing. Contact us to exercise rights under the KDPA.',
    },
    {
      title: '5. Contact',
      body: `Privacy questions: ${CONTACT_PRIVACY_EMAIL} · Full policy available in-app and on wya254.com.`,
    },
  ] satisfies LegalSection[],
  footer: `Last updated: ${TERMS_EFFECTIVE_LABEL} · Eventsphere Ltd`,
};

export const TERMS_PAGE = {
  heroSrc: '/legal/terms-hero.jpg',
  eyebrow: 'LEGAL',
  title: 'Attendee Terms',
  meta: `Effective ${TERMS_EFFECTIVE_LABEL} · Version ${ATTENDEE_TERMS_VERSION} · ${CONTACT_TERMS_EMAIL}`,
  intro:
    'These Terms govern your use of WYA as an Attendee. By creating an account or using the Platform, you agree to be bound by them.',
  sections: [
    {
      title: '1. Eligibility',
      body: 'You must be at least 18, located where use is lawful, and have capacity to enter a binding agreement.',
    },
    {
      title: '2. Account Registration & Security',
      body: 'Provide accurate info, keep credentials confidential, and notify us of unauthorized access. You are responsible for activity under your account.',
    },
    {
      title: '3. Use of the Platform',
      body: 'Discover, save, and engage with events. Do not use WYA unlawfully, scrape data, impersonate others, or disrupt the service.',
    },
    {
      title: '4. Event Listings',
      body: 'Events are run by independent Organizers. WYA is a discovery platform and is not liable for event quality, cancellations, or attendance risks.',
    },
    {
      title: '5. Contact',
      body: `Terms questions: ${CONTACT_TERMS_EMAIL} · Full terms on wya254.com/terms-of-service.`,
    },
  ] satisfies LegalSection[],
  footer: `Last updated: ${TERMS_EFFECTIVE_LABEL} · Eventsphere Ltd`,
};

export const MEDIA_CONSENT_PAGE = {
  heroSrc: '/legal/media-hero.jpg',
  eyebrow: 'LEGAL',
  title: 'Media consent',
  meta: `Effective ${TERMS_EFFECTIVE_LABEL} · Version ${MEDIA_CONSENT_VERSION} · ${CONTACT_TERMS_EMAIL}`,
  intro:
    'Consent to use of photographs, video, and audio recordings that identify you for promotional and marketing purposes relating to WYA and partner events.',
  sections: [
    {
      title: 'What you are consenting to',
      body: 'If you consent, Eventsphere and partners may use images/video/audio that identify you for social, web, ads, email, print, and press — where permitted by law.',
    },
    {
      title: 'Our commitments',
      body: 'We will not sell your likeness as stand-alone data. Uses follow this consent and our Privacy Policy under the Kenya Data Protection Act, 2019.',
    },
    {
      title: 'Your rights',
      body: `Withdraw anytime via ${CONTACT_TERMS_EMAIL}. Withdrawal does not undo lawful prior use. You can update your choice in account settings.`,
    },
  ] satisfies LegalSection[],
  choices: [
    'I consent to promotional use of my image / video / audio as described',
    'I do not consent to promotional media use',
  ],
  footer: `Last updated: ${TERMS_EFFECTIVE_LABEL} · Eventsphere Ltd`,
};

export const FAQ_ITEMS = [
  {
    q: 'Is WYA free to use?',
    a: 'Yes. Browsing events and making requests is free. Paid events show transparent pricing before you book.',
  },
  {
    q: 'Can I host my own event on WYA?',
    a: 'Absolutely. Create a request, gather interest, and collaborate with organizers or sponsors directly.',
  },
  {
    q: 'Where is WYA available?',
    a: "We're live across major Kenyan cities with more regions rolling out soon. Tell us where to come next!",
  },
  {
    q: 'How do I contact support?',
    a: 'Email support@wyakenya.com or use Contact Support from the footer. We typically reply within 24 hours.',
  },
  {
    q: 'How is my data protected?',
    a: 'See our Privacy Policy. We follow the Kenya Data Protection Act, 2019 and let you manage marketing preferences.',
  },
] as const;

export const SUPPORT_EMAIL = 'support@wyakenya.com';
