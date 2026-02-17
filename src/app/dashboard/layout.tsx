export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="theme-staff dark min-h-screen bg-bg-page text-text-page">
            <main className="flex-1 h-full">{children}</main>
        </div>
    );
}
