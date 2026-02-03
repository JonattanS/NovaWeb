"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { formatCellValue } from "@/utils/formatters"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Table,
  Calendar,
  Building,
  FileText,
  ToggleLeft,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011802';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  anx_cod_ini: string
  anx_cod_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_corte: string  
  detallado: boolean
  alfabetico: boolean
}

const ReporteEstadoDeMultiplesAnexosPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    anx_cod_ini: "",
    anx_cod_fin: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_corte: "",
    detallado: true,
    alfabetico: true,
  });

  const [resultado, setResultado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const ROWS_PER_PAGE = 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: string) => (checked: boolean) => {
    setFiltros((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      // Consultar movimientos de anexos
      const filtrosConsulta = {
        fuente: 'anf_con',
        suc_cod: filtros.suc_cod,
        anf_cod_ini: filtros.anx_cod_ini,
        anf_cod_fin: filtros.anx_cod_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
      };
      
      const responseAnf = await databaseService.consultaDocumentos(filtrosConsulta);
      
      // Procesar datos según modo
      let datosProcessados = filtros.detallado 
        ? responseAnf || [] // Detallado: muestra agrupado por tercero y anexo (como viene del backend)
        : procesarResumido(responseAnf || []); // Resumido: agrupa solo por tercero
      
      // Aplicar ordenamiento
      if (filtros.alfabetico) {
        datosProcessados.sort((a, b) => (a.ter_raz || '').localeCompare(b.ter_raz || ''));
      } else {
        datosProcessados.sort((a, b) => (a.ter_nit || '').localeCompare(b.ter_nit || ''));
      }
      
      setResultado(datosProcessados);
    } catch (err: any) {
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };



  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtros.suc_cod.trim()) count++;
    if (filtros.anx_cod_ini.trim()) count++;
    if (filtros.anx_cod_fin.trim()) count++;
    if (filtros.ter_nit_ini.trim()) count++;
    if (filtros.ter_nit_fin.trim()) count++;
    if (filtros.detallado) count++;
    if (filtros.alfabetico) count++;
    return count;
  }

  // Función para procesar datos en modo resumido (agrupar por NIT)
  const procesarResumido = (datos: any[]) => {
    const agrupados = datos.reduce((acc, item) => {
      const key = item.ter_nit;
      
      if (!acc[key]) {
        acc[key] = {
          ter_nit: item.ter_nit,
          ter_raz: item.ter_raz,
          valor_inicial: 0,
          debitos: 0,
          creditos: 0,
          saldo: 0
        };
      }
      
      acc[key].valor_inicial += parseFloat(item.valor_inicial) || 0;
      acc[key].debitos += parseFloat(item.debitos) || 0;
      acc[key].creditos += parseFloat(item.creditos) || 0;
      acc[key].saldo += parseFloat(item.saldo) || 0;
      
      return acc;
    }, {});
    
    return Object.values(agrupados);
  };

  // Columnas dinámicas según modo
  const getColumns = () => {
    if (filtros.detallado) {
      return [
        { key: 'ter_nit', label: 'Nit' },
        { key: 'ter_raz', label: 'Tercero' },
        { key: 'anf_cod', label: 'Anf.' },
        { key: 'doc_num', label: 'Documento' },
        { key: 'valor_inicial', label: 'Valor Inicial' },
        { key: 'debitos', label: 'Débitos' },
        { key: 'creditos', label: 'Créditos' },
        { key: 'saldo', label: 'Saldo' }
      ];
    } else {
      return [
        { key: 'ter_nit', label: 'Nit' },
        { key: 'ter_raz', label: 'Tercero' },
        { key: 'valor_inicial', label: 'Valor Inicial' },
        { key: 'debitos', label: 'Débitos' },
        { key: 'creditos', label: 'Créditos' },
        { key: 'saldo', label: 'Saldo' }
      ];
    }
  };

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
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Reporte Estado de Múltiples Anexos
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`reporte_multiples_anexos_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Múltiples Anexos"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`reporte_multiples_anexos_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Múltiples Anexos"
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
                  <div className="grid gap-6">
                    {/* Información General */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Información General</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          name="suc_cod"
                          placeholder="Sucursal"
                          value={filtros.suc_cod}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Anexos */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Anexos</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="anx_cod_ini"
                          placeholder="Anexo Inicial"
                          value={filtros.anx_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="anx_cod_fin"
                          placeholder="Anexo Final"
                          value={filtros.anx_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>


                    {/* Fecha de Corte */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Fecha de Corte</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          type="date"
                          name="fecha_corte"
                          placeholder="Fecha de Corte"
                          value={filtros.fecha_corte}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    
                    {/* Rango de NITs */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de NITs</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="ter_nit_ini"
                          placeholder="NIT Inicial"
                          value={filtros.ter_nit_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="ter_nit_fin"
                          placeholder="NIT Final"
                          value={filtros.ter_nit_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Opciones */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Opciones</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="detallado"
                            checked={filtros.detallado}
                            onCheckedChange={handleToggleChange('detallado')}
                          />
                          <Label htmlFor="detallado" className="text-sm">
                            Detallado
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="alfabetico"
                            checked={filtros.alfabetico}
                            onCheckedChange={handleToggleChange('alfabetico')}
                          />
                          <Label htmlFor="alfabetico" className="text-sm">
                            Orden Alfabético
                          </Label>
                        </div>
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
                      {loading ? "Consultando..." : "Generar Reporte"}
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
                  Procesando {resultado.length} registros...
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
                  <FileText className="h-5 w-5 mr-2" />
                  Reporte Estado de Múltiples Anexos {filtros.detallado ? '(Detallado)' : '(Resumido)'} - anf_con
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {resultado.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      {getColumns().map((col) => (
                        <th key={col.key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        {getColumns().map((col) => (
                          <td key={col.key} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                            {['valor_inicial', 'debitos', 'creditos', 'saldo'].includes(col.key) ? (
                              <span className="text-right block">
                                {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row[col.key] || 0)}
                              </span>
                            ) : (
                              row[col.key] || ''
                            )}
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
                  totalPages={Math.ceil(resultado.length / ROWS_PER_PAGE)}
                  recordsPerPage={ROWS_PER_PAGE}
                  totalRecords={resultado.length}
                  onPageChange={setPage}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ReporteEstadoDeMultiplesAnexosPage