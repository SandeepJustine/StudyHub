'use client';

import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { forwardRef } from 'react';

// ============================================
// Sub-components (exported individually)
// ============================================

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('', className)} {...props}>
      {children}
    </tbody>
  );
}

export const TableRow = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn('border-b border-grey-light last:border-b-0 transition-colors', className)}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn('px-6 py-4 text-left text-sm font-semibold text-grey-dark', className)}
        {...props}
      >
        {children}
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('px-6 py-4 text-sm text-grey-dark', className)}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';

// ============================================
// Table Footer (bonus)
// ============================================

export function TableFooter({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot className={cn('bg-grey-light/50 font-medium', className)} {...props}>
      {children}
    </tfoot>
  );
}

// ============================================
// Table Caption (bonus)
// ============================================

export function TableCaption({ children, className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption className={cn('px-6 py-3 text-sm text-grey-medium', className)} {...props}>
      {children}
    </caption>
  );
}

// ============================================
// Column & Props interfaces
// ============================================

interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

// ============================================
// Main Table component (composed version)
// ============================================

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyMessage = 'No data found',
  sortColumn,
  sortDirection,
  onSort,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-grey-light', className)}>
      <table className="w-full">
        <TableHeader>
          <TableRow className="bg-grey-light/50 hover:bg-grey-light/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.sortable && 'cursor-pointer select-none',
                  column.className
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <span className="text-grey-medium">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : (
                        <ChevronsUpDown size={16} />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-6 py-12 text-center text-grey-medium"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={item.id}
                className={cn(onRowClick && 'cursor-pointer hover:bg-grey-light/30')}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </div>
  );
}

// ============================================
// Skeleton loader
// ============================================

function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-grey-light animate-pulse">
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-grey-light rounded flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Default export for convenience
// ============================================

export default Table;