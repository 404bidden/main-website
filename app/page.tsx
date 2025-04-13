import { Footer } from "@/components/footer";
import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center w-full">
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <TestimonialsSection />
            <CtaSection />
            <Footer />
        </div>
    );
}
