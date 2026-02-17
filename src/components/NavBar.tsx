"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    icon: string;
    label: string;
    href: string;
}

interface NavBarProps {
    readonly variant?: "customer" | "staff";
}

const customerItems: NavItem[] = [
    { icon: "home", label: "Inicio", href: "/" },
    { icon: "receipt_long", label: "Pedidos", href: "/orders" },
    { icon: "favorite", label: "Favoritos", href: "/favorites" },
    { icon: "person", label: "Cuenta", href: "#" },
];

const staffItems: NavItem[] = [
    { icon: "list_alt", label: "Pedidos", href: "/dashboard" },
    { icon: "qr_code_scanner", label: "Escanear", href: "/dashboard/scan" },
    { icon: "inventory", label: "Stock", href: "/dashboard/inventory" },
    { icon: "settings", label: "Ajustes", href: "#" },
];

export default function NavBar({ variant = "customer" }: NavBarProps) {
    const pathname = usePathname();
    const items = variant === "staff" ? staffItems : customerItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-surface-light dark:bg-surface-dark border-t border-primary/10 px-6 py-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <ul className="flex justify-between items-center max-w-md mx-auto">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.label}>
                            <Link
                                href={item.href}
                                className={`flex flex-col items-center gap-1 group ${isActive
                                    ? "text-text-main dark:text-primary"
                                    : "text-text-secondary dark:text-gray-400"
                                    }`}
                            >
                                <div
                                    className={`p-1.5 rounded-full transition-colors ${isActive
                                        ? "bg-primary/20"
                                        : "group-hover:bg-primary/10"
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${isActive ? "filled" : ""}`}>
                                        {item.icon}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold group-hover:text-primary">
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
