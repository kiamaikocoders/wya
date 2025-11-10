import type { Step } from "@/data/landing";

type LandingHowItWorksProps = {
  steps: Step[];
};

const LandingHowItWorks = ({ steps }: LandingHowItWorksProps) => {
  return (
    <section
      className="bg-black/30 py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
            How it works
          </span>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl font-bold text-white md:text-4xl"
          >
            A clear path from idea to unforgettable experience
          </h2>
          <p className="mt-4 text-lg text-white/70">
            WYA handles the flow so you can focus on creating and enjoying the
            event.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8"
            >
              <span className="absolute -top-6 left-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-kenya-orange text-lg font-bold text-kenya-dark shadow-[0_15px_45px_rgba(255,128,0,0.25)]">
                {index + 1}
              </span>
              <h3 className="mt-6 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHowItWorks;


