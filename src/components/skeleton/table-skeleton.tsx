import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type TableSkeletonProps = {
  row: number;
  columns: number;
  className?: string;
};

export const TableSkeleton = ({ row, columns, className }: TableSkeletonProps) => {
  const safeRows = Math.max(1, row);
  const safeColumns = Math.max(1, columns);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="ml-auto h-10 w-28" />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: safeColumns }).map((_, index) => (
                <TableHead key={`header-${index}`}>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: safeRows }).map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {Array.from({ length: safeColumns }).map((__, cellIndex) => (
                  <TableCell key={`cell-${rowIndex}-${cellIndex}`}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
};
