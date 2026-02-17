"use client";

interface MicButtonProps {
    readonly isRecording: boolean;
    readonly isProcessing?: boolean;
    readonly onToggle: () => void;
}

export default function MicButton({
    isRecording,
    isProcessing,
    onToggle,
}: MicButtonProps) {
    return (
        <div className="relative">
            {/* Pulse rings when recording */}
            {isRecording && (
                <>
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                    <span
                        className="absolute -inset-2 rounded-full border-2 border-primary opacity-30"
                        style={{ animation: "pulse-wave 1.5s ease-in-out infinite" }}
                    />
                    <span
                        className="absolute -inset-4 rounded-full border-2 border-primary opacity-15"
                        style={{ animation: "pulse-wave 1.5s ease-in-out infinite 0.3s" }}
                    />
                </>
            )}

            <button
                onClick={onToggle}
                disabled={isProcessing}
                className={`group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-soft transition-all active:scale-90 hover:shadow-lg hover:brightness-105 disabled:opacity-50 disabled:pointer-events-none ${isRecording
                    ? "bg-red-500 shadow-red-500/30"
                    : "bg-primary"
                    }`}
            >
                {!isRecording && !isProcessing && (
                    <span className="absolute inset-0 rounded-full bg-white opacity-20 group-hover:animate-pulse" />
                )}

                {isProcessing ? (
                    <span className="material-symbols-outlined text-[24px] text-text-main relative z-10 animate-spin">
                        progress_activity
                    </span>
                ) : (
                    <span className="material-symbols-outlined text-[28px] text-text-main relative z-10">
                        {isRecording ? "stop" : "mic"}
                    </span>
                )}
            </button>
        </div>
    );
}
