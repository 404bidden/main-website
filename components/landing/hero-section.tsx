"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-background to-secondary/50 dark:from-background dark:via-background dark:to-secondary/20 flex justify-center">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-30 blur-3xl bg-primary/20 animate-blob"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-30 blur-3xl bg-secondary/20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] left-[15%] w-[40%] h-[40%] rounded-full opacity-20 blur-3xl bg-primary/20 animate-blob animation-delay-4000"></div>

                <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
                    <svg
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <pattern
                                id="grid-pattern"
                                width="32"
                                height="32"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(45)"
                            >
                                <rect
                                    width="1"
                                    height="32"
                                    fill="currentColor"
                                />
                                <rect
                                    height="1"
                                    width="32"
                                    fill="currentColor"
                                />
                            </pattern>
                        </defs>
                        <rect
                            width="100%"
                            height="100%"
                            fill="url(#grid-pattern)"
                        />
                    </svg>
                </div>
            </div>

            {/* Hero content */}
            <div className="mx-auto px-4 py-32 md:py-40 flex justify-center relative z-10">
                <div
                    className={`max-w-3xl mx-auto text-center transition-all duration-1000 ease-in-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-border bg-background/80 backdrop-blur-sm">
                        <span className="text-primary font-semibold">New</span>
                        <span className="mx-2">•</span>
                        <span className="text-foreground/80">
                            Launching April 2025
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-foreground">
                        Monitor Your Applications with{" "}
                        <span className="text-primary relative">
                            Precision
                            <span className="absolute bottom-1 left-0 w-full h-[8px] bg-primary/20 -z-10 rounded"></span>
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Keep track of your endpoints, set custom monitoring
                        parameters, and receive instant notifications when
                        issues arise.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto group"
                            onClick={() => {
                                router.push("/auth/register");
                            }}
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            Learn More
                        </Button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Check className="mr-2 h-4 w-4 text-primary" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center">
                            <Check className="mr-2 h-4 w-4 text-primary" />
                            <span>Free tier available</span>
                        </div>
                        <div className="flex items-center">
                            <Check className="mr-2 h-4 w-4 text-primary" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
