"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from "react"

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <section className="relative w-full bg-gradient-to-b from-background via-background to-secondary/50 dark:from-background dark:via-background dark:to-secondary/20 flex justify-center">
            {/* Hero content */}
            <div className="container mx-auto px-4 py-20 md:py-32 flex justify-center">
                <div
                    className={`max-w-3xl mx-auto text-center transition-opacity duration-1000 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
                >
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-foreground">
                        Monitor Your Applications with <span className="text-primary">Precision</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Keep track of your endpoints, set custom monitoring parameters, and receive instant notifications when
                        issues arise.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="w-full sm:w-auto group">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>

            {/* Abstract shape */}
            <div className="absolute -bottom-24 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-muted/30 z-0"></div>
        </section>
    )
}