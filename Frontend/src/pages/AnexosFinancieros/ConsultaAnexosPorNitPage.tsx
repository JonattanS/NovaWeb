"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import { ArrowLeft, Search, Filter, ChevronDown, ChevronUp, ChevronRight, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011805'

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod_ini: string
  suc_cod_fin: string
  doc_fec_ini: string
  doc_fec_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  cta_cod_ini: string
  cta_cod_fin: string
  anf_cod_ini: string
  anf_cod_fin: string
  clc_cod: string
  doc_num_ini: string
  doc_num_fin: string
}

const ConsultaAnexosPorNitPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod_ini: "",
    suc_cod_fin: "",
    doc_fec_ini: new Date().toISOString().split('T')[0],
    doc_fec_fin: new Date().toISOString().split('T')[0],
    ter_nit_ini: "",
    ter_nit_fin: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    anf_cod_ini: "",
    anf_cod_fin: "",
    clc_cod: "",
    doc_num_ini: "",
    doc_num_fin: "",
  })

  const [resultado, setResultado] = useState<any[]>([])
  const [vencimientosMap, setVencimientosMap] = useState<{[key: string]: any[]}>({})
  const [movimientosMap, setMovimientosMap] = useState<{[key: string]: any[]}>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
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
        fuente: 'anf_con',
        suc_cod_ini: filtros.suc_cod_ini,
        suc_cod_fin: filtros.suc_cod_fin,
        doc_fec_ini: filtros.doc_fec_ini,
        doc_fec_fin: filtros.doc_fec_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
        anf_cod_ini: filtros.anf_cod_ini,
        anf_cod_fin: filtros.anf_cod_fin,
        clc_cod: filtros.clc_cod,
        doc_num_ini: filtros.doc_num_ini,
        doc_num_fin: filtros.doc_num_fin,
      }
      
      const response = await databaseService.consultaDocumentos(filtrosConsulta)
      setResultado(response || [])
    } catch (err: any) {
      console.error("Error en consulta:", err)
      setError(err.message || "Error al consultar los datos")
      setResultado([])
    } finally {
      setLoading(false)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.values(filtros).forEach(value => {
      if (value && value.toString().trim()) count++
    })
    return count
  }

  const handleRowClick = async (row: any, index: number) => {
    const key = `${row.suc_cod}-${row.ter_nit}-${row.cta_cod}-${row.anf_cod}-${index}`
    const newExpanded = new Set(expandedRows)
    
    if (expandedRows.has(key)) {
      newExpanded.delete(key)
      setExpandedRows(newExpanded)
    } else {
      newExpanded.add(key)
      setExpandedRows(newExpanded)
      
      if (!vencimientosMap[key]) {
        try {
          const filtrosVctos = {
            fuente: 'con_sal',
            sal_tip: 'conVctos',
            suc_cod: row.suc_cod,
            ter_nit: row.ter_nit,
            cta_cod: row.cta_cod
          }
          const responseVctos = await databaseService.consultaDocumentos(filtrosVctos)
          setVencimientosMap(prev => ({ ...prev, [key]: responseVctos || [] }))
        } catch (err: any) {
          console.error("Error cargando vencimientos:", err)
        }
      }
      
      if (!movimientosMap[key]) {
        try {
          // Obtener saldo inicial (con_sal con sal_tip = conAnf)
          const filtrosSaldoIni = {
            fuente: 'con_sal',
            sal_tip: 'conAnf',
            suc_cod: row.suc_cod,
            ter_nit: row.ter_nit,
            cta_cod: row.cta_cod
          }
          const responseSaldoIni = await databaseService.consultaDocumentos(filtrosSaldoIni)
          
          // Obtener movimientos del período
          const filtrosMov = {
            fuente: 'anf_con2',
            suc_cod: row.suc_cod,
            ter_nit: row.ter_nit,
            cta_cod: row.cta_cod,
            anf_cod: row.anf_cod,
            doc_fec_ini: filtros.doc_fec_ini,
            doc_fec_fin: filtros.doc_fec_fin
          }
          const responseMov = await databaseService.consultaDocumentos(filtrosMov)
          
          // Procesar movimientos por mes
          const movPorMes = procesarMovimientosPorMes(responseMov || [], responseSaldoIni?.[0] || {})
          setMovimientosMap(prev => ({ ...prev, [key]: movPorMes }))
        } catch (err: any) {
          console.error("Error cargando movimientos:", err)
        }
      }
    }
  }

  const procesarMovimientosPorMes = (movimientos: any[], saldoInicial: any) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const resultado: any[] = []
    
    // Fila inicial desde con_sal - usar sal_can
    const salCan = parseFloat(saldoInicial.sal_can || 0)
    const salCanExt = parseFloat(saldoInicial.sal_can_ext || 0)
    
    const filaInicial = {
      mes: 'Inicial',
      debito: salCan >= 0 ? salCan : 0,
      credito: salCan < 0 ? salCan : 0,
      debito_ext: salCanExt >= 0 ? salCanExt : 0,
      credito_ext: salCanExt < 0 ? salCanExt : 0
    }
    resultado.push(filaInicial)
    
    // Agrupar por mes
    const movPorMes: any = {}
    movimientos.forEach(mov => {
      if (mov.doc_fec) {
        const fecha = new Date(mov.doc_fec)
        const mes = fecha.getMonth()
        if (!movPorMes[mes]) {
          movPorMes[mes] = { debito: 0, credito: 0, debito_ext: 0, credito_ext: 0 }
        }
        const valor = parseFloat(mov.mov_val || 0)
        const valorExt = parseFloat(mov.mov_val_ext || 0)
        if (valor > 0) {
          movPorMes[mes].debito += valor
          movPorMes[mes].debito_ext += valorExt
        } else {
          movPorMes[mes].credito += Math.abs(valor)
          movPorMes[mes].credito_ext += Math.abs(valorExt)
        }
      }
    })
    
    // Agregar filas de meses y calcular totales incluyendo inicial
    let totalDebito = filaInicial.debito
    let totalCredito = filaInicial.credito
    let totalDebitoExt = filaInicial.debito_ext
    let totalCreditoExt = filaInicial.credito_ext
    
    meses.forEach((nombreMes, idx) => {
      const datos = movPorMes[idx] || { debito: 0, credito: 0, debito_ext: 0, credito_ext: 0 }
      resultado.push({
        mes: nombreMes,
        debito: datos.debito,
        credito: datos.credito,
        debito_ext: datos.debito_ext,
        credito_ext: datos.credito_ext
      })
      totalDebito += datos.debito
      totalCredito += datos.credito
      totalDebitoExt += datos.debito_ext
      totalCreditoExt += datos.credito_ext
    })
    
    // Fila de totales (suma de todas las columnas incluyendo inicial)
    resultado.push({
      mes: 'Totales',
      debito: totalDebito,
      credito: totalCredito,
      debito_ext: totalDebitoExt,
      credito_ext: totalCreditoExt
    })
    
    return resultado
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
              Consulta Anexos Por NIT
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`consulta_anexos_nit_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Anexos Por NIT"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`consulta_anexos_nit_${new Date().toISOString().split("T")[0]}`}
                sheetName="Anexos Por NIT"
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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Fechas</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type="date"
                          name="doc_fec_ini"
                          placeholder="Fecha Inicial"
                          value={filtros.doc_fec_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          type="date"
                          name="doc_fec_fin"
                          placeholder="Fecha Final"
                          value={filtros.doc_fec_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Anexos Financieros</span>
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

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Clase y Documentos</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          name="clc_cod"
                          placeholder="Clase"
                          value={filtros.clc_cod}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="doc_num_ini"
                          placeholder="Documento Inicial"
                          value={filtros.doc_num_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="doc_num_fin"
                          placeholder="Documento Final"
                          value={filtros.doc_num_fin}
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
                  Consulta Anexos Por NIT
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
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap w-10"></th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Suc-Cod</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Ter-Raz</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Anterior</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Débitos</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Créditos</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Final</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Actual</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Débitos-Ext</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Créditos-Ext</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo-Final-Ext</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo-Actual-Ext</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Ter-Nit</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cta-Cod</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cta-Nom</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Anf-Cod</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Est-Cod</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => {
                      const key = `${row.suc_cod}-${row.ter_nit}-${row.cta_cod}-${row.anf_cod}-${i}`
                      const isExpanded = expandedRows.has(key)
                      const vencimientos = vencimientosMap[key] || []
                      const movimientos = movimientosMap[key] || []
                      
                      // Calcular valores del maestro desde el detalle
                      const filaInicial = movimientos.find(m => m.mes === 'Inicial') || {}
                      const filaTotales = movimientos.find(m => m.mes === 'Totales') || {}
                      const saldoAnterior = filaInicial.debito || filaInicial.credito || 0
                      const debitos = filaTotales.debito || 0
                      const creditos = filaTotales.credito || 0
                      const debitosExt = filaTotales.debito_ext || 0
                      const creditosExt = filaTotales.credito_ext || 0
                      
                      return (
                        <React.Fragment key={key}>
                          <tr className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-3 text-gray-900 cursor-pointer" onClick={() => handleRowClick(row, i)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </td>
                            <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.suc_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(saldoAnterior)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(debitos)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(creditos)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_final || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_actual || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(debitosExt)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(creditosExt)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_final_ext || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_actual_ext || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_nom}</td>
                            <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.anf_cod}</td>
                            <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.est_cod}</td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${key}-detail`}>
                              <td colSpan={17} className="px-4 py-4 bg-gray-50">
                                <div className="space-y-4">
                                  {/* Grilla de Vencimientos */}
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Vencimientos</h3>
                                    {vencimientos.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-2 py-2 text-left border">Clase</th>
                                              <th className="px-2 py-2 text-left border">Documento</th>
                                              <th className="px-2 py-2 text-left border">Fecha</th>
                                              <th className="px-2 py-2 text-left border">Item</th>
                                              <th className="px-2 py-2 text-right border">Saldo Inicial</th>
                                              <th className="px-2 py-2 text-right border">Débitos</th>
                                              <th className="px-2 py-2 text-right border">Créditos</th>
                                              <th className="px-2 py-2 text-right border">Saldo</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {vencimientos.map((vcto, j) => (
                                              <tr key={j} className="border-t">
                                                <td className="px-2 py-2 border">{vcto.clc_cod}</td>
                                                <td className="px-2 py-2 border">{vcto.doc_num}</td>
                                                <td className="px-2 py-2 border">{vcto.doc_fec ? new Date(vcto.doc_fec).toISOString().split('T')[0] : ''}</td>
                                                <td className="px-2 py-2 border">{vcto.num_itm}</td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(vcto.sal_ini || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(vcto.sal_deb || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(vcto.sal_crd || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format((vcto.sal_ini || 0) + (vcto.sal_deb || 0) - (vcto.sal_crd || 0))}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 text-gray-500 text-xs">No hay vencimientos</div>
                                    )}
                                  </div>

                                  {/* Grilla de Movimientos */}
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Movimientos por Mes</h3>
                                    {movimientos.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-2 py-2 text-left border">Mes</th>
                                              <th className="px-2 py-2 text-right border">Débito</th>
                                              <th className="px-2 py-2 text-right border">Crédito</th>
                                              <th className="px-2 py-2 text-right border">Débito Ext</th>
                                              <th className="px-2 py-2 text-right border">Crédito Ext</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {movimientos.map((mov, j) => (
                                              <tr key={j} className={`border-t ${mov.mes === 'Inicial' || mov.mes === 'Totales' ? 'font-semibold bg-gray-50' : ''}`}>
                                                <td className="px-2 py-2 border">{mov.mes}</td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(mov.debito || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(mov.credito || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(mov.debito_ext || 0)}
                                                </td>
                                                <td className="px-2 py-2 text-right border">
                                                  {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(mov.credito_ext || 0)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 text-gray-500 text-xs">No hay movimientos</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
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

export default ConsultaAnexosPorNitPage
