"use client";

import type { Product, OrderProposal } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
    readonly role: "bot" | "user";
    readonly text: string;
    readonly timestamp: string;
    readonly avatarUrl?: string;
    readonly product?: Product;
    readonly orderProposal?: OrderProposal;
    readonly onConfirmOrder?: (proposal: OrderProposal) => void;
    readonly onCancelOrder?: () => void;
    readonly isConfirming?: boolean;
    readonly isOrderConfirmed?: boolean;
    readonly showConfirmation?: boolean;
    readonly isFavorite?: boolean;
    readonly onToggleFavorite?: () => void;
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
    isConfirming = false,
    isOrderConfirmed = false,
    showConfirmation,
    isFavorite = false,
    onToggleFavorite,
}: ChatBubbleProps) {
    if (role === "user") {
        return (
            <div className="flex items-end justify-end gap-2.5">
                <div className="flex flex-col items-end gap-1 max-w-[80%]">
                    <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-primary-dark p-3.5 shadow-soft text-sm text-background-dark font-medium leading-relaxed">
                        <p>{text}</p>
                    </div>
                    <span className="mr-1 text-[10px] text-text-secondary/60 font-medium">{timestamp}</span>
                </div>
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                </div>
            </div>
        );
    }

    // Bot message
    return (
        <div className="flex items-end gap-2.5 group">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-background-dark/5 flex items-center justify-center border border-gray-100">
                {avatarUrl ? (
                    <img className="h-full w-full object-cover" src={avatarUrl} alt="Bot" />
                ) : (
                    <span className="text-sm">🛒</span>
                )}
            </div>
            <div className="flex flex-col items-start gap-1 max-w-[85%]">
                <span className="ml-1 text-[11px] font-semibold text-text-secondary/70">Asistente SuperMarket</span>
                <div className="rounded-2xl rounded-tl-sm bg-white p-3.5 shadow-sm text-sm text-text-main border border-gray-100/80 w-full">
                    <div className={`chat-markdown ${product || orderProposal ? "mb-3 px-0.5" : ""}`}>
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-slate-800">{children}</strong>,
                                ul: ({ children }) => <ul className="my-1.5 space-y-1 list-none pl-0">{children}</ul>,
                                ol: ({ children }) => <ol className="my-1.5 space-y-1 list-decimal pl-5">{children}</ol>,
                                li: ({ children }) => (
                                    <li className="flex items-start gap-1.5 text-sm">
                                        <span className="text-primary mt-0.5 shrink-0">•</span>
                                        <span>{children}</span>
                                    </li>
                                ),
                                h3: ({ children }) => <h3 className="font-bold text-sm text-slate-800 mt-2 mb-1">{children}</h3>,
                                h4: ({ children }) => <h4 className="font-bold text-xs text-slate-700 mt-1.5 mb-0.5 uppercase tracking-wider">{children}</h4>,
                            }}
                        >
                            {text}
                        </ReactMarkdown>
                    </div>

                    {/* Product card */}
                    {product && (
                        <div className="mt-2 relative overflow-hidden rounded-xl border border-gray-100 bg-background-light">
                            {/* Favorite Button */}
                            {onToggleFavorite && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition-all z-10"
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${isFavorite ? "text-red-500 fill-current" : "text-gray-400"}`}>
                                        favorite
                                    </span>
                                </button>
                            )}
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
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${product.inStock ? "bg-primary/10 text-primary-dark" : "bg-red-50 text-red-500"}`}>
                                        {product.inStock ? "En Stock" : "Agotado"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Partial order summary (no confirm buttons — user is still adding items) */}
                    {orderProposal && !showConfirmation && !isOrderConfirmed && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-primary/10 bg-primary-light/15">
                            <div className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary/70 text-[16px]">shopping_cart</span>
                                    <h4 className="font-semibold text-xs text-text-secondary">Tu pedido hasta ahora</h4>
                                </div>
                                <div className="space-y-1">
                                    {orderProposal.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-text-main">{item.name} × {item.qty}</span>
                                            <span className="text-text-secondary font-medium">{item.subtotal}€</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between text-xs">
                                    <span className="text-text-secondary font-medium">Subtotal</span>
                                    <span className="font-bold text-text-main">{orderProposal.total}€</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full order confirmation card (with confirm/cancel buttons) */}
                    {orderProposal && showConfirmation && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-primary-light/30">
                            <div className="p-3 border-b border-primary/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
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
                            <div className="px-3 py-2.5 flex items-center justify-between bg-primary/5">
                                <span className="text-xs font-bold text-text-main">Total</span>
                                <span className="text-base font-extrabold text-primary-dark">{orderProposal.total}€</span>
                            </div>
                            <div className="p-3 flex gap-2">
                                {isOrderConfirmed ? (
                                    <div className="w-full py-2.5 bg-gray-100 text-gray-400 text-xs font-bold text-center rounded-xl border border-gray-200 cursor-not-allowed select-none">
                                        Pedido Confirmado
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => !isConfirming && onConfirmOrder?.(orderProposal)}
                                            disabled={isConfirming}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-background-dark shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                                        >
                                            {isConfirming ? (
                                                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            )}
                                            {isConfirming ? "Confirmando..." : "Confirmar"}
                                        </button>
                                        <button
                                            onClick={onCancelOrder}
                                            disabled={isConfirming}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-gray-200 py-2.5 text-xs font-bold text-text-secondary transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                                            Cancelar
                                        </button>
                                    </>
                                )}
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
                <span className="ml-1 text-[10px] text-text-secondary/60 font-medium">{timestamp}</span>
            </div>
        </div>
    );
}
