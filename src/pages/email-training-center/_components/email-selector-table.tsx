import { type Table, flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import type { EAEmailRow } from '@/services/emailPerformance/emailPerformance';

type Props = {
  table: Table<EAEmailRow>;
  columnCount: number;
  isLoading: boolean;
  selectedIds: Set<string>;
  onRowClick: (id: string) => void;
};

export function EmailSelectorTable({ table, columnCount, isLoading, selectedIds, onRowClick }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto border-y">
        <UiTable>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-card text-xs uppercase tracking-wider text-muted-foreground">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Loading emails…
                  </span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                  No emails match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`bg-card hover:bg-muted/40 cursor-pointer align-top ${selectedIds.has(row.original.interaction_id) ? 'bg-primary/5' : ''}`}
                  onClick={() => onRowClick(row.original.interaction_id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </UiTable>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
