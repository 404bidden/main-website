import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
// import { TestimonialsSection } from "@/components/landing/testimonials-section";
// import { Footer } from "@/components/footer";

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center w-full ">
            <HeroSection />
            <FeaturesSection />
            {/* <TestimonialsSection /> */}
            <CtaSection />
        </div>
    );
}
