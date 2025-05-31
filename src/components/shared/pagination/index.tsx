import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
    maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    loading = false,
    maxVisiblePages = 5,
}) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages = [];
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className="flex justify-center">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                >
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {getVisiblePages().map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="w-8 h-8 p-0"
                            disabled={loading}
                        >
                            {page}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loading}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Pagination; 