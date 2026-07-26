"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders a UPI QR locally. This used to point at api.qrserver.com, which meant the
// payee's UPI ID, the order number and the amount were sent to a third party on every
// payment screen, and showed no QR at all if that host was slow or blocked. Generating it in
// the browser keeps payment details private and works offline.
export default function UpiQr({ value, size = 220, className = "" }) {
    const [svg, setSvg] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!value) {
            setSvg("");
            return undefined;
        }

        QRCode.toString(value, {
            type: "svg",
            margin: 1,
            width: size,
            errorCorrectionLevel: "M",
            color: { dark: "#000000", light: "#ffffff" },
        })
            .then((generated) => {
                if (!cancelled) {
                    setSvg(generated);
                    setFailed(false);
                }
            })
            .catch(() => { if (!cancelled) setFailed(true); });

        return () => { cancelled = true; };
    }, [value, size]);

    if (failed || !value) return null;

    if (!svg) {
        return (
            <div
                className={`bg-white/5 rounded-xl animate-pulse ${className}`}
                style={{ width: size, height: size }}
                aria-label="Generating QR code"
            />
        );
    }

    return (
        <div
            className={className}
            style={{ width: size, height: size }}
            // qrcode emits a self-contained <svg> built from `value`; no user HTML involved
            dangerouslySetInnerHTML={{ __html: svg }}
            role="img"
            aria-label="UPI payment QR code"
        />
    );
}
