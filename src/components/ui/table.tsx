'use client';

import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { forwardRef } from 'react';
import { Card, CardContent } from './card';

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
        className={cn('px-4 py-3 text-left text-sm font-semibold text-grey-dark', className)}
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
        className={cn('px-4 py-3 text-sm text-grey-dark', className)}
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
  hideOnMobile?: boolean;
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
  renderMobileCard?: (item: T) => React.ReactNode;
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
  renderMobileCard,
}: TableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  return (
    <div className={cn('rounded-xl border border-grey-light', className)}>
      {/* Mobile Card View. Always rendered so data is never invisible on phones:
          callers may supply renderMobileCard, otherwise the columns are laid out
          as label/value pairs automatically. */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="text-center py-12 px-4 text-grey-medium text-sm">{emptyMessage}</div>
        ) : (
          <div className="space-y-3 p-3">
            {data.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'border-0 shadow-sm',
                  onRowClick && 'cursor-pointer active:opacity-70'
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                <CardContent className="p-4">
                  {renderMobileCard ? (
                    renderMobileCard(item)
                  ) : (
                    <DefaultMobileCard item={item} columns={columns} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                    <TableCell key={column.key} className={cn(column.className, column.hideOnMobile && 'hidden md:table-cell')}>
                      {column.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Default mobile card (auto-generated)
// ============================================

/**
 * Renders a row as a stacked card when the caller supplies no renderMobileCard.
 * The first visible column becomes the card heading (it usually holds the
 * identity cell); the rest are label-above-value rows. Labels sit above rather
 * than beside the value so action columns full of buttons get the entire card
 * width instead of being squeezed beside a label.
 */
function DefaultMobileCard<T>({ item, columns }: { item: T; columns: Column<T>[] }) {
  const visible = columns.filter((column) => !column.hideOnMobile);
  const [primary, ...rest] = visible;

  return (
    <div className="space-y-3">
      {primary && (
        <div className="pb-2 border-b border-grey-light font-medium text-navy text-sm break-words">
          {primary.accessor(item)}
        </div>
      )}
      <dl className="space-y-2.5">
        {rest.map((column) => (
          <div key={column.key} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-grey-medium mb-1">
              {column.header}
            </dt>
            <dd className="text-sm text-grey-dark break-words">{column.accessor(item)}</dd>
          </div>
        ))}
      </dl>
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