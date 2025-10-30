// components/accountability/AddMemberModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useSWRConfig } from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type UserSearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

interface AddMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMemberModal({
  groupId,
  isOpen,
  onOpenChange,
}: AddMemberModalProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null); // Store ID of user being added

  // Debounced search effect
  useEffect(() => {
    // Don't search on empty query
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/search?query=${query}&groupId=${groupId}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data);
      } catch (error) {
        toast({
          title: (error as Error).message || "Error searching users.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(handler);
  }, [query, groupId, toast]);

  const handleAddMember = async (userId: string) => {
    setIsAdding(userId);
    try {
      const response = await fetch(
        `/api/accountability-hub/groups/${groupId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIdToAdd: userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member.");
      }

      toast({ title: "Member added successfully!" });
      // Refresh the main members list data
      mutate(`/api/accountability-hub/groups/${groupId}/view`);
      onOpenChange(false); // Close the modal on success
      setQuery(""); // Reset search
      setResults([]);
    } catch (error) {
      toast({ title: (error as Error).message, variant: "destructive" });
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Search for an existing user on the platform to add to this group.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {isSearching && <UserSkeleton />}
          {!isSearching && results.length === 0 && query.length > 1 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No users found.
            </p>
          )}
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.image
                      ? user.image
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name?.charAt(0) || "User")}&background=random&color=fff`
                  }
                  alt={user?.name || "User"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleAddMember(user.id)}
                disabled={isAdding === user.id}
              >
                {isAdding === user.id ? "Adding..." : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const UserSkeleton = () => (
  <div className="flex items-center justify-between p-2">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-8 w-16" />
  </div>
);
