"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageSkeleton from "../PageSkeleton";
import { DailyBloomFormType } from "@/schema/zodSchema";
import HoverDetails from "./HoverDetails";

interface DailyBloom extends DailyBloomFormType {
  id: string;
}

interface OverdueProps {
  onView: (bloom: DailyBloom) => void;
  onEdit: (bloom: DailyBloom) => void;
  onDelete: (id: string) => void;
  onUpdateCompletion: (bloom: DailyBloom, isCompleted: boolean) => void;
}

// --- START: useMediaQuery Hook ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      window.addEventListener("resize", listener);
      return () => window.removeEventListener("resize", listener);
    }
  }, [matches, query]);

  return matches;
};
// --- END: useMediaQuery Hook ---

export default function Overdue({
  onView,
  onEdit,
  onDelete,
  onUpdateCompletion,
}: OverdueProps) {
  const [hoveredBloomId, setHoveredBloomId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

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
        {isMobile ? (
          // --- MOBILE: Card View ---
          <div className="space-y-4">
            {overdueBlooms.map((bloom: DailyBloom) => (
              <Card key={bloom.id} className="p-4 bg-background/50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-md sm:text-lg max-w-[80%] break-words">
                      {bloom.title}
                    </CardTitle>
                    <Input
                      type="checkbox"
                      checked={bloom.isCompleted}
                      onChange={(e) =>
                        onUpdateCompletion(bloom, e.target.checked)
                      }
                      className="w-5 h-5 rounded-md cursor-pointer flex-shrink-0"
                    />
                  </div>
                  {bloom.description && (
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {bloom.description}
                    </p>
                  )}
                  <div className="flex flex-col space-y-2 text-sm border-t pt-3">
                    {bloom.frequency && (
                      <div className="flex items-center">
                        <Repeat className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>Frequency - {bloom.frequency}</span>
                      </div>
                    )}
                    {bloom.dueDate && (
                      <div className="flex items-center text-destructive font-medium">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>
                          Due:{" "}
                          {new Date(bloom.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <Button
                      className="p-2 h-auto bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-md transition-colors"
                      onClick={() => onView(bloom)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      className="p-2 h-auto bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-md transition-colors"
                      onClick={() => onEdit(bloom)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      className="p-2 h-auto bg-red-100 text-red-800 hover:bg-red-200 rounded-md transition-colors"
                      onClick={() => onDelete(bloom.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // --- DESKTOP: Table View ---
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
                <TableRow key={bloom.id} className="relative">
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
                    <div className="text-md max-w-[300px] break-words">
                      {bloom.title}
                    </div>
                    {hoveredBloomId === bloom.id && (
                      <div className="absolute z-50 top-0 left-full ml-2 h-fit w-80 rounded-lg border bg-background p-4 shadow-xl">
                        <HoverDetails bloom={bloom} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">
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
                      <Pencil className=" w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(bloom.id)}
                    >
                      <Trash2 className=" w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
