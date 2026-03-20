"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchBarProps } from "@/types/client/admin/feature-controls.types";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <Card>
            <CardContent className="p-3 sm:p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search features by name or key..." className="pl-9 bg-muted/50"
                        value={value} onChange={(e) => onChange(e.target.value)} />
                </div>
            </CardContent>
        </Card>
    );
}