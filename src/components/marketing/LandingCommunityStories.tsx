import type { Testimonial } from "@/data/landing";
import { Quote } from "lucide-react";

type LandingCommunityStoriesProps = {
  testimonials: Testimonial[];
};

const LandingCommunityStories = ({
  testimonials,
}: LandingCommunityStoriesProps) => {
  return (
    <section
      id="stories"
      className="container mx-auto px-4 py-20"
      aria-labelledby="stories-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
          By the community, for the community
        </span>
        <h2
          id="stories-heading"
          className="mt-4 text-balance text-3xl font-bold text-white md:text-4xl"
        >
          Creators and explorers trust WYA to bring people together
        </h2>
        <p className="mt-4 text-lg text-white/70">
          Hear from the crews, artists, and experience seekers who make Kenya’s
          event scene electric.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.quote}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-black/20 p-8 backdrop-blur"
          >
            <Quote className="absolute -top-6 -left-2 h-20 w-20 text-kenya-orange/20" />
            <p className="text-lg text-white/80">{testimonial.quote}</p>
            <footer className="mt-8">
              <p className="text-sm font-semibold text-white">
                {testimonial.author}
              </p>
              <p className="text-xs uppercase tracking-wide text-kenya-brown-light">
                {testimonial.role}
              </p>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
};

export default LandingCommunityStories;


