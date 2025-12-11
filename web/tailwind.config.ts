import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class", // enable class-based dark mode
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // Glassmorphism utilities
            backdropBlur: {
                xs: "2px",
                sm: "4px",
                md: "8px",
                lg: "12px",
                xl: "16px",
            },
            backgroundOpacity: {
                5: "0.05",
                10: "0.10",
                20: "0.20",
            },
            colors: {
                // Minimal dark color palette inspired by Fallen.io
                blood: {
                    DEFAULT: "#8b0000",
                    light: "#b02020",
                    dark: "#600000",
                },
            },
            fontFamily: {
                // Clean, serious typography
                serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
                mono: ["JetBrains Mono", "Consolas", "monospace"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
            },
            letterSpacing: {
                widest: "0.2em",
            },
            animation: {
                "fade-in": "fadeIn 1s ease-out forwards",
                "slide-up": "slideUp 0.8s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(30px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
