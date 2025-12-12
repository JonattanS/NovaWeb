"use client"

import type React from "react"
import { useState, useMemo } from "react"
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
  CreditCard,
  ToggleLeft,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '010312';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  cta_cod_ini: string
  cta_cod_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_ini: string
  fecha_fin: string
  cierre: boolean
}

const ReporteSaldosPorNitPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_ini: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    cierre: false,
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

  const handleToggleChange = (checked: boolean) => {
    setFiltros((prev) => ({ ...prev, cierre: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      // Consultar con_sal para obtener saldos iniciales por NIT (CON_SNIT)
      const filtrosSal = {
        fuente: 'con_sal',
        suc_cod: filtros.suc_cod,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
      };
      
      const responseSal = await databaseService.consultaDocumentos(filtrosSal);
      console.log("Datos con_sal:", responseSal);
      
      // Consultar con_his para obtener movimientos en el rango de fechas
      const filtrosHis = {
        fuente: 'con_his',
        suc_cod: filtros.suc_cod,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        fecha_ini: filtros.fecha_ini,
        fecha_fin: filtros.fecha_fin,
      };
      
      const responseHis = await databaseService.consultaDocumentos(filtrosHis);
      console.log("Datos con_his:", responseHis);
      
      // Procesar datos combinando con_sal y con_his
      const datosProcessados = procesarReporteSaldosPorNit(responseSal || [], responseHis || []);
      console.log("Datos procesados:", datosProcessados);
      setResultado(datosProcessados);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos del reporte de saldos por NIT
  const procesarReporteSaldosPorNit = (datosSal: any[], datosHis: any[]) => {
    console.log("Procesando reporte de saldos por NIT:", { datosSal, datosHis });
    
    const añoInicial = filtros.fecha_ini ? new Date(filtros.fecha_ini).getFullYear() : new Date().getFullYear();
    
    // Agrupar saldos de con_sal por cuenta y NIT (CON_SNIT)
    const saldosAgrupados = datosSal.reduce((acc, item) => {
      console.log("Procesando item con_sal:", item);
      
      // Verificar sal_tip para saldos de con_snit (equivalente a CON_SNIT)
      const salTip = item.sal_tip;
      const esSaldoSnit = salTip === 'snit' || salTip === 'con_snit';
      
      console.log("Filtros sal_tip:", { salTip, esSaldoSnit, cor_ano: item.cor_ano, añoInicial });
      
      if (!esSaldoSnit || item.cor_ano !== añoInicial) {
        console.log("Item filtrado por sal_tip o año");
        return acc;
      }
      
      const key = `${item.cta_cod || 'SIN_CTA'}-${item.ter_nit || 'SIN_NIT'}`;
      if (!acc[key]) {
        acc[key] = {
          cta_cod: item.cta_cod || '',
          cta_nom: item.cta_nom || '',
          ter_nit: item.ter_nit || '',
          ter_raz: item.ter_raz || '',
          saldo_anterior: 0,
          debitos: 0,
          creditos: 0
        };
      }
      
      // Calcular saldo anterior usando saldo_cuenta.p logic
      // Acumular saldo inicial (sal_ini)
      const salIni = parseFloat(item.sal_ini || 0);
      acc[key].saldo_anterior += salIni;
      console.log("Acumulando sal_ini:", { key, salIni, saldoAnterior: acc[key].saldo_anterior });
      
      return acc;
    }, {});
    
    // Procesar movimientos de con_his en el rango de fechas
    datosHis.forEach(item => {
      if (item.clc_cod && item.doc_num > 0 && item.mov_val !== undefined && item.ter_nit) {
        // Filtrar documentos válidos
        if (item.clc_cod === 'SAL') return; // Excluir saldos iniciales
        if (!filtros.cierre && item.clc_cod === 'CIE') return; // Excluir cierre si no está habilitado
        
        const key = `${item.cta_cod || 'SIN_CTA'}-${item.ter_nit}`;
        
        // Crear entrada si no existe
        if (!saldosAgrupados[key]) {
          saldosAgrupados[key] = {
            cta_cod: item.cta_cod || '',
            cta_nom: item.cta_nom || '',
            ter_nit: item.ter_nit,
            ter_raz: item.ter_raz || '',
            saldo_anterior: 0,
            debitos: 0,
            creditos: 0
          };
        }
        
        // Acumular movimientos
        const movVal = parseFloat(item.mov_val || 0);
        if (movVal > 0) {
          saldosAgrupados[key].debitos += movVal;
        } else {
          saldosAgrupados[key].creditos += Math.abs(movVal);
        }
      }
    });
    
    // Convertir a array y calcular saldo final
    const resultado = Object.values(saldosAgrupados).map((grupo: any) => {
      const saldoFinal = grupo.saldo_anterior + grupo.debitos - grupo.creditos;
      return {
        cta_cod: grupo.cta_cod,
        cta_nom: grupo.cta_nom,
        ter_nit: grupo.ter_nit,
        ter_raz: grupo.ter_raz,
        saldo_anterior: grupo.saldo_anterior,
        debitos: grupo.debitos,
        creditos: grupo.creditos,
        saldo_actual: saldoFinal
      };
    }).filter(item => 
      // Solo incluir si hay saldos o movimientos
      item.saldo_anterior !== 0 || item.debitos !== 0 || item.creditos !== 0
    );
    
    // Ordenar por cuenta y NIT
    resultado.sort((a, b) => {
      if (a.cta_cod !== b.cta_cod) return a.cta_cod.localeCompare(b.cta_cod);
      return a.ter_nit.localeCompare(b.ter_nit);
    });
    
    console.log("Resultado procesado:", resultado);
    return resultado;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtros.suc_cod.trim()) count++;
    if (filtros.cta_cod_ini.trim()) count++;
    if (filtros.cta_cod_fin.trim()) count++;
    if (filtros.ter_nit_ini.trim()) count++;
    if (filtros.ter_nit_fin.trim()) count++;
    if (filtros.fecha_ini.trim()) count++;
    if (filtros.fecha_fin.trim()) count++;
    if (filtros.cierre) count++;
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
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              Reporte de Saldos por NIT
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`reporte_saldos_nit_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Saldos por NIT"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`reporte_saldos_nit_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Saldos por NIT"
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
                        <Building className="h-4 w-4" />
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

                    {/* Rango de Cuentas */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4" />
                        <span>Rango de Cuentas</span>
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

                    {/* Rango de Fechas */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>Rango de Fechas</span>
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

                    {/* Toggle Cierre */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <ToggleLeft className="h-4 w-4" />
                        <span>Opciones</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="cierre"
                          checked={filtros.cierre}
                          onCheckedChange={handleToggleChange}
                        />
                        <Label htmlFor="cierre" className="text-sm">
                          Cierre
                        </Label>
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
                  <Users className="h-5 w-5 mr-2" />
                  Reporte de Saldos por NIT
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
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cuenta</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Nombre Cuenta</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">NIT</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Razón Social</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Anterior</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Débitos</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Créditos</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_nom}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_anterior)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.debitos)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.creditos)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_actual)}
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

export default ReporteSaldosPorNitPage