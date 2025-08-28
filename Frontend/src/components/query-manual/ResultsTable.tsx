import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCellValue } from '@/utils/formatters';
import { getColumnDescription } from '@/utils/formatters';

interface ResultsTableProps {
  results: any[];
}

const ROWS_PER_PAGE = 100;

export const ResultsTable = ({ results }: ResultsTableProps) => {
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');

  if (!results || results.length === 0) return null;

  const totalPages = Math.ceil(results.length / ROWS_PER_PAGE);

  // Calcula el rango de filas que se deben mostrar en la página actual
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, results.length);
  const pageResults = results.slice(startIndex, endIndex);

  // Controla el input de página
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/[^0-9]/g, ''));
  };

  // Al presionar Enter o perder el foco, navega a la página indicada
  const goToInputPage = () => {
    let newPage = parseInt(inputPage, 10);
    if (isNaN(newPage) || newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    setPage(newPage);
    setInputPage(newPage.toString());
  };

  // Navegación con botones
  const goToPrev = () => {
    if (page > 1) {
      setPage(page - 1);
      setInputPage((page - 1).toString());
    }
  };

  const goToNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
      setInputPage((page + 1).toString());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Resultados ({results.length} registros)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                {Object.keys(results[0]).map((key) => (
                  <th key={key} className="border border-gray-300 px-4 py-2 text-left font-medium">
                    {getColumnDescription(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageResults.map((row, index) => (
                <tr key={startIndex + index} className="hover:bg-gray-50">
                  {Object.keys(row).map((col, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                      {formatCellValue(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToPrev} disabled={page === 1}>
            Anterior
          </Button>
          <span>
            Página{' '}
            <Input
              value={inputPage}
              onChange={handleInputChange}
              onBlur={goToInputPage}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goToInputPage();
              }}
              className="w-16 inline-block text-center"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
            />{' '}
            de {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={goToNext} disabled={page === totalPages}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
