import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Feature } from "@/data/landing";

type LandingFeatureGridProps = {
  features: Feature[];
};

const LandingFeatureGrid = ({ features }: LandingFeatureGridProps) => {
  return (
    <section
      id="features"
      className="container mx-auto px-4 py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-kenya-brown-light">
          Everything in one place
        </span>
        <h2
          id="features-heading"
          className="mt-4 text-balance text-3xl font-bold text-white md:text-4xl"
        >
          The operating system for Kenya’s event lovers and creators
        </h2>
        <p className="mt-4 text-lg text-white/70">
          WYA brings discovery, requests, and AI-powered planning together so you
          never miss a moment.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group h-full border-white/10 bg-white/5 bg-gradient-to-br from-white/5 via-white/10 to-transparent text-left backdrop-blur transition-all duration-300 hover:border-kenya-orange/60 hover:shadow-[0_0_25px_rgba(255,128,0,0.25)]"
          >
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kenya-orange/20 text-kenya-orange transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-white">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/70">
              {feature.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default LandingFeatureGrid;


