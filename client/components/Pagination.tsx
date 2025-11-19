"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Smart pagination component that handles many pages gracefully
 * Shows: [Prev] 1 ... 4 5 6 ... 10 [Next]
 */
export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const delta = 1; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    
    // Always show first page
    range.push(1);
    
    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    // Add left ellipsis if needed
    if (start > 2) {
      range.push('...');
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    // Add right ellipsis if needed
    if (end < totalPages - 1) {
      range.push('...');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col items-center gap-3 mt-12 ${className}`}>
      <div className="flex justify-center items-center gap-1 sm:gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="shrink-0 w-10 sm:w-auto sm:min-w-[100px] px-2 sm:px-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1">Previous</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex gap-1 items-center">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 sm:px-3 py-2 text-sm text-gray-500 flex items-center select-none"
                >
                  ...
                </span>
              );
            }

            const page = pageNum as number;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[36px] sm:min-w-[40px] h-9 px-2 sm:px-3"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="shrink-0 w-10 sm:w-auto sm:min-w-[100px] px-2 sm:px-4"
        >
          <span className="hidden sm:inline sm:mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Info */}
      <div className="text-sm text-gray-600 font-medium">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
