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
import axios from 'axios';

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
  const [deleteLog, setDeleteLog] = useState<MiracleLog | null>(null); // New state for delete confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['miracleLogs'],
    queryFn: async () => {
      const res = await axios.get('/api/user/miracle-log');
      return res.data;
    },
  });

  // Create log
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsSubmitting(true);
      const res = await axios.post('/api/user/miracle-log', { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miracleLogs'] });
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });
      setContent('');
      toast.success('Log created successfully');
    },
    onError: (error: any) => {
      if (error.response?.data?.message.includes("Daily JP limit")) {
        toast.error("You've reached the maximum JP (150) for today!");
      } else if (error.response?.data?.message.includes("Daily limit of 3 logs")) {
        toast.error("You've reached the maximum number of logs for today. Please delete one to add more.");
      } else {
        toast.error(error.response?.data?.message || 'An error occurred');
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
      const res = await axios.put(`/api/user/miracle-log/${id}`, { content });
      return res.data;
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
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Delete log
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/user/miracle-log/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miracleLogs'] });
      toast.success('Log deleted successfully');
      setDeleteLog(null); // Close the dialog on success
    },
    onError: () => {
      toast.error('Failed to delete log');
      setDeleteLog(null); // Close the dialog on error
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

  const handleDeleteConfirm = () => {
    if (deleteLog) {
      deleteMutation.mutate(deleteLog.id);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Miracle Log</CardTitle>
          <CardDescription>
            Record your daily miracles and positive moments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mb-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write down something positive that happened today! It could be anything, big or small."
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
          <span className="ml-2">Loading your miracle logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No miracle logs yet. Start by adding your first entry above!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Miracle Logs</CardTitle>
            <CardDescription>
              View, edit, or delete your miracle logs
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            onClick={() => setDeleteLog(log)} // Changed to open confirmation dialog
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

      {/* View Dialog */}
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
                <p className="whitespace-pre-wrap">{viewLog.content}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteLog} onOpenChange={() => setDeleteLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this miracle log?</p>
            {deleteLog && (
              <p className="mt-2 text-sm text-gray-500 italic">
                "{deleteLog.content.length > 100 
                  ? `${deleteLog.content.slice(0, 100)}...` 
                  : deleteLog.content}"
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteLog(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}