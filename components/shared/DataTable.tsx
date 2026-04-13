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
}: DataTableProps<T>) {
  return (
    <div className={className}>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
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
              ))
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
