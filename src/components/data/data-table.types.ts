import * as React from "react";

export interface ColumnDef<Row> {
  id: string;
  header: string;
  cell: (row: Row) => React.ReactNode;
  sortable?: boolean;
  sortField?: string;
  hideBelow?: "md" | "lg" | "xl";
  align?: "start" | "end" | "center";
  widthPx?: number;
}

export interface DataTablePagination {
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  pageSize: number;
  onPageSize?: (n: number) => void;
  pageIndex?: number;
}

export interface DataTableProps<Row extends { id: string }> {
  columns: ColumnDef<Row>[];
  rows: Row[];
  status: "loading" | "ready" | "error";
  error?: Error | { message: string };
  onRetry?: () => void;
  sort?: { field: string; direction: "asc" | "desc" };
  onSortChange?: (sort: { field: string; direction: "asc" | "desc" }) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowOpen?: (row: Row) => void;
  pagination?: DataTablePagination;
  empty: {
    title: string;
    body?: string;
    action?: React.ReactNode;
  };
  mobileRow?: (row: Row) => React.ReactNode;
  caption: string;
  className?: string;
}
