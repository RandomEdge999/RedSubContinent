"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navigation = [
    { name: "Story", href: "/story" },
    { name: "Explorer", href: "/explorer" },
    { name: "Data", href: "/data" },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-sm border-b border-white/5">
            <nav className="container mx-auto px-6 lg:px-12">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="group">
                        <span className="text-sm uppercase tracking-[0.3em] text-white/80 group-hover:text-white transition-colors">
                            Red SubContinent
                        </span>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center space-x-12">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "nav-link",
                                    pathname === item.href && "nav-link-active"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
}
