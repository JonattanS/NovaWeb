"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import { databaseService } from "@/services/database"
import { schemaService } from "@/services/schemaService"
import { formatCellValue } from "@/utils/formatters"
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

// Código de módulo para esta página
export const mencod = "011810"

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type FiltrosAnexos = {
  suc_cod: string
  anx_cod: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_corte: string
  detallado: boolean
  alfabetico: boolean
}

const ReporteAnexosVencidosEdadesPage = () => {
  const navigate = useNavigate()

  const [filtros, setFiltros] = useState<FiltrosAnexos>({
    suc_cod: "",
    anx_cod: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_corte: new Date().toISOString().split("T")[0],
    detallado: true,
    alfabetico: false,
  })

  const [resultado, setResultado] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [page, setPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const ROWS_PER_PAGE = 100

  useEffect(() => {
    handleSubmit(new Event("submit") as unknown as React.FormEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleChange = (name: keyof FiltrosAnexos) => (checked: boolean) => {
    setFiltros((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setPage(1)

    try {
      // Preparar filtros base
      const filtrosBase: any = {
        suc_cod: filtros.suc_cod || undefined,
        anx_cod: filtros.anx_cod || undefined,
        ter_nit_ini: filtros.ter_nit_ini || undefined,
        ter_nit_fin: filtros.ter_nit_fin || undefined,
        fecha_fin: filtros.fecha_corte || undefined,
      }
      Object.keys(filtrosBase).forEach((k) => {
        if (!filtrosBase[k]) delete filtrosBase[k]
      })

      // 1. Datos principales
      const respHis = await databaseService.consultaDocumentos({ ...filtrosBase, fuente: "con_his" })
      // 2. Saldos
      const respSal = await databaseService.consultaDocumentos({ ...filtrosBase, fuente: "con_sal" })

      // Combinar y guardar
      const datos = combinarDatos(respHis || [], respSal || [])
      setResultado(datos)
    } catch (err: any) {
      setError(err.message || "Error al consultar los datos")
      setResultado([])
    } finally {
      setLoading(false)
    }
  }

  const combinarDatos = (datosHis: any[], datosSal: any[]) => {
    const mapa = new Map<string, any>()
    datosSal.forEach((sal) => {
      const clave = `${sal.suc_cod}_${sal.anx_cod}_${sal.ter_nit}_${sal.clc_cod}_${sal.doc_num}_${sal.doc_fec}`
      const ini = Number(sal.sal_ini) || 0
      const deb = Number(sal.sal_deb) || 0
      const crd = Number(sal.sal_crd) || 0
      mapa.set(clave, {
        valor_inicial: ini,
        debitos: deb,
        creditos: crd,
        saldo: ini + deb + crd,
      })
    })

    const unidos = datosHis.map((his) => {
      const clave = `${his.suc_cod}_${his.anx_cod}_${his.ter_nit}_${his.clc_cod}_${his.doc_num}_${his.doc_fec}`
      const saldos = mapa.get(clave) || { valor_inicial: 0, debitos: 0, creditos: 0, saldo: 0 }
      return { ...his, ...saldos }
    })

    const filtrados = unidos.filter((r) => r.valor_inicial || r.debitos || r.creditos || r.saldo)

    if (filtros.alfabetico) {
      return filtrados.sort((a, b) => (a.ter_raz || "").localeCompare(b.ter_raz || ""))
    }
    return filtrados
  }

  // Columnas fijas según detallado
  const columnas = useMemo(() => {
    return filtros.detallado
      ? ["ter_nit", "ter_raz", "clc_cod", "doc_num", "doc_fec", "mov_det", "valor_inicial", "debitos", "creditos", "saldo"]
      : ["ter_nit", "ter_raz", "saldo", "mov_det"]
  }, [filtros.detallado])

  // Filas ordenadas
  const filasOrdenadas = useMemo(() => {
    if (!filtros.alfabetico) return resultado
    return [...resultado].sort((a, b) => (a.ter_raz || "").localeCompare(b.ter_raz || ""))
  }, [resultado, filtros.alfabetico])

  const getActiveFiltersCount = () => {
    let count = 0
    if (filtros.suc_cod.trim()) count++
    if (filtros.anx_cod.trim()) count++
    if (filtros.ter_nit_ini.trim()) count++
    if (filtros.ter_nit_fin.trim()) count++
    if (filtros.fecha_corte.trim()) count++
    if (filtros.detallado) count++
    if (filtros.alfabetico) count++
    return count
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
              Reporte Anexos Vencidos por Edades
            </h1>
          </div>
          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={filasOrdenadas}
                filename={`reporte_anexos_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Anexos"
                format="csv"
                onProgressChange={(p) => setExportProgress(p)}
                onGeneratingChange={(g) => setIsExporting(g)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={filasOrdenadas}
                filename={`reporte_anexos_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte Anexos"
                format="xlsx"
                onProgressChange={(p) => setExportProgress(p)}
                onGeneratingChange={(g) => setIsExporting(g)}
                getColumnDescription={getColumnDescription}
              />
            </div>
          )}
        </div>

        {/* Filtros */}
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
                  {isFiltersOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6">
                    {/* Generales */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4" />
                        <span>Sucursal / Anexo</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input name="suc_cod" placeholder="Sucursal" value={filtros.suc_cod} onChange={handleChange} className="bg-white" />
                        <Input name="anx_cod" placeholder="Código de Anexo" value={filtros.anx_cod} onChange={handleChange} className="bg-white" />
                      </div>
                    </div>

                    {/* NIT */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Users className="h-4 w-4" />
                        <span>Rango de NIT</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input name="ter_nit_ini" placeholder="NIT Inicial" value={filtros.ter_nit_ini} onChange={handleChange} className="bg-white" />
                        <Input name="ter_nit_fin" placeholder="NIT Final" value={filtros.ter_nit_fin} onChange={handleChange} className="bg-white" />
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha de Corte</span>
                      </div>
                      <Input type="date" name="fecha_corte" value={filtros.fecha_corte} onChange={handleChange} className="bg-white" />
                    </div>

                    {/* Opciones */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <ToggleLeft className="h-4 w-4" />
                        <span>Opciones</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="detallado" checked={filtros.detallado} onCheckedChange={handleToggleChange("detallado")} />
                          <Label htmlFor="detallado" className="text-sm">Detallado</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="alfabetico" checked={filtros.alfabetico} onCheckedChange={handleToggleChange("alfabetico")} />
                          <Label htmlFor="alfabetico" className="text-sm">Orden Alfabético</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Consultando..." : "Consultar Reporte"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Export y Error */}
        {isExporting && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Generando archivo Excel...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                </div>
                <div className="text-xs text-blue-600 text-center">Procesando {filasOrdenadas.length} registros...</div>
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

        {/* Tabla */}
        {filasOrdenadas.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Resultados del Reporte
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {filasOrdenadas.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      {columnas.map((key) => (
                        <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                          {getColumnDescription(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filasOrdenadas
                      .slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
                      .map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                          {columnas.map((key) => (
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
                  totalPages={Math.ceil(filasOrdenadas.length / ROWS_PER_PAGE)}
                  recordsPerPage={ROWS_PER_PAGE}
                  totalRecords={filasOrdenadas.length}
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

export default ReporteAnexosVencidosEdadesPage
