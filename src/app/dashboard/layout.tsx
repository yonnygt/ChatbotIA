export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="theme-staff dark bg-background-dark min-h-dvh">
            <main>{children}</main>
        </div>
    );
}
