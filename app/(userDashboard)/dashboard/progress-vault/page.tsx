'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressVault {
  id: string;
  content: string;
  createdAt: string;
  formattedDate?: string;
  formattedTime?: string;
  formattedDay?: string;
}

export default function ProgressVaultPage() {
  const [content, setContent] = useState('');
  const [editingLog, setEditingLog] = useState<ProgressVault | null>(null);
  const [viewLog, setViewLog] = useState<ProgressVault | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['ProgressVault'],
    queryFn: async () => {
      const res = await fetch('/api/user/progress-vault');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch logs');
      }
      return res.json();
    },
  });

  // Create log
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsSubmitting(true);
      const res = await fetch('/api/user/progress-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create log');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ProgressVault'] });
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });
      setContent('');
      
      // Check if there's a warning about JP limit
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success('Progress vault entry created successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("Daily JP limit")) {
        toast.error("You've reached the maximum JP (150) for today!");
      } else if (error.message.includes("Daily limit of 3 logs")) {
        toast.error("You've reached the maximum number of logs for today. Please delete one to add more.");
      } else {
        toast.error(error.message || 'Failed to create log');
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Update log
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      setIsSubmitting(true);
      const res = await fetch(`/api/user/progress-vault/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update log');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ProgressVault'] });
      setEditingLog(null);
      setContent('');
      toast.success('Progress vault entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update log');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Delete log
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/progress-vault/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete log');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ProgressVault'] });
      toast.success('Progress vault entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete log');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, content });
    } else {
      createMutation.mutate(content);
    }
  };

  const handleDelete = (id: string) => {
    
      deleteMutation.mutate(id);
    
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1% Progress Vault</CardTitle>
          <CardDescription>
            Record your daily progress and achievements. You can create up to 3 entries per day. Each entry earns you 50 JP points, with a daily limit of 150 JP points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mb-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write down whatever positive thing you did today! Whether it's big or small."
              className="mb-4"
              rows={4}
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLog ? 'Update' : 'Save'}
              </Button>
              {editingLog && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingLog(null);
                    setContent('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your progress entries...</span>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No progress entries yet. Start by adding your first entry above!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress Entries</CardTitle>
            <CardDescription>
              View, edit, or delete your progress entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: ProgressVault) => {
                  // Format date information
                  const date = new Date(log.createdAt);
                  const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  const formattedTime = date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const formattedDay = date.toLocaleDateString('en-US', { weekday: 'long' });
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.content.length > 100
                          ? `${log.content.slice(0, 100)}...`
                          : log.content}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{formattedDay}</span>
                          <span className="text-xs text-gray-500">{formattedDate}</span>
                          <span className="text-xs text-gray-500">{formattedTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewLog(log)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingLog(log);
                              setContent(log.content);
                            }}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Progress Vault Entry</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewLog && (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  {new Date(viewLog.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  {' at '}
                  {new Date(viewLog.createdAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <p className="whitespace-pre-wrap">{viewLog.content}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 