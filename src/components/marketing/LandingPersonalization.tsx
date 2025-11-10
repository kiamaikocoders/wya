import { landingAiHighlights, landingAiSnippet } from "@/data/landing";
import { Button } from "@/components/ui/button";

type LandingPersonalizationProps = {
  onTryAi: () => void;
};

const LandingPersonalization = ({ onTryAi }: LandingPersonalizationProps) => {
  const StatIcon = landingAiHighlights.stat.icon;

  return (
    <section
      id="ai"
      className="relative overflow-hidden py-20"
      aria-labelledby="personalization-heading"
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_center,#1C6F6F33,transparent_60%)]" />
      <div className="absolute inset-y-0 right-[-20%] -z-10 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />

      <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
            Personalized to you
          </p>
          <h2
            id="personalization-heading"
            className="text-balance text-3xl font-bold text-white md:text-4xl"
          >
            {landingAiHighlights.title}
          </h2>
          <p className="text-lg text-white/70">
            {landingAiHighlights.description}
          </p>

          <ul className="space-y-4 text-white/80">
            {landingAiHighlights.bulletPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4"
              >
                <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-kenya-orange/20 text-kenya-orange">
                  ✦
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kenya-orange/15 text-kenya-orange">
              <StatIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {landingAiHighlights.stat.label}
              </p>
              <p className="text-sm text-white/70">
                {landingAiHighlights.stat.helper}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={onTryAi}
              className="bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark shadow-[0_0_25px_rgba(255,128,0,0.35)] hover:shadow-[0_0_35px_rgba(255,128,0,0.45)]"
            >
              {landingAiSnippet.buttonLabel}
            </Button>
            <p className="text-sm text-white/60 sm:max-w-[260px]">
              {landingAiSnippet.caption}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_30px_80px_-40px_rgba(255,128,0,0.35)]">
          <div className="absolute inset-0 -z-10 bg-[url('/lovable-uploads/6cca2893-2362-428d-b824-69d6baff41c7.png')] bg-cover bg-center opacity-60" />
          <div className="space-y-4">
            <div className="rounded-2xl bg-black/40 p-4 text-sm text-white/80 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-wide text-kenya-orange">
                Today’s picks
              </p>
              <p className="mt-2 font-semibold text-white">
                AI-curated events just for you
              </p>
              <ul className="mt-3 space-y-3 text-sm text-white/70">
                <li className="flex items-center justify-between">
                  <span>Nairobi Sunset Sessions</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    Music · Tonight
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Mombasa Night Market</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    Food · Sat
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Creators &amp; Founders Meetup</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    Tech · Tue
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-kenya-orange">
                Organizers
              </p>
              <p className="mt-2">
                “AI suggested brand partnerships that helped us scale our next
                event.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPersonalization;


