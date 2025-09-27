// components/accountability-hub/AccountabilityHeader.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link"; // Link ko import karein

export default function AccountabilityHeader() {
  return (
    <div className="space-y-4 pt-6 mx-auto">
      <div className="flex w-full items-center justify-between">
        {/* Title aur Description */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Accountability Hub</h1>
          <p className="text-muted-foreground">
            Track and motivate your solopreneur community&apos;s monthly goals.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Create button ko Link banayein */}
          <Link href="/dashboard/accountability-hub/create">
            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition">
              <PlusCircle size={24} />
              <span className="font-semibold hidden sm:inline">Create</span>
            </button>
          </Link>
          <Button className="bg-blue-600 hover:bg-blue-700">Add Member</Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Input
          type="text"
          placeholder="Search members"
          className="w-full"
        />
      </div>
    </div>
  );
}