"use client";

import { useEffect, useState } from "react";

const LANGS = [
    { code: "en", label: "EN" },
    { code: "hi", label: "HI" },
    { code: "ur", label: "UR" },
];

export default function LanguageDirectionToggle() {
    const [lang, setLang] = useState("en");
    const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

    useEffect(() => {
        const storedLang = localStorage.getItem("lang") || "en";
        const storedDir = (localStorage.getItem("dir") as "ltr" | "rtl") || "ltr";
        setLang(storedLang);
        setDir(storedDir);
        document.documentElement.lang = storedLang;
        document.documentElement.dir = storedDir;
    }, []);

    const updateLang = (newLang: string) => {
        setLang(newLang);
        document.documentElement.lang = newLang;
        localStorage.setItem("lang", newLang);
    };

    const toggleDir = () => {
        const nextDir = dir === "ltr" ? "rtl" : "ltr";
        setDir(nextDir);
        document.documentElement.dir = nextDir;
        localStorage.setItem("dir", nextDir);
    };

    return (
        <div className="flex items-center gap-3 text-xs text-white/70">
            <button
                onClick={toggleDir}
                className="px-2 py-1 border border-white/15 rounded hover:bg-white/10 transition-colors"
                aria-label="Toggle text direction"
            >
                {dir.toUpperCase()}
            </button>
            <div className="flex gap-1">
                {LANGS.map((l) => (
                    <button
                        key={l.code}
                        onClick={() => updateLang(l.code)}
                        className={`px-2 py-1 border rounded transition-colors ${
                            lang === l.code
                                ? "border-[#8b0000] text-white"
                                : "border-white/15 text-white/60 hover:text-white"
                        }`}
                        aria-label={`Switch language to ${l.label}`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
