"use client";

import { useState } from "react"; // ✅ NEW: Import useState
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Trash2,
  EyeIcon,
  Pencil,
  AlertTriangle,
  Repeat,
  Calendar as CalendarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageSkeleton from "../PageSkeleton";
import { DailyBloomFormType } from "@/schema/zodSchema";
import HoverDetails from "./HoverDetails"; // ✅ NEW: Import HoverDetails component

interface DailyBloom extends DailyBloomFormType {
  id: string;
}

interface OverdueProps {
  onView: (bloom: DailyBloom) => void;
  onEdit: (bloom: DailyBloom) => void;
  onDelete: (id: string) => void;
  onUpdateCompletion: (bloom: DailyBloom, isCompleted: boolean) => void;
}

export default function Overdue({
  onView,
  onEdit,
  onDelete,
  onUpdateCompletion,
}: OverdueProps) {
  // ✅ NEW: State to track the hovered item ID
  const [hoveredBloomId, setHoveredBloomId] = useState<string | null>(null);

  const { data: overdueBlooms, isLoading } = useQuery<DailyBloom[]>({
    queryKey: ["overdueDailyBlooms"],
    queryFn: async () => {
      const res = await axios.get("/api/user/daily-bloom/overdue");
      return res.data.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <PageSkeleton type="leaderboard" />;
  }

  if (!overdueBlooms || overdueBlooms.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 border-destructive/30 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Overdue Blooms</CardTitle>
            <CardDescription className="text-destructive/80">
              These tasks have passed their due date. Let&apos;s get them done!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-visible relative z-0">
        {/* --- ✅ START: UPDATED DESKTOP TABLE --- */}
        <div className="hidden md:block">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px] text-center"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[130px]">Due Date</TableHead>
                <TableHead className="w-[120px]">Frequency</TableHead>
                <TableHead className="w-[140px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueBlooms.map((bloom) => (
                <TableRow key={bloom.id}
                className="relative"
                >
                  <TableCell className="text-center">
                    <Input
                      type="checkbox"
                      checked={bloom.isCompleted}
                      onChange={(e) =>
                        onUpdateCompletion(bloom, e.target.checked)
                      }
                      className="w-4 h-4 rounded-md cursor-pointer"
                    />
                  </TableCell>

                  <TableCell
                   className="font-medium relative"
                    onMouseEnter={() => setHoveredBloomId(bloom.id)}
                    onMouseLeave={() => setHoveredBloomId(null)}
                  >
                    <div className="text-md  max-w-[300px]  break-words">
                      
                      {bloom.title}
                    </div>
                    {hoveredBloomId === bloom.id && (
                      <div className="absolute z-50 top-0 left-full ml-2 h-fit w-80 rounded-lg border bg-background p-4 shadow-xl">
                        <HoverDetails bloom={bloom} />
                      </div>
                    )}
                  </TableCell>

                  <TableCell className=" font-semibold text-destructive">
                    {bloom.dueDate
                      ? new Date(bloom.dueDate).toLocaleDateString("en-IN")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bloom.frequency || "—"}
                  </TableCell>
                  <TableCell className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(bloom)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(bloom)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(bloom.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* --- END: UPDATED DESKTOP TABLE --- */}

        {/* Mobile Card View - Unchanged */}
        <div className="md:hidden space-y-4">
          {overdueBlooms.map((bloom: DailyBloom) => (
            <Card key={bloom.id} className="bg-background/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="break-words text-md">
                    {bloom.title}
                  </CardTitle>
                  <div className="flex flex-col  items-center flex-shrink-0">
                    <Input
                      type="checkbox"
                      checked={bloom.isCompleted}
                      onChange={(e) =>
                        onUpdateCompletion(bloom, e.target.checked)
                      }
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs sm:text-sm">
                {bloom.description && (
                  <p className="text-muted-foreground break-words">
                    {bloom.description}
                  </p>
                )}
                {
                  bloom.frequency && (
                     <div className="flex items-center">
                  <Repeat className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Frequency: {bloom.frequency}</span>
                </div>
                  )
                }
               
                {
                  bloom.dueDate && (
                    <div className="flex items-center text-destructive font-medium">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span>
                        Due:{" "}
                        {new Date(bloom.dueDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  )
                }
                
              </CardContent>

              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(bloom)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(bloom)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(bloom.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
