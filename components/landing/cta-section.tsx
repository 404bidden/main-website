"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GithubIcon } from "../icons";

export function CtaSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 },
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <section
            id="contact"
            ref={sectionRef}
            className="relative bg-gradient-to-b from-secondary/30 via-secondary/20 to-primary/5 dark:from-secondary/10 dark:via-secondary/5 dark:to-primary/5 py-24 md:py-32 w-full flex justify-center overflow-hidden"
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <div className="absolute -top-[30%] right-[5%] w-[50%] h-[50%] rounded-full opacity-20 blur-3xl bg-primary/10"></div>
                <div className="absolute -bottom-[30%] left-[5%] w-[50%] h-[50%] rounded-full opacity-20 blur-3xl bg-primary/10"></div>
            </div>

            <div className="container mx-auto px-4 flex justify-center">
                <div
                    className={`relative z-10 bg-card/50 backdrop-blur-lg border border-border rounded-2xl p-10 md:p-14 max-w-4xl mx-auto transition-all duration-1000 ease-in-out ${
                        isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                    }`}
                >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        Limited Time Offer
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6 text-foreground">
                            Ready to Start{" "}
                            <span className="text-primary relative inline-block">
                                Monitoring
                                <span className="absolute bottom-1 left-0 w-full h-[8px] bg-primary/20 -z-10 rounded"></span>
                            </span>{" "}
                            Your Applications?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-0 max-w-2xl mx-auto">
                            Join thousands of developers who trust our platform
                            for reliable application monitoring.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-foreground">
                                        Real-time monitoring
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Monitor your applications 24/7 with
                                        real-time insights
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-foreground">
                                        Instant alerts
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified immediately when issues are
                                        detected
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-foreground">
                                        Comprehensive dashboard
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        View all your metrics in one intuitive
                                        dashboard
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-foreground">
                                        Developer-friendly
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Easy integration with your tech stack
                                        via our API
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="w-full sm:w-auto group">
                            Get Started Now
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                window.open(
                                    "https://github.com/404bidden",
                                    "_blank",
                                );
                            }}
                        >
                            <GithubIcon className="mr-2 h-4 w-4" />
                            Check Github
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
