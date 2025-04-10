'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface MiracleLog {
  id: string;
  content: string;
  createdAt: string;
  formattedDate?: string;
  formattedTime?: string;
  formattedDay?: string;
}

export default function MiracleLogPage() {
  const [content, setContent] = useState('');
  const [editingLog, setEditingLog] = useState<MiracleLog | null>(null);
  const [viewLog, setViewLog] = useState<MiracleLog | null>(null);
  const queryClient = useQueryClient();

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['miracleLogs'],
    queryFn: async () => {
      const res = await fetch('/api/user/miracle-log');
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });

  // Create log
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/user/miracle-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miracleLogs'] });
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });
      setContent('');
      toast.success('Log created successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes("Daily JP limit")) {
        toast.error("You've reached the maximum JP (150) for today!");
      } else if (error.message.includes("Daily limit of 3 logs")) {
        toast.error("You've reached the maximum number of logs for today. Please delete one to add more.");
      } else {
        toast.error(error.message);
      }
    },
  });

  // Update log
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/user/miracle-log/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to update log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miracleLogs'] });
      setEditingLog(null);
      setContent('');
      toast.success('Log updated successfully');
    },
    onError: () => {
      toast.error('Failed to update log');
    },
  });

  // Delete log
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/miracle-log/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miracleLogs'] });
      toast.success('Log deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete log');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, content });
    } else {
      createMutation.mutate(content);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Miracle Log</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write down something positive that happened today! It could be anything, big or small."
          className="mb-4"
          rows={4}
        />
        <Button 
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {editingLog ? 'Update' : 'Save'}
        </Button>
        {editingLog && (
          <Button
            variant="ghost"
            onClick={() => {
              setEditingLog(null);
              setContent('');
            }}
            className="ml-2"
          >
            Cancel
          </Button>
        )}
      </form>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Log</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: MiracleLog) => {
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewLog(log)}
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
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Miracle Log</DialogTitle>
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
                <p>{viewLog.content}</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 