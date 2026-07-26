"use client";

import { useEffect, useRef, useState } from "react";

// Animates a numeric value from 0 → target once the element scrolls into view.
// Returns { ref, value }: attach ref to the element you want to observe.
export function useCountUp(target, { durationMs = 1400, decimals = 0 } = {}) {
    const ref = useRef(null);
    const [value, setValue] = useState(0);
    const startedRef = useRef(false);
    const targetRef = useRef(Number(target) || 0);

    // Keep latest target without restarting the animation on every refresh.
    useEffect(() => {
        targetRef.current = Number(target) || 0;
        // If we already finished animating once, just track live updates directly.
        if (startedRef.current) setValue(targetRef.current);
    }, [target]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        const animate = () => {
            if (startedRef.current) return;
            startedRef.current = true;
            const to = targetRef.current;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min(1, (now - start) / durationMs);
                // easeOutCubic
                const eased = 1 - Math.pow(1 - t, 3);
                const current = to * eased;
                setValue(decimals ? Number(current.toFixed(decimals)) : Math.round(current));
                if (t < 1) requestAnimationFrame(tick);
                else setValue(targetRef.current);
            };
            requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    animate();
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [durationMs, decimals]);

    return { ref, value };
}
