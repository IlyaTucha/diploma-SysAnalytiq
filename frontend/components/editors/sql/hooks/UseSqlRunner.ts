import { useState, useEffect } from 'react';
// @ts-ignore
import initSqlJs from 'sql.js';
import { mockDatasets } from '@/mocks/SqlMock';

export function useSqlRunner() {
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      try {
        setIsLoading(true);
        const SQL = await initSqlJs({
          locateFile: () => `/sql-wasm.wasm`
        });
        const newDb = new SQL.Database();
        
        Object.entries(mockDatasets).forEach(([tableName, data]) => {
          const rows = data as any[];
          if (rows.length === 0) return;

          const firstRow = rows[0];
          const columns = Object.keys(firstRow).map(key => {
            const val = firstRow[key];
            const type = typeof val === 'number' ? 'int' : 'char';
            return `${key} ${type}`;
          }).join(', ');

          newDb.run(`CREATE TABLE ${tableName} (${columns});`);

          const placeholders = Object.keys(firstRow).map(() => '?').join(', ');
          const insertSql = `INSERT INTO ${tableName} VALUES (${placeholders})`;
          
          rows.forEach(row => {
            newDb.run(insertSql, Object.values(row));
          });
        });

        setDb(newDb);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize SQL.js", err);
        setError("Failed to initialize database engine");
        setIsLoading(false);
      }
    };

    initDb();
  }, []);

  const executeQuery = (sql: string) => {
    if (!db) return null;
    
    try {
      setError(null);

      const statements = sql.split(';').filter(s => s.trim().length > 0);
      if (statements.length > 1) {
        throw new Error('Пожалуйста, выделите один запрос для выполнения или оставьте только один запрос в редакторе.');
      }

      const result = db.exec(sql);
      
      if (result.length > 0) {
        const { columns, values } = result[0];
        const formattedResult = values.map((row: any[]) => {
          const obj: any = {};
          columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
          });
          return obj;
        });
        return formattedResult;
      } else {
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка выполнения запроса');
      return null;
    }
  };

  return { db, error, isLoading, executeQuery };
}