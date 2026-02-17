"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
    value: string;
    width?: number;
    className?: string;
}

export default function QRCode({ value, width = 200, className = "" }: QRCodeProps) {
    const [src, setSrc] = useState<string>("");

    useEffect(() => {
        QRCodeLib.toDataURL(value, {
            width,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        })
            .then(setSrc)
            .catch((err) => console.error(err));
    }, [value, width]);

    if (!src) return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} style={{ width, height: width }} />;

    return <img src={src} alt="QR Code" className={`rounded-lg ${className}`} width={width} height={width} />;
}
