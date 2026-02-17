"use client"

import React from "react"
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
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
  Calendar,
  Building,
  CreditCard,
  Users,
  Hash,
  CheckCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011804';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  cta_cod_ini: string
  cta_cod_fin: string
  anf_cod_ini: string
  anf_cod_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_corte: string
}

const ReporteAnalisisAnexosVencidosSemanalPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    anf_cod_ini: "",
    anf_cod_fin: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_corte: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      // Consultar con_his para obtener la reporte vencidos semanal
      const filtrosConsulta = {
        fuente: 'anf_con',
        suc_cod: filtros.suc_cod,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
        anf_cod_ini: filtros.anf_cod_ini,
        anf_cod_fin: filtros.anf_cod_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        fecha_ini: filtros.fecha_corte,
        fecha_fin: filtros.fecha_corte,
      };
      
      
      const response = await databaseService.consultaDocumentos(filtrosConsulta);
      
      // Procesar y filtrar datos relevantes para anexos
      const datosProcessados = procesarReporteAnexosVencidosSemanal(response || []);
      setResultado(datosProcessados);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos de la Reporte Anexos Vencidos Semanal
  const procesarReporteAnexosVencidosSemanal = (datos: any[]) => {
    const datosAnexo = datos.filter(item => item.anx_cod || item.anf_cod);
    const fechaCorte = filtros.fecha_corte ? new Date(filtros.fecha_corte) : new Date();
    
    // Agrupar por NIT
    const agrupado: { [key: string]: any } = {};
    
    datosAnexo.forEach(item => {
      const nit = item.ter_nit || '';
      if (!agrupado[nit]) {
        agrupado[nit] = {
          ter_nit: nit,
          ter_raz: item.ter_raz || '',
          sin_vencer: 0,
          dias_1_5: 0,
          dias_6_7: 0,
          dias_8_14: 0,
          dias_15_21: 0,
          dias_22_30: 0,
          dias_mas_31: 0,
        };
      }
      
      const valor = parseFloat(item.mov_val || 0);
      const fechaVcto = item.anf_vcto ? new Date(item.anf_vcto) : null;
      
      if (fechaVcto) {
        const diasVencidos = Math.floor((fechaCorte.getTime() - fechaVcto.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasVencidos < 0) {
          agrupado[nit].sin_vencer += valor;
        } else if (diasVencidos >= 1 && diasVencidos <= 5) {
          agrupado[nit].dias_1_5 += valor;
        } else if (diasVencidos >= 6 && diasVencidos <= 7) {
          agrupado[nit].dias_6_7 += valor;
        } else if (diasVencidos >= 8 && diasVencidos <= 14) {
          agrupado[nit].dias_8_14 += valor;
        } else if (diasVencidos >= 15 && diasVencidos <= 21) {
          agrupado[nit].dias_15_21 += valor;
        } else if (diasVencidos >= 22 && diasVencidos <= 30) {
          agrupado[nit].dias_22_30 += valor;
        } else if (diasVencidos > 30) {
          agrupado[nit].dias_mas_31 += valor;
        }
      }
    });
    
    // Convertir a array y calcular totales
    const resultado = Object.values(agrupado).map(item => ({
      ...item,
      total_vencido: item.dias_1_5 + item.dias_6_7 + item.dias_8_14 + item.dias_15_21 + item.dias_22_30 + item.dias_mas_31,
      total_general: item.sin_vencer + item.dias_1_5 + item.dias_6_7 + item.dias_8_14 + item.dias_15_21 + item.dias_22_30 + item.dias_mas_31
    }));
    
    resultado.sort((a, b) => a.ter_nit.localeCompare(b.ter_nit));
    return resultado;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.values(filtros).forEach(value => {
      if (value && value.toString().trim()) count++;
    });
    return count;
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
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Reporte Anexos Vencidos Semanal
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`reporte_anexos_vencidos_semanal_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Anexos Vencidos Semanal"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`reporte_anexos_vencidos_semanal_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Anexos Vencidos Semanal"
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
                    {/* Sucursal */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4" />
                        <span>Sucursal</span>
                      </div>
                      <Input
                        name="suc_cod"
                        placeholder="Código de Sucursal"
                        value={filtros.suc_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                    </div>

                    {/* Rango de Cuentas Contables */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4" />
                        <span>Rango de Cuentas Contables</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="cta_cod_ini"
                          placeholder="Cuenta Inicial"
                          value={filtros.cta_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="cta_cod_fin"
                          placeholder="Cuenta Final"
                          value={filtros.cta_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Anexo Financiero */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <FileText className="h-4 w-4" />
                        <span>Rango de Anexos Financieros</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="anf_cod_ini"
                          placeholder="Anexo Financiero Inicial"
                          value={filtros.anf_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="anf_cod_fin"
                          placeholder="Anexo Financiero Final"
                          value={filtros.anf_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de NITs */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Users className="h-4 w-4" />
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

                    {/* Fecha de Corte */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha de Corte</span>
                      </div>
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
                  Reporte Anexos Vencidos Semanal
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
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">NIT</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Razón Social</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Sin Vencer</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">1 - 5 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">6 - 7 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">8 - 14 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">15 - 21 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">22 - 30 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Más de 31 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Total Vencido</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Total General</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={row.ter_nit} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.sin_vencer)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_1_5)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_6_7)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_8_14)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_15_21)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_22_30)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_mas_31)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right font-semibold">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.total_vencido)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right font-semibold">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.total_general)}
                        </td>
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

export default ReporteAnalisisAnexosVencidosSemanalPage