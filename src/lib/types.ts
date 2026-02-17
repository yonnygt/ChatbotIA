// Shared types for ButcherAI

export interface Product {
    id: number;
    name: string;
    description: string | null;
    category: string;
    price: string;
    unit: string | null;
    imageUrl: string | null;
    sku: string | null;
    location: string | null;
    inStock: boolean | null;
}

export interface ChatMessage {
    id: string;
    role: "bot" | "user";
    text: string;
    timestamp: string;
    product?: Product;
    orderProposal?: OrderProposal;
}

export interface OrderProposal {
    items: OrderProposalItem[];
    total: string;
    estimatedMinutes: number;
}

export interface OrderProposalItem {
    productId: number;
    name: string;
    qty: string;
    unitPrice: string;
    subtotal: string;
}

export interface Category {
    name: string;
    emoji: string;
    icon: string;
    description: string;
}

export interface Order {
    id: number;
    orderNumber: string;
    status: string;
    items: OrderItem[];
    notes?: string | null;
    estimatedMinutes: number | null;
    totalAmount: string | null;
    priority?: string | null;
    userId?: string | null;
    createdAt: string | null;
    updatedAt?: string | null;
}

export interface OrderItem {
    name: string;
    qty: string;
    unitPrice: string;
    subtotal: string;
    productId?: number;
}
