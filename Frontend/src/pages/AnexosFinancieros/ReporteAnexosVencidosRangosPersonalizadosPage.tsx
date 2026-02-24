"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Building,
  CreditCard,
  Users,
  Hash,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011806';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  cta_cod: string
  anf_cod: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_corte: string
  dias1: string
  dias2: string
  dias3: string
  dias4: string
  dias5: string
  dias6: string
}

const ReporteAnexosVencidosRangosPersonalizadosPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod: "",
    anf_cod: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_corte: "",
    dias1: "",
    dias2: "",
    dias3: "",
    dias4: "",
    dias5: "",
    dias6: "",
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
    
    if (name.startsWith('dias')) {
      const numValue = value.replace(/\D/g, '').slice(0, 3);
      setFiltros((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFiltros((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateDias = (): string | null => {
    const dias = [
      parseInt(filtros.dias1) || 0,
      parseInt(filtros.dias2) || 0,
      parseInt(filtros.dias3) || 0,
      parseInt(filtros.dias4) || 0,
      parseInt(filtros.dias5) || 0,
      parseInt(filtros.dias6) || 0,
    ];
    
    for (let i = 1; i < dias.length; i++) {
      if (dias[i] > 0 && dias[i - 1] > 0 && dias[i] < dias[i - 1]) {
        return `El valor de Días ${i + 1} no puede ser menor que Días ${i}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorValidacion = validateDias();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError("");
    setPage(1);

    try {
      const filtrosConsulta = {
        fuente: 'anf_con',
        suc_cod: filtros.suc_cod,
        cta_cod_ini: filtros.cta_cod,
        cta_cod_fin: filtros.cta_cod,
        anf_cod_ini: filtros.anf_cod,
        anf_cod_fin: filtros.anf_cod,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        fecha_ini: filtros.fecha_corte,
        fecha_fin: filtros.fecha_corte,
      };
      
      const response = await databaseService.consultaDocumentos(filtrosConsulta);
      const datosProcessados = procesarReporteRangosPersonalizados(response || []);
      setResultado(datosProcessados);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  const procesarReporteRangosPersonalizados = (datos: any[]) => {
    const datosAnexo = datos.filter(item => item.anx_cod || item.anf_cod);
    const fechaCorte = filtros.fecha_corte ? new Date(filtros.fecha_corte) : new Date();
    
    const rangos = [
      parseInt(filtros.dias1) || 0,
      parseInt(filtros.dias2) || 0,
      parseInt(filtros.dias3) || 0,
      parseInt(filtros.dias4) || 0,
      parseInt(filtros.dias5) || 0,
      parseInt(filtros.dias6) || 0,
    ].filter(d => d > 0).sort((a, b) => a - b);
    
    const agrupado: { [key: string]: any } = {};
    
    datosAnexo.forEach(item => {
      const nit = item.ter_nit || '';
      if (!agrupado[nit]) {
        agrupado[nit] = {
          ter_nit: nit,
          ter_raz: item.ter_raz || '',
          sin_vencer: 0,
          rango1: 0,
          rango2: 0,
          rango3: 0,
          rango4: 0,
          rango5: 0,
          rango6: 0,
        };
      }
      
      const valor = parseFloat(item.mov_val || 0);
      const fechaVcto = item.anf_vcto ? new Date(item.anf_vcto) : null;
      
      if (fechaVcto) {
        const diasVencidos = Math.floor((fechaCorte.getTime() - fechaVcto.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasVencidos < 0) {
          agrupado[nit].sin_vencer += valor;
        } else {
          let asignado = false;
          for (let i = 0; i < rangos.length; i++) {
            if (diasVencidos <= rangos[i]) {
              agrupado[nit][`rango${i + 1}`] += valor;
              asignado = true;
              break;
            }
          }
          if (!asignado && rangos.length > 0) {
            agrupado[nit][`rango${rangos.length}`] += valor;
          }
        }
      }
    });
    
    const resultado = Object.values(agrupado).map(item => {
      const totalVencido = item.rango1 + item.rango2 + item.rango3 + item.rango4 + item.rango5 + item.rango6;
      return {
        ...item,
        total_vencido: totalVencido,
        total_general: item.sin_vencer + totalVencido
      };
    });
    
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

  const getRangosActivos = () => {
    const rangos = [
      { label: 'Rango 1', dias: parseInt(filtros.dias1) || 0 },
      { label: 'Rango 2', dias: parseInt(filtros.dias2) || 0 },
      { label: 'Rango 3', dias: parseInt(filtros.dias3) || 0 },
      { label: 'Rango 4', dias: parseInt(filtros.dias4) || 0 },
      { label: 'Rango 5', dias: parseInt(filtros.dias5) || 0 },
      { label: 'Rango 6', dias: parseInt(filtros.dias6) || 0 },
    ].filter(r => r.dias > 0);
    
    return rangos.map((r, i, arr) => ({
      ...r,
      rangoTexto: i === 0 ? `1 - ${r.dias} días` : 
                  i === arr.length - 1 ? `${arr[i-1].dias + 1}+ días` :
                  `${arr[i-1].dias + 1} - ${r.dias} días`
    }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Reporte Anexos Vencidos Rangos Personalizados
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`reporte_vencidos_rangos_personalizados_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Rangos Personalizados"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`reporte_vencidos_rangos_personalizados_${new Date().toISOString().split("T")[0]}`}
                sheetName="Rangos Personalizados"
                format="xlsx"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
            </div>
          )}
        </div>

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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4" />
                        <span>Cuenta Contable</span>
                      </div>
                      <Input
                        name="cta_cod"
                        placeholder="Código de Cuenta"
                        value={filtros.cta_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <FileText className="h-4 w-4" />
                        <span>Anexo Financiero</span>
                      </div>
                      <Input
                        name="anf_cod"
                        placeholder="Código de Anexo Financiero"
                        value={filtros.anf_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                    </div>

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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Hash className="h-4 w-4" />
                        <span>Rangos de Días (máximo 3 dígitos por campo)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Input
                          type="text"
                          name="dias1"
                          placeholder="Días 1"
                          value={filtros.dias1}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          name="dias2"
                          placeholder="Días 2"
                          value={filtros.dias2}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          name="dias3"
                          placeholder="Días 3"
                          value={filtros.dias3}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          name="dias4"
                          placeholder="Días 4"
                          value={filtros.dias4}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          name="dias5"
                          placeholder="Días 5"
                          value={filtros.dias5}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          name="dias6"
                          placeholder="Días 6"
                          value={filtros.dias6}
                          onChange={handleChange}
                          className="bg-white"
                          maxLength={3}
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

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600 text-center">{error}</div>
            </CardContent>
          </Card>
        )}

        {resultado.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Reporte Anexos Vencidos Rangos Personalizados
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
                      {getRangosActivos().map((rango, index) => (
                        <th key={index} className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">
                          {rango.rangoTexto}
                        </th>
                      ))}
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
                        {getRangosActivos().map((_, index) => (
                          <td key={index} className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                            {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row[`rango${index + 1}`] || 0)}
                          </td>
                        ))}
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

export default ReporteAnexosVencidosRangosPersonalizadosPage
