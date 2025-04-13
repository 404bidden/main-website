import { GithubIcon } from "@/components/icons";
import { Mail, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full py-12 bg-secondary/10 border-t border-border">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold text-foreground mb-2">404bidden</h3>
                        <p className="text-muted-foreground mb-4">
                            Reliable application monitoring for developers.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://github.com/404bidden" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <GithubIcon className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="mailto:contact@404bidden.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                            <li><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} 404bidden. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}