"use client";

import { useCallback, useRef, useState } from "react";

interface TranscriptionResult {
    text: string;
    intent?: string;
    extracted_items?: Array<{
        productId: number;
        name: string;
        qty: string;
        notes?: string;
        price?: number;
    }>;
}

export function useGeminiRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const isProcessingRef = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async (): Promise<boolean> => {
        // Prevent starting if already recording or processing
        if (isProcessingRef.current || mediaRecorderRef.current) {
            return false;
        }

        try {
            if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                console.error("Media Devices API not supported.");
                alert("Tu navegador no soporta acceso al micrófono. Intenta usar Chrome o Safari.");
                return false;
            }

            isProcessingRef.current = true;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
            isProcessingRef.current = false;

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Error al acceder al micrófono. Verifica los permisos.");
            isProcessingRef.current = false;
            return false;
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<TranscriptionResult | null> => {
        // Prevent double-stop: if already processing or no active recorder, bail
        if (isProcessingRef.current) {
            return null;
        }

        const mr = mediaRecorderRef.current;
        if (!mr || mr.state === "inactive") {
            // Clean up state
            setIsRecording(false);
            mediaRecorderRef.current = null;
            return null;
        }

        // Lock processing immediately
        isProcessingRef.current = true;

        return new Promise((resolve) => {
            mr.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];

                // Update state
                setIsRecording(false);
                mediaRecorderRef.current = null;

                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate([30, 30, 30]);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }

                // Don't send empty recordings (< 1KB is likely silence/noise)
                if (blob.size < 1000) {
                    console.warn("Recording too short, ignoring:", blob.size, "bytes");
                    isProcessingRef.current = false;
                    resolve(null);
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append("audio", blob, "recording.webm");

                    const res = await fetch("/api/voice/transcribe", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(`Transcription failed (${res.status}): ${errText}`);
                    }
                    const data: TranscriptionResult = await res.json();
                    isProcessingRef.current = false;
                    resolve(data);
                } catch (err) {
                    console.error("Transcription error:", err);
                    isProcessingRef.current = false;
                    resolve(null);
                }
            };

            mr.stop();
        });
    }, []);

    const toggleRecording = useCallback(async (): Promise<TranscriptionResult | null> => {
        if (isRecording) {
            return stopRecording();
        } else {
            await startRecording();
            return null;
        }
    }, [isRecording, startRecording, stopRecording]);

    return {
        isRecording,
        isProcessing: isProcessingRef.current,
        startRecording,
        stopRecording,
        toggleRecording,
    };
}
