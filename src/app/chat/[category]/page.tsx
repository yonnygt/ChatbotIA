"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ChatBubble from "@/components/ChatBubble";
import MicButton from "@/components/MicButton";
import { useGeminiRecorder } from "@/hooks/useGeminiRecorder";
import type { ChatMessage, OrderProposal, Product } from "@/lib/types";

// Category display metadata
const categoryTitles: Record<string, { title: string; subtitle: string; emoji: string }> = {
    carnes: { title: "Carnicería IA", subtitle: "Pídele lo que necesites", emoji: "🥩" },
    charcutería: { title: "Charcutería IA", subtitle: "Embutidos y delicatessen", emoji: "🍖" },
    preparados: { title: "Preparados IA", subtitle: "Platos listos", emoji: "🍗" },
};

interface ChatPageParams {
    params: Promise<{ category: string }>;
}

export default function ChatPage({ params }: ChatPageParams) {
    const { category } = use(params);
    const decodedCategory = decodeURIComponent(category);
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const meta = categoryTitles[decodedCategory.toLowerCase()] || {
        title: `${decodedCategory} IA`,
        subtitle: "Tu asistente inteligente",
        emoji: "🤖",
    };

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "bot",
            text: `¡Hola! Soy tu ${meta.title}. ${meta.subtitle}. ¿Qué te pongo hoy?`,
            timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [voiceProcessing, setVoiceProcessing] = useState(false);

    // Voice recording hook
    const { isRecording, toggleRecording } = useGeminiRecorder();

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const addUserMessage = (text: string) => {
        const msg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            text,
            timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, msg]);
    };

    const addBotMessage = (text: string, orderProposal?: OrderProposal, product?: Product) => {
        const msg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            text,
            timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            orderProposal,
            product,
        };
        setMessages((prev) => [...prev, msg]);
    };

    const sendToAI = async (userMessage: string) => {
        setIsLoading(true);
        try {
            // Build conversation history (last 10 messages)
            // Bot messages must be wrapped as JSON to match the expected response format
            const history = messages.slice(-10).map((m) => ({
                role: m.role === "bot" ? "model" : "user",
                text: m.role === "bot"
                    ? JSON.stringify({ reply: m.text, suggestedProducts: [], orderProposal: null })
                    : m.text,
            }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    category: decodedCategory,
                    conversationHistory: history,
                }),
            });

            const data = await res.json();

            if (data.error) {
                addBotMessage("Lo siento, hubo un error. ¿Puedes repetir?");
            } else {
                addBotMessage(data.reply, data.orderProposal || undefined);
                if (data.suggestedProducts?.length) {
                    setSuggestedProducts(data.suggestedProducts);
                }
            }
        } catch {
            addBotMessage("Error de conexión. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicToggle = async () => {
        if (isLoading || voiceProcessing) return;

        if (isRecording) {
            // Stop & transcribe
            setVoiceProcessing(true);
            try {
                const result = await toggleRecording();
                if (result?.text && result.text.trim().length > 0) {
                    addUserMessage(result.text);
                    await sendToAI(result.text);
                }
            } finally {
                setVoiceProcessing(false);
            }
        } else {
            // Start recording
            await toggleRecording();
        }
    };

    const handleSend = () => {
        const text = inputText.trim();
        if (!text || isLoading) return;
        setInputText("");
        addUserMessage(text);
        sendToAI(text);
    };

    const handleConfirmOrder = async (proposal: OrderProposal) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "confirm_order",
                    orderItems: proposal.items,
                }),
            });
            const data = await res.json();
            if (data.success) {
                addBotMessage(data.reply || `¡Pedido confirmado! 🎉 Tu número es ${data.order?.orderNumber}. Estará listo en ~${proposal.estimatedMinutes} minutos.`);
            } else {
                addBotMessage("Hubo un error al crear el pedido. Intenta de nuevo.");
            }
        } catch {
            addBotMessage("Error de conexión al confirmar. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = () => {
        addBotMessage("Sin problema, he cancelado la propuesta. ¿Necesitas algo más?");
    };

    const handleSuggestionClick = (name: string) => {
        const text = `Quiero ${name}`;
        addUserMessage(text);
        sendToAI(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background-light shadow-2xl sm:rounded-[32px] sm:my-8 sm:border sm:border-gray-200">
            {/* Header */}
            <header className="z-20 bg-white/95 backdrop-blur-md px-4 pt-12 pb-3 shadow-sm shrink-0 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px] text-text-main">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                            <span className="text-xl">{meta.emoji}</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-text-main">{meta.title}</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[11px] text-text-secondary">En línea</span>
                            </div>
                        </div>
                    </div>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                        <span className="material-symbols-outlined text-[20px] text-text-main">more_vert</span>
                    </button>
                </div>
            </header>

            {/* Messages */}
            <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-background-light">
                {messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        role={msg.role}
                        text={msg.text}
                        timestamp={msg.timestamp}
                        product={msg.product}
                        orderProposal={msg.orderProposal}
                        onConfirmOrder={handleConfirmOrder}
                        onCancelOrder={handleCancelOrder}
                    />
                ))}

                {isLoading && (
                    <div className="flex items-end gap-3">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-sm">{meta.emoji}</span>
                        </div>
                        <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-sm border border-gray-100">
                            <div className="flex gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Quick Suggestions */}
            {suggestedProducts.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 bg-white/80 backdrop-blur-sm border-t border-gray-50">
                    {suggestedProducts.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSuggestionClick(p.name)}
                            className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-transform active:scale-95 hover:border-primary/40"
                        >
                            <span className="text-xs font-semibold text-text-main">{p.name}</span>
                            <span className="text-[11px] text-text-secondary">{p.price}€</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="z-30 flex items-center gap-2 bg-white px-3 py-3 border-t border-gray-100 pb-safe">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu pedido..."
                    className="flex-1 rounded-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-text-main placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    disabled={isLoading}
                />
                {inputText.trim() ? (
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary shadow-soft transition-all active:scale-90 hover:brightness-105 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[22px] text-text-main">send</span>
                    </button>
                ) : (
                    <MicButton
                        isRecording={isRecording}
                        isProcessing={voiceProcessing}
                        onToggle={handleMicToggle}
                    />
                )}
            </div>
        </div>
    );
}
