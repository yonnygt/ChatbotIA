"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, fetchUser } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            await fetchUser();
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (!loading && !isChecking) {
            if (!user || user.role === "cliente") {
                router.replace("/");
            }
        }
    }, [user, loading, isChecking, router]);

    if ((loading && isChecking) || (!user && (loading || isChecking)) || (user && user.role === "cliente")) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-[#f3f6f4]">
                <span className="material-symbols-outlined text-primary/50 text-[48px] animate-spin">
                    progress_activity
                </span>
            </div>
        );
    }

    return (
        <div className="theme-staff bg-[#f3f6f4] min-h-dvh">
            <main>{children}</main>
        </div>
    );
}
