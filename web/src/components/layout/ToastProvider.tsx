"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Toast = { id: number; message: string; tone?: "info" | "error" };

const ToastContext = createContext<(message: string, tone?: "info" | "error") => void>(() => {});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, tone: "info" | "error" = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, tone }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="fixed bottom-6 right-6 space-y-2 z-50">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded border text-sm shadow-lg ${
                            toast.tone === "error"
                                ? "bg-[#2a0b0b] border-[#8b0000]/40 text-white"
                                : "bg-[#0f172a] border-white/10 text-white/90"
                        }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
