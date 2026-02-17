"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import { ArrowLeft, Search, Filter, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011806'

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  cta_cod: string
  anf_cod: string
  ordenamiento: string
  ter_nit_ini: string
  ter_nit_fin: string
  fecha_corte: string
}

const ReporteAnexosVencidosPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod: "",
    anf_cod: "",
    ordenamiento: "alfabetico",
    ter_nit_ini: "",
    ter_nit_fin: "",
    fecha_corte: new Date().toISOString().split('T')[0],
  })

  const [resultado, setResultado] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const ROWS_PER_PAGE = 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError("")
    setPage(1)

    try {
      const filtrosConsulta = {
        fuente: 'con_sal',
        suc_cod: filtros.suc_cod,
        cta_cod: filtros.cta_cod,
        anf_cod: filtros.anf_cod,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        fecha_corte: filtros.fecha_corte,
      }
      
      const response = await databaseService.consultaDocumentos(filtrosConsulta)
      const datosProcessados = procesarAnexosVencidos(response || [], filtros.fecha_corte, filtros.ordenamiento)
      setResultado(datosProcessados)
    } catch (err: any) {
      console.error("Error en consulta:", err)
      setError(err.message || "Error al consultar los datos")
      setResultado([])
    } finally {
      setLoading(false)
    }
  }

  const procesarAnexosVencidos = (datos: any[], fechaCorte: string, ordenamiento: string) => {
    const fechaCorteDate = new Date(fechaCorte)
    const agrupado: any = {}

    datos.forEach(item => {
      const key = `${item.ter_nit}`
      if (!agrupado[key]) {
        agrupado[key] = {
          ter_nit: item.ter_nit,
          ter_raz: item.ter_raz,
          sin_vencer: 0,
          dias_1_30: 0,
          dias_31_90: 0,
          dias_91_180: 0,
          dias_181_360: 0,
          mas_360: 0,
          total: 0
        }
      }

      const saldo = parseFloat(item.sal_can || 0)
      if (item.anf_vcto) {
        const fechaVcto = new Date(item.anf_vcto)
        const diasDif = Math.floor((fechaCorteDate.getTime() - fechaVcto.getTime()) / (1000 * 60 * 60 * 24))

        if (diasDif < 0) {
          agrupado[key].sin_vencer += saldo
        } else if (diasDif <= 30) {
          agrupado[key].dias_1_30 += saldo
        } else if (diasDif <= 90) {
          agrupado[key].dias_31_90 += saldo
        } else if (diasDif <= 180) {
          agrupado[key].dias_91_180 += saldo
        } else if (diasDif <= 360) {
          agrupado[key].dias_181_360 += saldo
        } else {
          agrupado[key].mas_360 += saldo
        }
      }
      agrupado[key].total += saldo
    })

    const resultado = Object.values(agrupado)
    
    if (ordenamiento === 'alfabetico') {
      resultado.sort((a: any, b: any) => a.ter_raz.localeCompare(b.ter_raz))
    } else {
      resultado.sort((a: any, b: any) => a.ter_nit.localeCompare(b.ter_nit))
    }

    return resultado
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.values(filtros).forEach(value => {
      if (value && value.toString().trim()) count++
    })
    return count
  }

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
              Reporte Anexos Vencidos
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`anexos_vencidos_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Anexos Vencidos"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`anexos_vencidos_${new Date().toISOString().split("T")[0]}`}
                sheetName="Anexos Vencidos"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        name="suc_cod"
                        placeholder="Sucursal"
                        value={filtros.suc_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                      <Input
                        name="cta_cod"
                        placeholder="Cuenta Contable"
                        value={filtros.cta_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                      <Input
                        name="anf_cod"
                        placeholder="Anexo Financiero"
                        value={filtros.anf_cod}
                        onChange={handleChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Select value={filtros.ordenamiento} onValueChange={(value) => setFiltros(prev => ({ ...prev, ordenamiento: value }))}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Ordenamiento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alfabetico">Alfabético</SelectItem>
                            <SelectItem value="numerico">Numérico</SelectItem>
                          </SelectContent>
                        </Select>
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
                  Reporte Anexos Vencidos
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
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">1 - 30 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">31 - 90 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">91 - 180 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">181 - 360 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Más de 360 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">T O T A L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.sin_vencer)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_1_30)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_31_90)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_91_180)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.dias_181_360)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.mas_360)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right font-semibold">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.total)}
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

export default ReporteAnexosVencidosPage
