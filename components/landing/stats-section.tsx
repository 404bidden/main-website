"use client";

import { CheckCheck, Clock, Server, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function StatsSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [counters, setCounters] = useState({
        users: 0,
        uptime: 0,
        checks: 0,
        response: 0,
    });

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

    useEffect(() => {
        if (isVisible) {
            const duration = 2000; // Animation duration in ms
            const interval = 20; // Update interval in ms
            const steps = duration / interval;

            const targetValues = {
                users: 5000,
                uptime: 99.9,
                checks: 15,
                response: 250,
            };

            let step = 0;

            const timer = setInterval(() => {
                step += 1;
                const progress = step / steps;

                setCounters({
                    users: Math.floor(progress * targetValues.users),
                    uptime: Number((progress * targetValues.uptime).toFixed(1)),
                    checks: Math.floor(progress * targetValues.checks),
                    response: Math.floor(progress * targetValues.response),
                });

                if (step >= steps) {
                    clearInterval(timer);
                    setCounters(targetValues);
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [isVisible]);

    const stats = [
        {
            icon: <Users className="h-8 w-8 text-primary" />,
            value: counters.users.toLocaleString(),
            label: "Active Users",
        },
        {
            icon: <Server className="h-8 w-8 text-primary" />,
            value: `${counters.uptime}%`,
            label: "Uptime Guaranteed",
        },
        {
            icon: <CheckCheck className="h-8 w-8 text-primary" />,
            value: `${counters.checks}M+`,
            label: "Daily Checks",
        },
        {
            icon: <Clock className="h-8 w-8 text-primary" />,
            value: `${counters.response}ms`,
            label: "Avg. Response Time",
        },
    ];

    return (
        <section
            ref={sectionRef}
            className="relative w-full py-20 bg-background/50 backdrop-blur-sm flex justify-center overflow-hidden border-y border-border"
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-1/3 w-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute top-0 right-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

                <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] opacity-[0.03]"></div>
            </div>

            <div className="container px-4 relative z-10">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-border bg-background/60 backdrop-blur-sm">
                        <span className="text-primary">Our Impact</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                        The Numbers <span className="text-primary">Speak</span>{" "}
                        for Themselves
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`group relative bg-card/40 backdrop-blur-sm border border-border rounded-lg p-6 transition-all duration-700 ease-in-out hover:shadow-lg hover:shadow-primary/5 ${
                                isVisible
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-10"
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-center mb-4">
                                <div className="p-3 rounded-lg bg-primary/10 mr-4">
                                    {stat.icon}
                                </div>
                                <div className="text-4xl font-bold text-foreground">
                                    {stat.value}
                                </div>
                            </div>
                            <div className="text-lg text-muted-foreground font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
