"use client";
export default function PageHeader() {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feature Control</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage global flags, access rules, and plan limits.</p>
            </div>
        </div>
    );
}