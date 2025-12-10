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
export const mencod = '010309';

const getColumnDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    cta_cod: 'Cuenta',
    cta_nom: 'Descripcion',
    cto_cod: 'Centro',
    cto_nom: 'Descripcion Centro',
    act_cod: 'Actividad',
    act_nom: 'Descripcion Actividad',
    ter_nit: 'Nit',
    ter_raz: 'Descripcion Nit',
    clc_cod: 'Cl.',
    doc_num: 'Numero',
    doc_fec: 'Fecha',
    mov_det: 'Detalle',
    che_num: 'No. Cheque',
    mov_deb: 'Debitos',
    mov_cre: 'Creditos',
    saldo: 'Saldo'
  };
  return descriptions[key] || key;
}

type Filtros = {
  suc_cod: string
  cta_cod_ini: string
  cta_cod_fin: string
  cto_cod_ini: string
  cto_cod_fin: string
  act_cod_ini: string
  act_cod_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_ini: string
  fecha_fin: string
}

const AuxiliarDeCuentasPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    cto_cod_ini: "",
    cto_cod_fin: "",
    act_cod_ini: "",
    act_cod_fin: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_ini: "",
    fecha_fin: "",
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
    console.log("Enviando filtros:", filtros);
    setLoading(true);
    setError("");
    setPage(1);

    try {
      const movimientosRaw = await databaseService.consultaDocumentos(filtros);
      
      // Ordenar por cuenta y fecha
      const movimientos = movimientosRaw.sort((a: any, b: any) => {
        if (a.cta_cod !== b.cta_cod) {
          return a.cta_cod.localeCompare(b.cta_cod);
        }
        return new Date(a.doc_fec).getTime() - new Date(b.doc_fec).getTime();
      });

      // Procesar movimientos y calcular saldos
      const resultadoProcesado: any[] = [];
      const saldosAcumulados = new Map();
      let cuentaAnterior = '';

      movimientos.forEach((mov: any, index: number) => {
        const cuentaActual = mov.cta_cod;
        
        // Si es una nueva cuenta, verificar si el primer registro es saldo inicial
        if (cuentaActual !== cuentaAnterior) {
          // Buscar si el primer registro de esta cuenta es clc_cod = 'SI'
          const primerRegistroCuenta = movimientos.find((m: any, i: number) => 
            i >= index && m.cta_cod === cuentaActual
          );
          
          let saldoInicial = 0;
          if (primerRegistroCuenta && primerRegistroCuenta.clc_cod === 'SI') {
            saldoInicial = parseFloat(primerRegistroCuenta.mov_val) || 0;
          }
          
          saldosAcumulados.set(cuentaActual, saldoInicial);
          cuentaAnterior = cuentaActual;
        }

        // Procesar movimiento actual
        const movVal = parseFloat(mov.mov_val) || 0;
        
        // Si es el primer registro y es saldo inicial (SI), usar ese valor como base
        let saldoActual;
        if (mov.clc_cod === 'SI' && saldosAcumulados.get(cuentaActual) === movVal) {
          saldoActual = movVal;
        } else {
          saldoActual = saldosAcumulados.get(cuentaActual) + movVal;
        }
        
        saldosAcumulados.set(cuentaActual, saldoActual);

        resultadoProcesado.push({
          cta_cod: mov.cta_cod || '',
          cta_nom: mov.cta_nom || '',
          cto_cod: mov.cto_cod || '',
          cto_nom: '',
          act_cod: mov.act_cod || '',
          act_nom: '',
          ter_nit: mov.ter_nit || '',
          ter_raz: mov.ter_raz || '',
          clc_cod: mov.clc_cod || '',
          doc_num: mov.doc_num || '',
          doc_fec: mov.doc_fec || '',
          mov_det: mov.mov_det || '',
          che_num: mov.che_num || '',
          mov_deb: movVal > 0 ? movVal : 0,
          mov_cre: movVal < 0 ? Math.abs(movVal) : 0,
          saldo: saldoActual
        });
      });

      setResultado(resultadoProcesado);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Campos específicos para auxiliar de cuentas en el orden requerido
  const camposAuxiliar = [
    "cta_cod",      // Cuenta
    "cta_nom",      // Descripcion
    "cto_cod",      // Centro
    "cto_nom",      // Descripcion Centro
    "act_cod",      // Actividad
    "act_nom",      // Descripcion Actividad
    "ter_nit",      // Nit
    "ter_raz",      // Descripcion Nit
    "clc_cod",      // Cl.
    "doc_num",      // Numero
    "doc_fec",      // Fecha
    "mov_det",      // Detalle
    "che_num",      // No. Cheque
    "mov_deb",      // Debitos
    "mov_cre",      // Creditos
    "saldo"         // Saldo
  ]
  // Filtrar solo los campos necesarios para auxiliar
  const resultadoFiltrado = resultado.map((row) => {
    const filteredRow: any = {};
    camposAuxiliar.forEach((campo) => {
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
              Auxiliar de Cuentas
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultadoFiltrado}
                filename={`auxiliar_cuentasCVS_${new Date().toISOString().split("T")[0]}`}
                sheetName="Auxiliar de Cuentas"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultadoFiltrado}
                filename={`auxiliar_cuentas_${new Date().toISOString().split("T")[0]}`}
                sheetName="Auxiliar de Cuentas"
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
                    {/* Información General */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4" />
                        <span>Información General</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                          name="suc_cod"
                          placeholder="Código Sucursal"
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

                    {/* Rango de Centros */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Target className="h-4 w-4" />
                        <span>Rango de Centros</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="cto_cod_ini"
                          placeholder="Centro Inicial"
                          value={filtros.cto_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="cto_cod_fin"
                          placeholder="Centro Final"
                          value={filtros.cto_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Actividades */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Hash className="h-4 w-4" />
                        <span>Rango de Actividades</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="act_cod_ini"
                          placeholder="Actividad Inicial"
                          value={filtros.act_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="act_cod_fin"
                          placeholder="Actividad Final"
                          value={filtros.act_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Terceros */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <User className="h-4 w-4" />
                        <span>Rango de Terceros (NIT)</span>
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
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Consultando..." : "Consultar Auxiliar"}
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
                  Resultados del Auxiliar
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
                      {camposAuxiliar.map((key) => (
                        <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                          {getColumnDescription(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultadoFiltrado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        {camposAuxiliar.map((key) => (
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
  )
}

export default AuxiliarDeCuentasPage