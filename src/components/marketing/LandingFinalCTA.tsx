import { landingFinalCTA } from "@/data/landing";
import { Button } from "@/components/ui/button";

type LandingFinalCTAProps = {
  onPrimary: () => void;
  onSecondary: () => void;
};

const LandingFinalCTA = ({ onPrimary, onSecondary }: LandingFinalCTAProps) => {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-kenya-orange/20 via-amber-500/20 to-transparent" />
      <div className="absolute -right-10 top-1/3 -z-10 h-64 w-64 rounded-full bg-kenya-orange/25 blur-3xl" />

      <div className="container mx-auto rounded-3xl border border-white/15 bg-black/40 px-8 py-16 text-center shadow-[0_40px_120px_-60px_rgba(255,128,0,0.55)] backdrop-blur">
        <h2 className="text-balance text-3xl font-bold text-white md:text-4xl">
          {landingFinalCTA.heading}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={onPrimary}
            className="w-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark font-semibold sm:w-auto"
          >
            {landingFinalCTA.primaryCta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSecondary}
            className="w-full border-white/20 text-white/90 hover:bg-white/10 sm:w-auto"
          >
            {landingFinalCTA.secondaryCta}
          </Button>
        </div>
        <p className="mt-6 text-sm text-white/70">
          {landingFinalCTA.helperText}
        </p>
      </div>
    </section>
  );
};

export default LandingFinalCTA;


