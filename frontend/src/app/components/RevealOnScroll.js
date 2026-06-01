"use client";

import { useEffect, useRef, useState } from "react";

export default function RevealOnScroll({
    children,
    className = "",
    delayMs = 0,
    threshold = 0.18,
    y = 16,
    durationMs = 700,
}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0px)" : `translateY(${y}px)`,
                transitionProperty: "opacity, transform",
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDelay: `${delayMs}ms`,
                willChange: "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}

