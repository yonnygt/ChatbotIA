// Mock data for ButcherAI — decoupled from components

export interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    unit: string;
    imageUrl: string;
    sku: string;
    location: string;
    inStock: boolean;
}

export interface ChatMessage {
    id: string;
    role: "bot" | "user";
    text: string;
    timestamp: string;
    product?: Product;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: "pending" | "preparing" | "ready" | "completed";
    items: { name: string; qty: string; price: number }[];
    notes?: string;
    estimatedMinutes: number;
    totalAmount: number;
    timestamp: string;
    priority?: "high" | "normal";
}

export interface FavoriteOrder {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    items: { name: string; qty: string }[];
    totalAmount: number;
    lastOrdered: string;
}

/* ——— Products ——— */
export const mockProducts: Product[] = [
    { id: 1, name: "Solomillo de Ternera", description: "Corte premium", category: "carnes", price: 48.90, unit: "kg", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTuG0qYnf0YyU_vYmtzPp9CrtL8HTFPi4v2vLqCOoKewZyVBUTC2iK32d0ppiccaGznmb-oVlOWl23N2vjdVj03jtQubVpae3QcjeXHucPPLfs_icoHBLItqRRjjnsunUueGPxYCbmGsQOYQacH7VoS66G1jInId8cF6QaqQLdSN8q3QafoONh1STXdoxk_z6RoNbgkuMRMKaLRNGpxDCApFNR8IlWAqZXNKhxqHElFBkzRY8FLmGeGDYLlxpcGDCpcdknYXR5Xr4_", sku: "10001", location: "Mostrador", inStock: true },
    { id: 2, name: "Carne Molida Magra", description: "Ternera magra", category: "carnes", price: 12.50, unit: "lb", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHUI9wp3u3iqRoDPDBS6d9PV7p73vLZ00vw1l-DEM_xWGCAlySqKgezECsPGfilcFfFOvhBZ1Ob3mDiWwmd0fQKW1P1Y2jowG6ucuWllUuET9Jei2NzwQfU4M_iHmaBMNNa7yE2zNwFbfXpf11goihbNE_hjmT8uyEhP8C1UKFZrChHab2nMkJdEWqhqpzfxT2O5MyUzvGktx4z2SBVsbEm3tQwwNo0E5zeCUQIlgEwsU5RR_-zoCNdC7mJ0IJg-iYNDILOm8pjrHG", sku: "49201", location: "Pasillo 4", inStock: true },
    { id: 3, name: "Pechuga de Pollo", description: "Ecológico, Corral", category: "carnes", price: 14.90, unit: "kg", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCALK9TfvNWzwWlVOJWVpgbhoJ2JtnI8unWLuiVV1-a2aoQqGoGHca6HXsgvPyBXKlzrcl_gAP_JWnpHeaFT48JCG9fRtLzDt36qGJ7Uqp1K6i4YOgD_S3jVu7F6cSOR_Dvy-lpxtABr8tu5T935XR6EJLePoj60jLxKEapHpdUOcpoZ2mP4ZW3KlaGUirQuaaLTGCKRyDLZd9pkm7BlxRq7lJ2lRLAbm-R0BEmVt_Q-TinFvzsSMRaSdNBjQ9nU4mLcbPfGSyetp8L", sku: "20010", location: "Mostrador", inStock: true },
    { id: 4, name: "Pechuga de Pavo Rebanada", description: "Baja en grasa", category: "charcutería", price: 22.00, unit: "kg", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXawr9H-e9s92MynDSs1i_lInopycbnJIdgsrIroUI9Gfr-gwsEtfWy6kIzhOUqPzdF8--VtBVy8Z2VVVWg7ZmV4coXggpaUYdJrkVK-8mXXD6HPMh2Gtil-HzjWTTKiynrO78OB9x0IhXMPRiX3cXCgD5QBRO2YxbIeLQb7rAPhU_wuArjky2n8RkCj6C0_cEufX-esVORHqVIla44EM1BMPzJQl7gEu3JIb6n8H1dPq8r45-lLfrGrGDPgea2ut2vb_5qiDqJk_m", sku: "88210", location: "Mostrador", inStock: true },
    { id: 5, name: "Prosciutto di Parma", description: "Importado de Italia", category: "charcutería", price: 68.00, unit: "kg", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNZX_popegsUEwVF7SygUQ7H78B6o6sGG8vkd8d2R8rmwInKuxfVkQtPwV2IrOFzeLbD7biDcCUqK6FVisSb88m0O_qF58iCwPdh0egsherGHnQDWenbHIxdi_MBFzeetxjTNFFRmOqEy5xD0Wq1Gpnpb1Xc84UernUpjq79OdfvQMFJa0gFjyYt4ltD3X21kO4GzBDldUqBRnKZUA7aWTR9NHtK7ewKIa3d0oEPWOTBCE6ltc3_WTxBnXpzASkrYgwcrCvEGhdvOo", sku: "11029", location: "Vitrina 2", inStock: false },
    { id: 6, name: "Salami Génova", description: "Embutido italiano", category: "charcutería", price: 28.50, unit: "kg", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCDD1nbkxG-8CmVDygGv3iYpm0SZwp9LcC_wRP1NcdbSHPs-7NZxJWocT6QqPs-rCcapiqG7jiqjP4uN1RAKfx_8LgWQO5b9eKFkASAaU23zVHVQen6ofWEUP0hgzwfL8suln_Zbxqxm0qEm8I-3D3jvzK1poKhKt0ZsKh6NTex9PT870guLxZb3yV_jZJDkUEEYRnlWVqp2bQ-b-P1sg9V3rNwh8Jk9XhLyXPXOaK8cIlpyQI_ivqwrJnImnniSaV0DABKhUaPMG1", sku: "33910", location: "Vitrina 2", inStock: true },
    { id: 7, name: "Pollo Rostizado - Limón", description: "Con hierbas aromáticas", category: "preparados", price: 15.90, unit: "ud", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAex6ZUDh4Mv7YUU9gtl3qUpPoFJmgYheh0i7tqr6Sqc7a6s30NSyxSGe62QvmqDetSfVO0lonwUIp4wBhFLmJJPYUPUi8vdNhwjWSxwQI6VPE_npuCZ5AiNddJ7u6VL2GqusR3NA-xslWK54vXROeIixL-jkHcUV7C57CxDMENvYkuETqxbZz4PFiA5cH82KYYAvl57l1AW8Qfk1CE-RqVXlgHqy1Y2BK_jn8uwVULw5KFpSyqESNvs0iDc4F46c4B0GTPo9yr5Eo1", sku: "55001", location: "Barra Caliente", inStock: true },
];

/* ——— Quick Suggestions ——— */
export const quickSuggestions = [
    { emoji: "🧀", name: "Queso Gouda" },
    { emoji: "🍖", name: "Jamón" },
    { emoji: "🥖", name: "Baguette" },
    { emoji: "🦃", name: "Pavo" },
    { emoji: "🥩", name: "Chuletón" },
];

/* ——— Chat Messages ——— */
export const mockChatMessages: ChatMessage[] = [
    {
        id: "1",
        role: "bot",
        text: "¡Bienvenido de nuevo! El solomillo tiene una pinta excepcional hoy, recién cortado esta mañana. ¿Qué te pongo?",
        timestamp: "10:23 AM",
    },
    {
        id: "2",
        role: "user",
        text: "¡Hola! Necesito 500g de solomillo, cortes finos.",
        timestamp: "10:25 AM",
    },
    {
        id: "3",
        role: "bot",
        text: "Entendido. 500g de Solomillo, corte fino. Lo he añadido a tu cola.",
        timestamp: "10:25 AM",
        product: mockProducts[0],
    },
];

/* ——— Orders (staff) ——— */
export const mockOrders: Order[] = [
    { id: "1", orderNumber: "#1234", status: "pending", items: [{ name: "Solomillo", qty: "500g", price: 24.50 }], notes: "Por favor, cortar en 2 filetes gruesos, quitar el exceso de grasa.", estimatedMinutes: 10, totalAmount: 24.50, timestamp: "12:45 PM", priority: "high" },
    { id: "2", orderNumber: "#4922", status: "pending", items: [{ name: "Pechuga de Pollo", qty: "500g", price: 7.45 }], notes: "Bolsas separadas", estimatedMinutes: 8, totalAmount: 7.45, timestamp: "12:48 PM" },
    { id: "3", orderNumber: "#4918", status: "preparing", items: [{ name: "Jamón Serrano", qty: "200g", price: 9.00 }], notes: "Cortes finos", estimatedMinutes: 5, totalAmount: 9.00, timestamp: "12:30 PM" },
    { id: "4", orderNumber: "#4915", status: "pending", items: [{ name: "Carne Picada", qty: "1kg", price: 12.50 }], estimatedMinutes: 12, totalAmount: 12.50, timestamp: "12:15 PM" },
];

/* ——— Customer Orders (history) ——— */
export const mockCustomerOrders: Order[] = [
    { id: "a", orderNumber: "#1209", status: "preparing", items: [{ name: "Jamón Serrano", qty: "200g", price: 9.00 }, { name: "Provolone", qty: "100g", price: 3.20 }], estimatedMinutes: 5, totalAmount: 18.20, timestamp: "Ahora" },
    { id: "b", orderNumber: "#1185", status: "ready", items: [{ name: "Chuletón", qty: "1kg", price: 62.00 }], estimatedMinutes: 0, totalAmount: 62.00, timestamp: "Ahora" },
    { id: "c", orderNumber: "#1120", status: "completed", items: [{ name: "Filete de Salmón", qty: "500g", price: 18.00 }, { name: "Langostinos", qty: "200g", price: 12.00 }], estimatedMinutes: 0, totalAmount: 30.00, timestamp: "24 Sep" },
    { id: "d", orderNumber: "#1089", status: "completed", items: [{ name: "Carne Molida", qty: "1kg", price: 12.50 }, { name: "Chuletones", qty: "2 ud", price: 30.00 }], estimatedMinutes: 0, totalAmount: 42.50, timestamp: "20 Sep" },
];

/* ——— Favorite Orders ——— */
export const mockFavorites: FavoriteOrder[] = [
    { id: "f1", title: "Asado del Domingo", description: "Chuletones, chorizos criollos y morcilla", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTuG0qYnf0YyU_vYmtzPp9CrtL8HTFPi4v2vLqCOoKewZyVBUTC2iK32d0ppiccaGznmb-oVlOWl23N2vjdVj03jtQubVpae3QcjeXHucPPLfs_icoHBLItqRRjjnsunUueGPxYCbmGsQOYQacH7VoS66G1jInId8cF6QaqQLdSN8q3QafoONh1STXdoxk_z6RoNbgkuMRMKaLRNGpxDCApFNR8IlWAqZXNKhxqHElFBkzRY8FLmGeGDYLlxpcGDCpcdknYXR5Xr4_", items: [{ name: "Chuletón", qty: "2 ud" }, { name: "Chorizo Criollo", qty: "500g" }], totalAmount: 78.50, lastOrdered: "Hace 2 semanas" },
    { id: "f2", title: "Bocadillos de la Semana", description: "Jamón, queso y pavo para toda la semana", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXawr9H-e9s92MynDSs1i_lInopycbnJIdgsrIroUI9Gfr-gwsEtfWy6kIzhOUqPzdF8--VtBVy8Z2VVVWg7ZmV4coXggpaUYdJrkVK-8mXXD6HPMh2Gtil-HzjWTTKiynrO78OB9x0IhXMPRiX3cXCgD5QBRO2YxbIeLQb7rAPhU_wuArjky2n8RkCj6C0_cEufX-esVORHqVIla44EM1BMPzJQl7gEu3JIb6n8H1dPq8r45-lLfrGrGDPgea2ut2vb_5qiDqJk_m", items: [{ name: "Jamón Serrano", qty: "200g" }, { name: "Queso Gouda", qty: "200g" }, { name: "Pechuga Pavo", qty: "300g" }], totalAmount: 22.40, lastOrdered: "Hace 5 días" },
    { id: "f3", title: "Pollo del Miércoles", description: "Pollo rostizado con baguette", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAex6ZUDh4Mv7YUU9gtl3qUpPoFJmgYheh0i7tqr6Sqc7a6s30NSyxSGe62QvmqDetSfVO0lonwUIp4wBhFLmJJPYUPUi8vdNhwjWSxwQI6VPE_npuCZ5AiNddJ7u6VL2GqusR3NA-xslWK54vXROeIixL-jkHcUV7C57CxDMENvYkuETqxbZz4PFiA5cH82KYYAvl57l1AW8Qfk1CE-RqVXlgHqy1Y2BK_jn8uwVULw5KFpSyqESNvs0iDc4F46c4B0GTPo9yr5Eo1", items: [{ name: "Pollo Rostizado", qty: "1 ud" }, { name: "Baguette", qty: "1 ud" }], totalAmount: 19.40, lastOrdered: "Hace 1 semana" },
];

/* ——— Inventory Categories ——— */
export const inventoryCategories = [
    { icon: "grid_view", label: "Todo" },
    { icon: "lunch_dining", label: "Carnes" },
    { icon: "bakery_dining", label: "Charcutería" },
    { icon: "skillet", label: "Preparados" },
];
