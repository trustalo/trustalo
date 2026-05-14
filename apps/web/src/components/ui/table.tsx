import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className = "", ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table ref={ref} className={`w-full text-left text-sm ${className}`} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <thead
      ref={ref}
      className={`border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <tbody
      ref={ref}
      className={`divide-y divide-neutral-200 dark:divide-neutral-800 ${className}`}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = "", ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${className}`}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHeader = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <th
      ref={ref}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ${className}`}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <td
      ref={ref}
      className={`px-4 py-3 text-neutral-700 dark:text-neutral-300 ${className}`}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell };
