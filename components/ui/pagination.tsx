import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // ADDED: Guard against invalid totalPages
  // if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    // Always include first and last page
    range.push(1);

    // Calculate range around current page
    for (
      let i = Math.max(2, safeCurrentPage - delta);
      i <= Math.min(totalPages - 1, safeCurrentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Add last page to range
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add dots where needed
    let lastPage = 0;
    for (const page of range) {
      if (lastPage) {
        if (page - lastPage === 2) {
          // If gap is 2, add the middle page
          rangeWithDots.push(lastPage + 1);
        } else if (page - lastPage > 2) {
          // If gap is larger than 2, add dots
          rangeWithDots.push(-1);// -1 represents dots
        }
      }
      rangeWithDots.push(page);
      lastPage = page;
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getVisiblePages().map((pageNum, index) =>
        pageNum === -1 ? (
          // Render dots for skipped pages
          <span key={`dots-${index}`} className="px-2">
            ...
          </span>
        ) : (
          <Button
            key={pageNum}
            variant={safeCurrentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
