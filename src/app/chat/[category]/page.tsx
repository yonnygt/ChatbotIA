"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatBubble from "@/components/ChatBubble";
import QuickSuggestions from "@/components/QuickSuggestions";
import MicButton from "@/components/MicButton";
import { useGeminiRecorder } from "@/hooks/useGeminiRecorder";
import { useFavorites } from "@/hooks/useFavorites";
import type { Product, OrderProposal, OrderProposalItem, ChatMessage } from "@/lib/types";

const categoryTitles: Record<string, { title: string; emoji: string }> = {
    carnes: { title: "Carnes", emoji: "🥩" },
    charcutería: { title: "Charcutería", emoji: "🧀" },
    preparados: { title: "Preparados", emoji: "🍖" },
};

export default function ChatPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const router = useRouter();
    const decodedCategory = decodeURIComponent(category);
    const catInfo = categoryTitles[decodedCategory.toLowerCase()] || { title: decodedCategory, emoji: "🛒" };

    const { isFavorite, toggleFavorite } = useFavorites();

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "bot",
            text: `¡Hola! Soy tu carnicero virtual ${catInfo.emoji}. ¿Qué te gustaría pedir hoy de ${catInfo.title.toLowerCase()}?`,
            timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [currentCart, setCurrentCart] = useState<OrderProposalItem[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { isRecording, isProcessing, toggleRecording } = useGeminiRecorder();

    const handleToggleRecording = async () => {
        const result = await toggleRecording();
        if (result?.text) {
            setInput(result.text);
            handleSend(result.text);
        }
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async (text?: string) => {
        const msg = text || input;
        if (!msg.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            text: msg.trim(),
            timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Build clean history for the AI (no injected context needed)
            const history = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({
                    role: m.role === "bot" ? "assistant" : "user",
                    content: m.text,
                }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: msg.trim(),
                    category: decodedCategory,
                    history,
                    currentCart, // Send the accumulated cart to the AI
                }),
            });

            const data = await res.json();

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                role: "bot",
                text: data.reply || "Lo siento, no pude procesar tu solicitud.",
                timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            };

            // Update cart state from AI response
            if (data.orderProposal && data.orderProposal.items && data.orderProposal.items.length > 0) {
                setCurrentCart(data.orderProposal.items);
                botMessage.orderProposal = data.orderProposal;
                botMessage.showConfirmation = data.showConfirmation === true;
            } else if (data.orderProposal === null) {
                // AI explicitly cleared the cart (e.g., user said "cancel" or "nothing")
                // Only clear if the AI explicitly returned null
                // Keep current cart if AI just didn't mention it
            }

            if (data.product) botMessage.product = data.product;
            if (Array.isArray(data.suggestedProducts)) setSuggestedProducts(data.suggestedProducts);

            setMessages((prev) => [...prev, botMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "bot" as const,
                    text: "Ha ocurrido un error. Por favor, intenta de nuevo.",
                    timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, decodedCategory, currentCart]);

    const handleConfirmOrder = async (proposal: OrderProposal, messageId: string) => {
        if (isConfirming) return;
        setIsConfirming(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: proposal.items,
                    totalAmount: String(proposal.total),
                    notes: "",
                    estimatedMinutes: proposal.estimatedMinutes,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const orderNumber = data.order?.orderNumber || data.orderNumber || "N/A";

                // Mark the message as confirmed
                setMessages((prev) => prev.map(msg =>
                    msg.id === messageId ? { ...msg, isOrderConfirmed: true } : msg
                ));

                // Add success message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `confirm-${Date.now()}`,
                        role: "bot" as const,
                        text: `✅ ¡Pedido confirmado! Tu número es #${orderNumber.slice(-6)}. Puedes ver su estado en "Mis Pedidos".`,
                        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    },
                ]);

                // Clear the cart after successful order
                setCurrentCart([]);

                if (typeof window !== "undefined" && (window as any).__addToast) {
                    (window as any).__addToast("Pedido confirmado 🎉", "success");
                }
            } else {
                const errorData = await res.json().catch(() => null);
                console.error("Order creation failed:", errorData);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `orderr-${Date.now()}`,
                        role: "bot" as const,
                        text: "Error al crear el pedido. Intenta de nuevo.",
                        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `orderr-${Date.now()}`,
                    role: "bot" as const,
                    text: "Error al crear el pedido. Intenta de nuevo.",
                    timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancelOrder = () => {
        // Clear the cart
        setCurrentCart([]);

        setMessages((prev) => [
            ...prev,
            {
                id: `cancel-${Date.now()}`,
                role: "bot" as const,
                text: "Sin problema, he cancelado el pedido. ¿Te puedo ayudar con otra cosa?",
                timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            },
        ]);
    };

    const handleSelectSuggestion = (product: Product) => {
        handleSend(`Quiero ${product.name}`);
    };

    return (
        <div className="flex flex-col h-dvh bg-background-light max-w-lg mx-auto">
            {/* Header */}
            <header className="relative flex items-center gap-3 px-4 py-3 glass border-b border-gray-200/40 z-10">
                <button
                    onClick={() => router.push("/")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-background-light hover:bg-gray-100 transition-colors active:scale-95"
                >
                    <span className="material-symbols-outlined text-text-main text-[20px]">arrow_back</span>
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{catInfo.emoji}</span>
                        <h1 className="text-base font-bold text-text-main truncate">{catInfo.title}</h1>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-[11px] text-text-secondary font-medium">
                            {currentCart.length > 0
                                ? `${currentCart.length} producto${currentCart.length > 1 ? "s" : ""} en el pedido`
                                : "Carnicero IA activo"}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/orders")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-background-light hover:bg-gray-100 transition-colors active:scale-95"
                >
                    <span className="material-symbols-outlined text-text-main text-[20px]">receipt_long</span>
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        role={msg.role}
                        text={msg.text}
                        timestamp={msg.timestamp}
                        product={msg.product}
                        orderProposal={msg.orderProposal}
                        showConfirmation={msg.showConfirmation}
                        onConfirmOrder={(proposal) => handleConfirmOrder(proposal, msg.id)}
                        onCancelOrder={handleCancelOrder}
                        isConfirming={isConfirming}
                        isOrderConfirmed={msg.isOrderConfirmed}
                        isFavorite={msg.product ? isFavorite(msg.product.id) : false}
                        onToggleFavorite={msg.product ? () => toggleFavorite(msg.product!) : undefined}
                    />
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-text-secondary px-2">
                        <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Quick Suggestions */}
            {suggestedProducts.length > 0 && (
                <div className="px-4 pb-1 border-t border-gray-100/60">
                    <QuickSuggestions products={suggestedProducts} onSelect={handleSelectSuggestion} />
                </div>
            )}

            {/* Input area */}
            <div className="px-4 py-3 glass border-t border-gray-200/40">
                <div className="flex items-end gap-3">
                    <div className="flex-1 flex items-center gap-2 rounded-2xl bg-background-light border border-gray-100/80 px-4 py-2.5">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Escribe tu pedido..."
                            className="flex-1 bg-transparent text-sm text-text-main placeholder:text-text-secondary/50 outline-none"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-background-dark disabled:opacity-30 shadow-soft hover:brightness-110 transition-all active:scale-90"
                        >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                        </button>
                    </div>
                    <MicButton
                        isRecording={isRecording}
                        isProcessing={isProcessing}
                        onClick={handleToggleRecording}
                    />
                </div>
            </div>
        </div>
    );
}
