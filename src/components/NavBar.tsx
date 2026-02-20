"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

const customerNav: NavItem[] = [
    { label: "Inicio", href: "/", icon: "home" },
    { label: "Pedidos", href: "/orders", icon: "receipt_long" },
    { label: "Favoritos", href: "/favorites", icon: "favorite" },
    { label: "Cuenta", href: "/account", icon: "person" },
];

const staffNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Inventario", href: "/dashboard/inventory", icon: "inventory_2" },
    { label: "Escanear", href: "/dashboard/scan", icon: "qr_code_scanner" },
    { label: "Ajustes", href: "/dashboard/settings", icon: "settings" },
];

export default function NavBar({ variant = "customer" }: { variant?: "customer" | "staff" }) {
    const pathname = usePathname();
    const items = variant === "staff" ? staffNav : customerNav;

    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-40 safe-area-bottom ${variant === "staff"
            ? "bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
            : "glass dark:glass-dark"
            }`}>
            <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
                {items.map((item) => {
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 transition-all"
                        >
                            <div
                                className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all ${isActive
                                    ? variant === "staff"
                                        ? "bg-primary/10 scale-110"
                                        : "bg-primary/15 scale-110"
                                    : variant === "staff"
                                        ? "hover:bg-gray-100"
                                        : "hover:bg-white/5"
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-[22px] transition-colors ${isActive
                                        ? "text-primary filled"
                                        : variant === "staff"
                                            ? "text-gray-400"
                                            : "text-gray-400"
                                        }`}
                                >
                                    {item.icon}
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-bold transition-colors ${isActive
                                    ? "text-primary"
                                    : variant === "staff"
                                        ? "text-gray-400"
                                        : "text-gray-400"
                                    }`}
                            >
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
