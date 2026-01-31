import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle } from 'lucide-react';

interface SqlResultsTableProps {
  results: any[] | null;
}

export function SqlResultsTable({ results }: SqlResultsTableProps) {
  if (!results) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="bg-muted/30 p-4 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 opacity-50" />
        </div>
        <p>Выполните запрос, чтобы увидеть результаты</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Запрос выполнен успешно, но не вернул данных.
      </div>
    );
  }

  const columns = Object.keys(results[0]);

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="font-bold text-xs uppercase whitespace-nowrap">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((row, i) => (
            <TableRow key={i} className="hover:bg-muted/50">
              {columns.map((col) => (
                <TableCell key={`${i}-${col}`} className="font-mono text-xs whitespace-nowrap">
                  {row[col] === null ? (
                    <span className="text-muted-foreground italic">NULL</span>
                  ) : (
                    String(row[col])
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}