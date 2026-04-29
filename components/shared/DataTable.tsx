"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Pagination } from "./Pagination";

interface DataTableProps<T> {
  columns: {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  data: T[];
  isLoading?: boolean;
  meta?: {
    totalItems: number;
    totalPage: number;
    currentPage: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  emptyMessage?: string;
  className?: string; // New prop for custom spacing
  showNumber?: boolean; // Menampilkan kolom nomor otomatis
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  meta,
  onPageChange,
  onLimitChange,
  emptyMessage = "Tidak ada data ditemukan",
  className = "space-y-4", // Default shadcn spacing
  showNumber = false,
}: DataTableProps<T>) {
  const totalCols = columns.length + (showNumber ? 1 : 0);
  return (
    <div className={className}>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {showNumber && (
                <TableHead className="w-[50px] text-center whitespace-nowrap">
                  No
                </TableHead>
              )}
              {columns.map((col, index) => (
                <TableHead key={index} className={`${col.className} whitespace-nowrap`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => {
                const rowNo = meta 
                  ? (meta.currentPage - 1) * meta.limit + rowIndex + 1 
                  : rowIndex + 1;
                
                return (
                  <TableRow key={rowIndex}>
                    {showNumber && (
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {rowNo}
                      </TableCell>
                    )}
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex} className={col.className}>
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] || "")
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      {/* Pagination */}
      {meta && (
        <Pagination
          page={meta.currentPage}
          totalPages={meta.totalPage}
          totalItems={meta.totalItems}
          limit={meta.limit}
          onPageChange={(p) => onPageChange?.(p)}
          onLimitChange={(l) => onLimitChange?.(l)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
