'use client'

import { Activity, Bell, Clock, Globe, Shield, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from "react"

export function FeaturesSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [])

    const features = [
        {
            icon: <Globe className="h-10 w-10 text-primary" />,
            title: "Global Monitoring",
            description: "Monitor your endpoints from multiple regions around the world for comprehensive coverage.",
        },
        {
            icon: <Bell className="h-10 w-10 text-primary" />,
            title: "Instant Alerts",
            description: "Receive immediate notifications when your endpoints experience downtime or performance issues.",
        },
        {
            icon: <Activity className="h-10 w-10 text-primary" />,
            title: "Performance Metrics",
            description: "Track response times, availability, and other critical metrics to ensure optimal performance.",
        },
        {
            icon: <Clock className="h-10 w-10 text-primary" />,
            title: "Scheduled Checks",
            description: "Set custom schedules for monitoring your endpoints based on your specific requirements.",
        },
        {
            icon: <Shield className="h-10 w-10 text-primary" />,
            title: "Security Verification",
            description: "Verify SSL certificates and security headers to maintain a secure environment.",
        },
        {
            icon: <Zap className="h-10 w-10 text-primary" />,
            title: "Fast Integration",
            description: "Quickly integrate with your existing infrastructure using our simple API and documentation.",
        },
    ]

    return (
        <section id="features" ref={sectionRef} className="relative bg-secondary/30 dark:bg-secondary/10 py-24 md:py-32 w-full flex justify-center">
            <div className="container mx-auto px-4 flex flex-col items-center">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-foreground">
                        Powerful Features for <span className="text-primary">Reliable</span> Monitoring
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Everything you need to ensure your applications are running smoothly
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`bg-card dark:bg-card/80 backdrop-blur-sm border border-zinc-50 dark:border-zinc-700/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-700 ease-in-out flex flex-col items-center text-center p-8 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="mb-4 flex justify-center">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}