"use client";

import { Activity, Bell, Clock, Globe, Shield, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FeaturesSection() {
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

    const features = [
        {
            icon: <Globe className="h-10 w-10" />,
            title: "Global Monitoring",
            description:
                "Monitor your endpoints from multiple regions around the world for comprehensive coverage.",
        },
        {
            icon: <Bell className="h-10 w-10" />,
            title: "Instant Alerts",
            description:
                "Receive immediate notifications when your endpoints experience downtime or performance issues.",
        },
        {
            icon: <Activity className="h-10 w-10" />,
            title: "Performance Metrics",
            description:
                "Track response times, availability, and other critical metrics to ensure optimal performance.",
        },
        {
            icon: <Clock className="h-10 w-10" />,
            title: "Scheduled Checks",
            description:
                "Set custom schedules for monitoring your endpoints based on your specific requirements.",
        },
        {
            icon: <Shield className="h-10 w-10" />,
            title: "Security Verification",
            description:
                "Verify SSL certificates and security headers to maintain a secure environment.",
        },
        {
            icon: <Zap className="h-10 w-10" />,
            title: "Fast Integration",
            description:
                "Quickly integrate with your existing infrastructure using our simple API and documentation.",
        },
    ];

    return (
        <section
            id="features"
            ref={sectionRef}
            className="relative bg-secondary/10 dark:bg-secondary/5 pt-16 pb-24 md:pt-24 md:pb-32 w-full flex justify-center overflow-hidden"
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <div className="absolute -left-40 -bottom-40 w-80 h-80 rounded-full border border-primary/20"></div>
                <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full border border-primary/20"></div>
                <div className="absolute left-1/2 top-1/3 w-64 h-64 rounded-full border border-primary/10 -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div className="container mx-auto px-4 flex flex-col items-center relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-border bg-background/60 backdrop-blur-sm">
                        <span className="text-primary">Features</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 text-foreground">
                        Powerful Features for{" "}
                        <span className="text-primary relative inline-block">
                            Reliable
                            <span className="absolute bottom-1 left-0 w-full h-[8px] bg-primary/20 -z-10 rounded"></span>
                        </span>{" "}
                        Monitoring
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to ensure your applications are
                        running smoothly, with alerts that matter and insights
                        that drive action.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 w-full">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group relative transition-all duration-700 ease-in-out ${
                                isVisible
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-10"
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-card dark:bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8 h-full flex flex-col">
                                <div className="mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
