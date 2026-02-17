"use client";

import type { Product, OrderProposal } from "@/lib/types";

interface ChatBubbleProps {
    readonly role: "bot" | "user";
    readonly text: string;
    readonly timestamp: string;
    readonly avatarUrl?: string;
    readonly product?: Product;
    readonly orderProposal?: OrderProposal;
    readonly onConfirmOrder?: (proposal: OrderProposal) => void;
    readonly onCancelOrder?: () => void;
}

export default function ChatBubble({
    role,
    text,
    timestamp,
    avatarUrl,
    product,
    orderProposal,
    onConfirmOrder,
    onCancelOrder,
}: ChatBubbleProps) {
    if (role === "user") {
        return (
            <div className="flex items-end justify-end gap-2.5">
                <div className="flex flex-col items-end gap-1 max-w-[80%]">
                    <div className="rounded-2xl rounded-tr-none bg-primary p-3.5 shadow-sm text-sm text-text-main font-medium leading-relaxed">
                        <p>{text}</p>
                    </div>
                    <span className="mr-1 text-[10px] text-gray-400 font-medium">{timestamp}</span>
                </div>
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="material-symbols-outlined text-[18px] text-primary-dark">person</span>
                </div>
            </div>
        );
    }

    // Bot message
    return (
        <div className="flex items-end gap-2.5 group">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                {avatarUrl ? (
                    <img className="h-full w-full object-cover" src={avatarUrl} alt="Bot" />
                ) : (
                    <span className="text-sm">🥩</span>
                )}
            </div>
            <div className="flex flex-col items-start gap-1 max-w-[85%]">
                <span className="ml-1 text-[11px] font-medium text-text-secondary">Carnicero IA</span>
                <div className="rounded-2xl rounded-tl-none bg-white p-3.5 shadow-sm text-sm text-text-main border border-gray-100 w-full">
                    <p className={product || orderProposal ? "mb-3 px-0.5" : ""}>{text}</p>

                    {/* Product card */}
                    {product && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                            {product.imageUrl && (
                                <img
                                    className="h-32 w-full object-cover"
                                    src={product.imageUrl}
                                    alt={product.name}
                                />
                            )}
                            <div className="p-3">
                                <h4 className="font-bold text-sm text-text-main">{product.name}</h4>
                                {product.description && (
                                    <p className="text-xs text-text-secondary mt-0.5">{product.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm font-bold text-primary-dark">{product.price}€/{product.unit}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                        {product.inStock ? "En Stock" : "Agotado"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Proposal — chat-style confirmation */}
                    {orderProposal && (
                        <div className="mt-2 overflow-hidden rounded-xl border-2 border-primary/30 bg-primary-light/40">
                            <div className="p-3 border-b border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary-dark text-[18px]">receipt_long</span>
                                    <h4 className="font-bold text-sm text-text-main">Resumen del Pedido</h4>
                                </div>
                                <div className="space-y-1.5">
                                    {orderProposal.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-text-main font-medium">{item.name} × {item.qty}</span>
                                            <span className="text-text-secondary font-semibold">{item.subtotal}€</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-3 py-2 flex items-center justify-between bg-primary-light/50">
                                <span className="text-xs font-bold text-text-main">Total</span>
                                <span className="text-base font-bold text-primary-dark">{orderProposal.total}€</span>
                            </div>
                            <div className="p-3 flex gap-2">
                                <button
                                    onClick={() => onConfirmOrder?.(orderProposal)}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-text-main shadow-sm transition-all hover:brightness-105 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Confirmar
                                </button>
                                <button
                                    onClick={onCancelOrder}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-gray-200 py-2.5 text-xs font-bold text-text-secondary transition-all hover:bg-gray-50 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                                    Cancelar
                                </button>
                            </div>
                            {orderProposal.estimatedMinutes > 0 && (
                                <div className="px-3 pb-3 flex items-center gap-1 text-[11px] text-text-secondary">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    Tiempo estimado: ~{orderProposal.estimatedMinutes} min
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <span className="ml-1 text-[10px] text-gray-400 font-medium">{timestamp}</span>
            </div>
        </div>
    );
}
