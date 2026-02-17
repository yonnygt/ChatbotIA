import { create } from "zustand";

interface AudioState {
    isRecording: boolean;
    setRecording: (v: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
    isRecording: false,
    setRecording: (v) => set({ isRecording: v }),
}));
