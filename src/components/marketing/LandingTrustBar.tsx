import type { Metric } from "@/data/landing";

type LandingTrustBarProps = {
  metrics: Metric[];
};

const LandingTrustBar = ({ metrics }: LandingTrustBarProps) => {
  return (
    <section className="border-y border-white/5 bg-black/20 py-10 backdrop-blur">
      <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_20px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="text-4xl font-bold text-white">{metric.value}</p>
            <p className="mt-2 text-sm uppercase tracking-wide text-kenya-brown-light">
              {metric.label}
            </p>
            <p className="mt-3 text-sm text-white/70">{metric.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LandingTrustBar;


