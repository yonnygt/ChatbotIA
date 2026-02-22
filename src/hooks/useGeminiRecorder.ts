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
    serverBusy?: boolean;
}

export function useGeminiRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000;

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
            setIsProcessing(true);

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
            setIsProcessing(false);

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Error al acceder al micrófono. Verifica los permisos.");
            isProcessingRef.current = false;
            setIsProcessing(false);
            return false;
        }
    }, []);

    const sendAudioToServer = useCallback(async (blob: Blob): Promise<TranscriptionResult | null> => {
        try {
            const formData = new FormData();
            formData.append("audio", blob, "recording.webm");

            const res = await fetch("/api/voice/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                // Server busy (503) — auto retry with backoff
                if (res.status === 503 && retryCountRef.current < MAX_RETRIES) {
                    retryCountRef.current++;
                    console.log(`[Audio] Server busy, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
                    await new Promise((r) => setTimeout(r, RETRY_DELAY * retryCountRef.current));
                    return sendAudioToServer(blob);
                }

                // Known error statuses (429 Rate Limit, 413 Payload Too Large)
                if (res.status === 429 || res.status === 413 || res.status === 503) {
                    try {
                        const errorData: TranscriptionResult = await res.json();
                        return errorData;
                    } catch (e) {
                        // fallback
                    }
                }

                const errText = await res.text();
                throw new Error(`Transcription failed (${res.status}): ${errText}`);
            }

            retryCountRef.current = 0; // Reset retry count on success
            const data: TranscriptionResult = await res.json();
            return data;
        } catch (err) {
            console.error("Transcription error:", err);
            return null;
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
        setIsProcessing(true);

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

                // Don't send empty recordings (<1KB is likely silence/noise)
                if (blob.size < 1000) {
                    console.warn("Recording too short, ignoring:", blob.size, "bytes");
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                    resolve(null);
                    return;
                }

                // Send to server with automatic retry on 503
                retryCountRef.current = 0;
                const result = await sendAudioToServer(blob);
                isProcessingRef.current = false;
                setIsProcessing(false);
                resolve(result);
            };

            mr.stop();
        });
    }, [sendAudioToServer]);

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
        isProcessing,
        startRecording,
        stopRecording,
        toggleRecording,
    };
}
