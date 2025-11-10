import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingHero from "@/components/marketing/LandingHero";
import LandingTrustBar from "@/components/marketing/LandingTrustBar";
import LandingFeatureGrid from "@/components/marketing/LandingFeatureGrid";
import LandingPersonalization from "@/components/marketing/LandingPersonalization";
import LandingCommunityStories from "@/components/marketing/LandingCommunityStories";
import LandingHowItWorks from "@/components/marketing/LandingHowItWorks";
import LandingMobileShowcase from "@/components/marketing/LandingMobileShowcase";
import LandingFAQ from "@/components/marketing/LandingFAQ";
import LandingFinalCTA from "@/components/marketing/LandingFinalCTA";
import {
  landingFeatures,
  landingFaqs,
  landingMetrics,
  landingSteps,
  landingTestimonials,
} from "@/data/landing";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate("/home");
      return;
    }
    navigate("/signup");
  };

  const handleSecondaryCta = () => {
    if (isAuthenticated) {
      navigate("/events");
      return;
    }
    navigate("/events");
  };

  const handleTertiaryCta = () => {
    if (isAuthenticated) {
      navigate("/ai-assistance");
      return;
    }
    navigate("/ai-assistance");
  };

  const handleOrganizerDemo = () => {
    navigate("/request-event");
  };

  return (
    <div className="space-y-0">
      <LandingHero
        metrics={landingMetrics}
        onPrimaryCta={handlePrimaryCta}
        onSecondaryCta={handleSecondaryCta}
        onTertiaryCta={handleTertiaryCta}
      />
      <LandingTrustBar metrics={landingMetrics} />
      <LandingFeatureGrid features={landingFeatures} />
      <LandingPersonalization onTryAi={handleTertiaryCta} />
      <LandingCommunityStories testimonials={landingTestimonials} />
      <LandingHowItWorks steps={landingSteps} />
      <LandingMobileShowcase />
      <LandingFAQ items={landingFaqs} />
      <LandingFinalCTA
        onPrimary={handlePrimaryCta}
        onSecondary={handleOrganizerDemo}
      />
    </div>
  );
};

export default Landing;


