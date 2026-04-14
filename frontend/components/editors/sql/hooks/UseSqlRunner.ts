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
        console.error("Ошибка инициализации SQL.js", err);
        setError("Ошибка инициализации движка базы данных");
        setIsLoading(false);
      }
    };

    initDb();
  }, []);

  const translateSqlError = (msg: string): string => {
    // Перевод типичных ошибок sql.js / SQLite на русский
    if (/incomplete input/i.test(msg)) return 'Неполный SQL-запрос. Проверьте синтаксис.';
    if (/near "(.+?)": syntax error/i.test(msg)) {
      const m = msg.match(/near "(.+?)": syntax error/i);
      return `Синтаксическая ошибка рядом с «${m?.[1]}».`;
    }
    if (/no such table: (\S+)/i.test(msg)) {
      const m = msg.match(/no such table: (\S+)/i);
      return `Таблица «${m?.[1]}» не найдена.`;
    }
    if (/no such column: (\S+)/i.test(msg)) {
      const m = msg.match(/no such column: (\S+)/i);
      return `Колонка «${m?.[1]}» не найдена.`;
    }
    if (/ambiguous column name: (\S+)/i.test(msg)) {
      const m = msg.match(/ambiguous column name: (\S+)/i);
      return `Неоднозначное имя колонки «${m?.[1]}». Укажите таблицу.`;
    }
    if (/UNIQUE constraint failed/i.test(msg)) return 'Нарушено ограничение уникальности.';
    if (/NOT NULL constraint failed/i.test(msg)) return 'Нарушено ограничение NOT NULL.';
    if (/FOREIGN KEY constraint failed/i.test(msg)) return 'Нарушено ограничение внешнего ключа.';
    if (/datatype mismatch/i.test(msg)) return 'Несоответствие типов данных.';
    if (/misuse of aggregate/i.test(msg)) return 'Неправильное использование агрегатной функции.';
    if (/SELECTs to the left and right of UNION do not have the same number of result columns/i.test(msg))
      return 'Запросы в UNION имеют разное количество колонок.';
    if (/no tables specified/i.test(msg)) return 'Не указаны таблицы. Добавьте FROM в запрос.';
    if (/no such function: (\S+)/i.test(msg)) {
      const m = msg.match(/no such function: (\S+)/i);
      return `Функция «${m?.[1]}» не найдена.`;
    }
    if (/table (\S+) has no column named (\S+)/i.test(msg)) {
      const m = msg.match(/table (\S+) has no column named (\S+)/i);
      return `В таблице «${m?.[1]}» нет колонки «${m?.[2]}».`;
    }
    if (/(?:1st|2nd|3rd|\dth) ORDER BY term out of range/i.test(msg))
      return 'Номер колонки в ORDER BY выходит за диапазон.';
    if (/too many terms in compound SELECT/i.test(msg)) return 'Слишком много выражений в составном запросе.';
    if (/RIGHT and FULL OUTER JOIN/i.test(msg)) return 'RIGHT и FULL OUTER JOIN не поддерживаются в SQLite.';
    if (/cannot use window functions in/i.test(msg)) return 'Нельзя использовать оконные функции в данном контексте.';
    return msg; // Вернуть как есть, если перевод не найден
  };

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
      setError(translateSqlError(err.message || 'Ошибка выполнения запроса'));
      return null;
    }
  };

  return { db, error, isLoading, executeQuery };
}