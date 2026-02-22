// Shared types for SuperMarket AI

export interface User {
    id: number;
    email: string;
    name: string;
    role: "cliente" | "staff" | "admin";
    sectionId?: number | null;
    createdAt: string | null;
}

export interface Product {
    id: number;
    name: string;
    description: string | null;
    category: string;
    sectionId: number | null;
    sectionName?: string;
    price: string;
    priceVes: string | null;
    unit: string | null;
    imageUrl: string | null;
    sku: string | null;
    location: string | null;
    inStock: boolean | null;
    taxType: string | null;
}

export interface ChatMessage {
    id: string;
    role: "bot" | "user";
    text: string;
    timestamp: string;
    product?: Product;
    orderProposal?: OrderProposal;
    isOrderConfirmed?: boolean;
    showConfirmation?: boolean; // Controls if the order card is displayed
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

export interface Section {
    id: number;
    name: string;
    slug: string;
    emoji: string;
    icon: string;
    description: string | null;
    displayOrder: number;
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
    userId?: number | null;
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

export interface ExchangeRate {
    id: number;
    currency: string;
    rateVes: string;
    source: string;
    fetchedAt: string | null;
}
