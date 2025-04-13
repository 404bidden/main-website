"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TestimonialsSection() {
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

    const testimonials = [
        {
            quote: "404bidden has been a game-changer for our team. We've reduced our downtime by 75% since implementing their monitoring solution.",
            name: "Sarah Johnson",
            role: "CTO, TechStart Inc.",
            avatar: "/avatars/avatar-1.png",
            initials: "SJ"
        },
        {
            quote: "The instant alerts have saved us countless hours of troubleshooting. We know exactly when and where issues occur before our users do.",
            name: "Michael Chen",
            role: "Lead DevOps Engineer, DataFlow",
            avatar: "/avatars/avatar-2.png",
            initials: "MC"
        },
        {
            quote: "Setting up 404bidden took minutes, not days. The intuitive interface makes monitoring our complex architecture simple and effective.",
            name: "Alex Rivera",
            role: "Software Architect, CloudNative",
            avatar: "/avatars/avatar-3.png",
            initials: "AR"
        },
    ];

    return (
        <section
            ref={sectionRef}
            className="relative w-full py-24 md:py-32 bg-background flex justify-center overflow-hidden"
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.07)_0%,transparent_70%)]"></div>
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full border border-primary/10"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full border border-primary/10"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-primary/5"></div>
                <div className="absolute top-40 left-20 w-10 h-10 rounded-full bg-primary/5"></div>
            </div>

            <div className="container px-4 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-border bg-background/60 backdrop-blur-sm">
                        <span className="text-primary">Testimonials</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 text-foreground">
                        Trusted by <span className="text-primary relative inline-block">
                            Developers
                            <span className="absolute bottom-1 left-0 w-full h-[8px] bg-primary/20 -z-10 rounded"></span>
                        </span> Worldwide
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        See what our users have to say about their experience with our platform
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`group relative transition-all duration-700 ease-in-out ${isVisible
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-10"
                                }`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <Card className="relative bg-card/80 backdrop-blur-sm border border-border h-full">
                                <CardContent className="p-8">
                                    <Quote className="h-10 w-10 text-primary/40 mb-6" />
                                    <p className="text-foreground mb-8 text-lg italic">"{testimonial.quote}"</p>
                                    <div className="flex items-center">
                                        <Avatar className="h-12 w-12 mr-4 border-2 border-primary/20">
                                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary">{testimonial.initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}