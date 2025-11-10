import type { ComponentType } from "react";
import { MapPin, Sparkles, Users, Wand2, Workflow } from "lucide-react";

export type Metric = {
  label: string;
  value: string;
  description: string;
};

export type Feature = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export type Step = {
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const landingMetrics: Metric[] = [
  {
    label: "Attendees Served",
    value: "12K+",
    description: "Kenyan event-goers connected through WYA",
  },
  {
    label: "Organizers",
    value: "350+",
    description: "Local creators, venues, and partners onboard",
  },
  {
    label: "Cities Covered",
    value: "20+",
    description: "From Nairobi, Kisumu, to coastal experiences",
  },
];

export const landingFeatures: Feature[] = [
  {
    title: "Discover Events",
    description:
      "Browse curated music, culture, sports, and tech events tailored to Kenya’s vibrant scene.",
    icon: MapPin,
  },
  {
    title: "Request Experiences",
    description:
      "Launch event ideas, gauge interest, and collaborate with organizers to bring them to life.",
    icon: Workflow,
  },
  {
    title: "AI Assistance",
    description:
      "Leverage WYA’s AI to get smart recommendations, planning tips, and collaboration insights.",
    icon: Wand2,
  },
];

export const landingTestimonials: Testimonial[] = [
  {
    quote:
      "WYA helped us sell out our art festival in days while connecting with sponsors we never knew existed.",
    author: "Nairobi Arts Collective",
    role: "Festival Organizers",
  },
  {
    quote:
      "I discovered night markets and food pop-ups I never would have found. The AI knows my weekends now.",
    author: "Achieng’",
    role: "Food Enthusiast",
  },
];

export const landingSteps: Step[] = [
  {
    title: "Create your profile",
    description: "Tell us what you love and follow your favourite categories.",
  },
  {
    title: "Curate or request events",
    description:
      "Explore live happenings or submit event ideas to rally the community.",
  },
  {
    title: "Show up with confidence",
    description:
      "Book tickets, get reminders, and share memories with the WYA community.",
  },
];

export const landingFaqs: FaqItem[] = [
  {
    question: "Is WYA free to use?",
    answer:
      "Yes. Browsing events and making requests is free. Paid events show transparent pricing before you book.",
  },
  {
    question: "Can I host my own event on WYA?",
    answer:
      "Absolutely. Create a request, gather interest, and collaborate with organizers or sponsors directly.",
  },
  {
    question: "Where is WYA available?",
    answer:
      "We’re live across major Kenyan cities with more regions rolling out soon. Tell us where to come next!",
  },
];

export const landingAiHighlights = {
  title: "Tailored to Your Vibe",
  description:
    "Answer a few prompts or sync your interests and our AI curates a personal feed of events, alerts, and collaboration tips.",
  bulletPoints: [
    "Smart recommendations that evolve with your interests",
    "AI copilot for organizers planning new experiences",
    "Real-time alerts when trending events match your vibe",
  ],
  stat: {
    label: "70% faster",
    helper: "from idea to launch for organizers using AI",
    icon: Sparkles,
  },
};

export const landingHero = {
  eyebrow: "Kenya’s Event Companion",
  heading: "Find the Pulse of Kenya’s Events—Powered by WYA",
  subheading:
    "Discover curated experiences, request custom gatherings, and let AI match you with moments you’ll love.",
  primaryCta: "Get Started",
  secondaryCta: "Browse Live Events",
  tertiaryCta: "See AI in Action",
};

export const landingSocialProof = {
  label: "Join thousands of explorers and creators",
  supportingIcon: Users,
};

export const landingAiSnippet = {
  title: "AI event recommendations refresh every day",
  caption:
    "Our AI learns from community trends, cultural seasons, and your preferences to surface what matters most.",
  buttonLabel: "Try AI Recommendations",
};

export const landingMobile = {
  title: "WYA Goes Where You Go",
  description:
    "Stay in the loop with mobile-friendly access to tickets, updates, and community chat. Experience WYA seamlessly on any device.",
  chips: ["Ticket Wallet", "Instant Alerts", "Community Chat"],
};

export const landingFinalCTA = {
  heading: "Ready to Experience Kenya’s Event Scene Differently?",
  primaryCta: "Create Your Free Account",
  secondaryCta: "Book a Demo for Organizers",
  helperText: "Need help? Chat with our team or explore AI assistance.",
};


