import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCellValue } from '@/utils/formatters';
import { getColumnDescription } from '@/utils/formatters';
import { DataPagination } from "@/components/DataPagination";

interface ResultsTableProps {
  results: any[];
}

const ROWS_PER_PAGE = 100;

export const ResultsTable = ({ results }: ResultsTableProps) => {
  const [page, setPage] = useState(1);

  if (!results || results.length === 0) return null;

  const totalPages = Math.ceil(results.length / ROWS_PER_PAGE);

  // Calcula el rango de filas que se deben mostrar en la página actual
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, results.length);
  const pageResults = results.slice(startIndex, endIndex);

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Resultados de la Consulta</span>
          <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded">
            {results.length} registros
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
              <tr>
                {Object.keys(results[0]).map((key) => (
                  <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-50">
                    {getColumnDescription(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageResults.map((row, index) => (
                <tr key={startIndex + index} className="hover:bg-blue-50/50 transition-colors">
                  {Object.keys(row).map((col, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {formatCellValue(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="border-t bg-gray-50">
          <DataPagination
            currentPage={page}
            totalPages={totalPages}
            recordsPerPage={ROWS_PER_PAGE}
            totalRecords={results.length}
            onPageChange={setPage}
          />
        </div>
      </CardContent>
    </Card>
  );
};
