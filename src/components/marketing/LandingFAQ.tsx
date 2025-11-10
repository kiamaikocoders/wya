import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/data/landing";

type LandingFAQProps = {
  items: FaqItem[];
};

const LandingFAQ = ({ items }: LandingFAQProps) => {
  return (
    <section
      id="faq"
      className="container mx-auto px-4 py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
          Frequently asked questions
        </span>
        <h2
          id="faq-heading"
          className="mt-4 text-3xl font-bold text-white md:text-4xl"
        >
          Answers before you even ask
        </h2>
        <p className="mt-4 text-lg text-white/70">
          Still curious? Our AI concierge and support team are at your service.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`item-${index}`}
              className="border-b border-white/10"
            >
              <AccordionTrigger className="text-left text-base font-medium text-white hover:text-kenya-orange">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-white/70">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default LandingFAQ;


