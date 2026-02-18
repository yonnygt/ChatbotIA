"use client";

interface MicButtonProps {
    readonly isRecording: boolean;
    readonly isProcessing: boolean;
    readonly onClick: () => void;
}

export default function MicButton({ isRecording, isProcessing, onClick }: MicButtonProps) {
    return (
        <div className="relative flex items-center justify-center">
            {/* Pulsing rings for recording state */}
            {isRecording && (
                <>
                    <span className="absolute h-16 w-16 rounded-full bg-red-500/30" style={{ animation: "pulse-wave 1.5s ease-in-out infinite" }} />
                    <span className="absolute h-20 w-20 rounded-full bg-red-500/15" style={{ animation: "pulse-wave 1.5s ease-in-out 0.3s infinite" }} />
                </>
            )}

            <button
                onClick={onClick}
                disabled={isProcessing}
                className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 active:scale-90 ${isRecording
                        ? "bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.4)] scale-105"
                        : isProcessing
                            ? "bg-surface-dark text-primary"
                            : "bg-primary text-background-dark shadow-soft hover:shadow-glow hover:brightness-110"
                    }`}
            >
                {isProcessing ? (
                    <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                ) : (
                    <span className="material-symbols-outlined text-[24px]">{isRecording ? "stop" : "mic"}</span>
                )}
            </button>
        </div>
    );
}
