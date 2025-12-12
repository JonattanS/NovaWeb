"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { formatCellValue } from "@/utils/formatters"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Table,
  Calendar,
  Building,
  Hash,
  User,
  CreditCard,
  Target,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

// Definición estática del código de módulo
export const mencod = '010609';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find(c => c.name === key);
  return col?.description || key;
};

type Filtros = {
  suc_cod_ini: string;
  suc_cod_fin: string;
  cmp_cod_ini: string;
  cmp_cod_fin: string;
  fecha_ini: string;
  fecha_fin: string;
};

const LibroMayorBalancesPorSucursalPage = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod_ini: '',
    suc_cod_fin: '',
    cmp_cod_ini: '',
    cmp_cod_fin: '',
    fecha_ini: '',
    fecha_fin: '',
  });

  const [resultado, setResultado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const ROWS_PER_PAGE = 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando filtros:", filtros); // DEBUG
    setLoading(true);
    setError(undefined);
    setPage(1);

    try {
      const response = await databaseService.consultaDocumentos(filtros);
      console.log("Respuesta del servidor:", response); // DEBUG
      setResultado(response);
    } catch (err: any) {
      console.error("Error en consulta:", err); // DEBUG
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Campos específicos para libro mayor y balances por sucursal
  const camposLibroMayor = ['cta_cod', 'cta_nom', 'cmp_cod', 'cmp_nom', 'doc_tot_deb', 'doc_tot_crd'];
  
  // Filtrar solo los campos necesarios para libro mayor
  const resultadoFiltrado = resultado.map(row => {
    const filteredRow: any = {};
    camposLibroMayor.forEach(campo => {
      if (row[campo] !== undefined) {
        filteredRow[campo] = row[campo];
      }
    });
    return filteredRow;
  });

  const getActiveFiltersCount = () => {
    return Object.values(filtros).filter((value) => value.trim() !== "").length
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Table className="h-6 w-6 mr-2 text-blue-600" />
              Libro Mayor y Balances por Sucursal
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultadoFiltrado}
                filename={`Libro Mayor y Balances por SucursalCVS_${new Date().toISOString().split("T")[0]}`}
                sheetName="Libro Mayor y Balances por Sucursal"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultadoFiltrado}
                filename={`Libro Mayor y Balances por Sucursal_${new Date().toISOString().split("T")[0]}`}
                sheetName="Libro Mayor y Balances por Sucursal"
                format="xlsx"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
            </div>
          )}
        </div>

        {/* Filtros Colapsables */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getActiveFiltersCount()} activos
                      </Badge>
                    )}
                  </div>
                  {isFiltersOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Filtros organizados por categorías */}
                  <div className="grid gap-6">
                    {/* Rango de Sucursales */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Sucursales</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="suc_cod_ini"
                          placeholder="Sucursal Inicial"
                          value={filtros.suc_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="suc_cod_fin"
                          placeholder="Sucursal Final"
                          value={filtros.suc_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Comprobantes */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Comprobantes</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="cmp_cod_ini"
                          placeholder="Comprobante Inicial"
                          value={filtros.cmp_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="cmp_cod_fin"
                          placeholder="Comprobante Final"
                          value={filtros.cmp_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Fechas */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Fechas de Comprobante</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type="date"
                          name="fecha_ini"
                          placeholder="Fecha Inicial"
                          value={filtros.fecha_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          type="date"
                          name="fecha_fin"
                          placeholder="Fecha Final"
                          value={filtros.fecha_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Consultando..." : "Consultar Libro Mayor"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {isExporting && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Generando archivo Excel...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 text-center">
                  Procesando {resultadoFiltrado.length} registros...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600 text-center">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {resultado.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Resultados del Libro Mayor
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {resultadoFiltrado.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      {Object.keys(resultadoFiltrado[0] || {}).map((key) => (
                        <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                          {getColumnDescription(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultadoFiltrado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        {Object.keys(row).map((key) => (
                          <td key={key} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                            {formatCellValue(key, row[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t bg-gray-50">
                <DataPagination
                  currentPage={page}
                  totalPages={Math.ceil(resultadoFiltrado.length / ROWS_PER_PAGE)}
                  recordsPerPage={ROWS_PER_PAGE}
                  totalRecords={resultadoFiltrado.length}
                  onPageChange={setPage}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LibroMayorBalancesPorSucursalPage;