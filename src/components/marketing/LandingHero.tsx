import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Metric } from "@/data/landing";
import { landingHero, landingSocialProof } from "@/data/landing";

type LandingHeroProps = {
  metrics: Metric[];
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
  onTertiaryCta: () => void;
};

const LandingHero = ({
  metrics,
  onPrimaryCta,
  onSecondaryCta,
  onTertiaryCta,
}: LandingHeroProps) => {
  const SocialIcon = landingSocialProof.supportingIcon;

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-black/85 via-kenya-dark to-kenya-dark pb-24 pt-28"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#FF800025,transparent_60%)]" />
        <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-kenya-orange/20 blur-3xl" />
        <div className="absolute left-[-10%] top-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/lovable-uploads/5a8a8680-15e8-4a23-b3d5-10e7c024f961.png')] bg-cover bg-center opacity-10 mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl space-y-6">
          <Badge className="bg-white/10 text-white/80 backdrop-blur-md">
            {landingHero.eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-black tracking-tight text-white md:text-6xl">
            {landingHero.heading}
          </h1>
          <p className="text-pretty text-lg text-white/75 md:text-xl">
            {landingHero.subheading}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              size="lg"
              onClick={onPrimaryCta}
              className="w-full sm:w-auto bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark font-semibold shadow-[0_0_25px_rgba(255,128,0,0.35)] hover:shadow-[0_0_35px_rgba(255,128,0,0.45)]"
            >
              {landingHero.primaryCta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onSecondaryCta}
              className="w-full border-white/20 text-white/90 hover:bg-white/10 sm:w-auto"
            >
              {landingHero.secondaryCta}
            </Button>
            <button
              type="button"
              onClick={onTertiaryCta}
              className="inline-flex items-center justify-center text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              {landingHero.tertiaryCta}
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-white/70">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <SocialIcon className="h-5 w-5 text-kenya-orange" />
              </div>
              <span>{landingSocialProof.label}</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur"
                >
                  <span className="text-lg font-semibold text-white">
                    {metric.value}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-white/60">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-sm text-white/60 md:flex">
        <span>Scroll to explore</span>
        <div className="flex flex-col items-center">
          <div className="h-8 w-4 rounded-full border border-white/30 p-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;


