import { landingMobile } from "@/data/landing";

const LandingMobileShowcase = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
            Mobile ready
          </span>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {landingMobile.title}
          </h2>
          <p className="text-lg text-white/70">{landingMobile.description}</p>

          <div className="flex flex-wrap gap-3">
            {landingMobile.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md justify-center">
          <div className="absolute -left-12 top-1/4 h-44 w-44 rounded-full bg-kenya-orange/15 blur-3xl" />
          <div className="absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative flex items-end gap-6">
            <div className="relative hidden w-40 rotate-[-6deg] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 p-3 shadow-[0_25px_60px_rgba(0,0,0,0.45)] md:block">
              <img
                src="/lovable-uploads/d4d9e0c4-5ef3-4aa4-9e7c-5e8391af678e.png"
                alt="WYA mobile preview 1"
                className="h-full w-full rounded-[1.8rem] object-cover"
                loading="lazy"
              />
            </div>
            <div className="relative w-48 rotate-3 overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 p-3 shadow-[0_25px_60px_rgba(255,128,0,0.35)]">
              <img
                src="/lovable-uploads/5a8a8680-15e8-4a23-b3d5-10e7c024f961.png"
                alt="WYA mobile preview 2"
                className="h-full w-full rounded-[1.8rem] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingMobileShowcase;


