import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const DataTable = <T,>({
  columns,
  data,
  rowKey,
  tableClassName,      // Clases para la tabla
  headerClassName,     // Clases para la cabecera
  headerRowClassName,  // Clases para las filas de la cabecera
  headerCellClassName, // Clases para las celdas de la cabecera
  bodyRowClassName,    // Clases para las filas del cuerpo
  bodyCellClassName,   // Clases para las celdas del cuerpo
}: DataTableProps<T>) => {
  return (
    <Table className={cn('custom-scrollbar', tableClassName)}>
      {/* Cabezeras de la tabla */}
      <TableHeader className={headerClassName}>
        <TableRow className={cn('hover:bg-transparent!', headerRowClassName)}>
          {columns.map((column, i) => (
            <TableHead
              key={i}
              className={cn(
                'bg-dark-400 text-purple-100 py-4 first:pl-5 last:pr-5',
                headerCellClassName,
                column.headClassName,
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      {/* Cuerpo de la tabla */}
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow
            key={rowKey(row, rowIndex)}
            className={cn(
              'overflow-hidden rounded-lg border-b border-purple-100/5 hover:bg-dark-400/30! relative',
              bodyRowClassName,
            )}
          >
            {columns.map((column, columnIndex) => (
              <TableCell
                key={columnIndex}
                className={cn('py-4 first:pl-5 last:pr-5', bodyCellClassName, column.cellClassName)}
              >
                {column.cell(row, rowIndex)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DataTable;