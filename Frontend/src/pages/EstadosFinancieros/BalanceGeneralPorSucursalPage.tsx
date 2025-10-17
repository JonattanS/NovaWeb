"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { formatCellValue } from "@/utils/formatters"
import { schemaService } from "@/services/schemaService"
import {ArrowLeft,Search,Download,FileText,Filter,ChevronDown,ChevronUp,Table,Calendar,Building,Hash,User,CreditCard,} from "lucide-react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Definición estática del código de módulo
export const mencod = '010906';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  fecha_ini: string
  fecha_fin: string
  cta_cod_ini: string
  cta_cod_fin: string
}

const ROWS_PER_PAGE = 20

const BalanceGeneralPorSucursalPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    fecha_ini: "",
    fecha_fin: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
  })
  const [resultado, setResultado] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [inputPage, setInputPage] = useState("1")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  useEffect(() => {
    handleSubmit(new Event("submit") as unknown as React.FormEvent)
  }, [])

  const exportToCSV = () => {
    if (resultado.length === 0) return
    const columns = Object.keys(resultado[0])
    const csv = [
      columns.join(","),
      ...resultado.map((row) => columns.map((col) => `"${row[col] ?? ""}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Balance_General_Por_Sucursal_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const exportToPDF = async () => {
    if (resultado.length === 0) return

    setIsPdfGenerating(true)
    setPdfProgress(0)
    setError("")

    const channel = new MessageChannel()
    let pdf: jsPDF | null = null
    let blobUrl: string | null = null

    try {
      pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const primaryColor = [59, 130, 246] // Blue-500
      const headerColor = [30, 64, 175] // Blue-800

      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2])
      pdf.text("Balance General por Sucursal", 20, 20)

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, 20, 30)
      pdf.text(`Total de registros: ${resultado.length}`, 20, 35)

      const columns = Object.keys(resultado[0] ?? {})
      const headers = columns.map((col) => getColumnDescription(col))

      const CHUNK_SIZE = 100
      const totalChunks = Math.ceil(resultado.length / CHUNK_SIZE)

      let currentY = 45
      let isFirstPage = true

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE
        const endIdx = Math.min(startIdx + CHUNK_SIZE, resultado.length)

        const tempChunk = resultado.slice(startIdx, endIdx)

        const tempRows = tempChunk.map((row) =>
          columns.map((col) => {
            const value = row[col]
            if (value === null || value === undefined) return ""

            const stringValue = String(value)
            if (stringValue.length > 25) {
              return stringValue.substring(0, 22) + "..."
            }
            return stringValue
          }),
        )

        tempChunk.length = 0

        autoTable(pdf, {
          startY: currentY,
          head: isFirstPage ? [headers] : undefined,
          body: tempRows,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
            overflow: "linebreak",
            cellWidth: "wrap",
            valign: "middle",
            halign: "left",
          },
          headStyles: {
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: { top: 4, right: 2, bottom: 4, left: 2 },
          },
          columnStyles: {
            ...columns.reduce((acc, _, index) => {
              acc[index] = {
                cellWidth: "auto",
                minCellWidth: 15,
              }
              return acc
            }, {} as any),
          },
          margin: { top: isFirstPage ? 45 : 20, right: 10, bottom: 20, left: 10 },
          tableWidth: "auto",
          showHead: isFirstPage ? "everyPage" : "never",
          didDrawPage: (data) => {
            const pageCount = (pdf as any).internal.getNumberOfPages()
            const currentPage = data.pageNumber

            pdf!.setFontSize(8)
            pdf!.setTextColor(100, 100, 100)
            pdf!.text(
              `Página ${currentPage} de ${pageCount} | Procesando: ${Math.min(endIdx, resultado.length)} de ${resultado.length} registros`,
              pdf!.internal.pageSize.width - 80,
              pdf!.internal.pageSize.height - 10,
            )
          },
        })

        tempRows.forEach((row) => {
          row.length = 0
        })
        tempRows.length = 0

        const finalY = (pdf as any).lastAutoTable.finalY
        if (finalY > pdf.internal.pageSize.height - 40 && chunkIndex < totalChunks - 1) {
          pdf.addPage()
          currentY = 20
        } else {
          currentY = finalY + 10
        }

        isFirstPage = false

        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        setPdfProgress(progress)

        if (chunkIndex % 1 === 0) {
          await new Promise((resolve) => {
            if (window.requestIdleCallback) {
              window.requestIdleCallback(
                () => {
                  if (window.gc) {
                    window.gc()
                  }
                  resolve(void 0)
                },
                { timeout: 100 },
              )
            } else {
              setTimeout(() => {
                if (window.gc) {
                  window.gc()
                }
                resolve(void 0)
              }, 50)
            }
          })
        }
      }

      await new Promise((resolve) => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(resolve, { timeout: 1000 })
        } else {
          setTimeout(resolve, 500)
        }
      })

      const pdfBlob = pdf.output("blob")
      blobUrl = window.URL.createObjectURL(pdfBlob)

      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `balance_general_por_sucursal_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => {
        if (blobUrl) {
          window.URL.revokeObjectURL(blobUrl)
          blobUrl = null
        }
      }, 500)
    } catch (error) {
      console.error("Error generating PDF:", error)
      if (error instanceof Error) {
        setError(`Error al generar el PDF: ${error.message}. Intente nuevamente o contacte al administrador.`)
      } else {
        setError("Error inesperado al generar el PDF. Intente nuevamente o contacte al administrador.")
      }
    } finally {
      setIsPdfGenerating(false)
      setPdfProgress(0)

      const performCleanup = async () => {
        try {
          if (pdf) {
            ;(pdf as any).internal = null
            ;(pdf as any).lastAutoTable = null
            pdf = null
          }

          const gcCycles = async (count: number, delay: number) => {
            for (let i = 0; i < count; i++) {
              if (window.gc) {
                window.gc()
              }
              await new Promise((resolve) => {
                if (window.requestIdleCallback) {
                  window.requestIdleCallback(resolve, { timeout: delay })
                } else {
                  setTimeout(resolve, delay)
                }
              })
            }
          }

          await gcCycles(5, 100)

          setTimeout(() => gcCycles(10, 200), 1000)
          setTimeout(() => gcCycles(15, 300), 5000)
          setTimeout(() => gcCycles(20, 400), 15000)

          setTimeout(() => gcCycles(25, 500), 30000)
        } catch (cleanupError) {
          console.warn("Error during cleanup:", cleanupError)
        }
      }

      if (window.requestIdleCallback) {
        window.requestIdleCallback(performCleanup, { timeout: 2000 })
      } else {
        setTimeout(performCleanup, 1000)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResultado([])
    setPage(1)
    setInputPage("1")
    try {
      const response = await databaseService.consultaDocumentos(filtros)
      setResultado(response)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(resultado.length / ROWS_PER_PAGE)
  const startIndex = (page - 1) * ROWS_PER_PAGE
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, resultado.length)
  const pageResults = resultado.slice(startIndex, endIndex)

  const handleInputPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/[^0-9]/g, ""))
  }

  const goToInputPage = () => {
    let newPage = Number.parseInt(inputPage, 10)
    if (isNaN(newPage) || newPage < 1) newPage = 1
    if (newPage > totalPages) newPage = totalPages
    setPage(newPage)
    setInputPage(newPage.toString())
  }

  const goToNext = () => {
    if (page < totalPages) {
      setPage(page + 1)
      setInputPage((page + 1).toString())
    }
  }

  const goToPrev = () => {
    if (page > 1) {
      setPage(page - 1)
      setInputPage((page - 1).toString())
    }
  }

  const getActiveFiltersCount = () => {
    return Object.values(filtros).filter((value) => value.trim() !== "").length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Table className="h-6 w-6 mr-2 text-blue-600" />
              Balance General por Sucursal
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="bg-white hover:bg-green-50 border-green-200 text-green-700"
                disabled={loading || isPdfGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="bg-white hover:bg-red-50 border-red-200 text-red-700"
                disabled={loading || isPdfGenerating}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isPdfGenerating ? `Generando PDF... ${pdfProgress}%` : "PDF"}
              </Button>
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
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading || isPdfGenerating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Consultando..." : "Consultar Documentos"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {isPdfGenerating && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-blue-600 text-center space-y-2">
                <div>Generando PDF... {pdfProgress}%</div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pdfProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-blue-500">
                  Procesando {resultado.length} registros. Por favor espere...
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
                  <Table className="h-5 w-5 mr-2" />
                  Resultados de la Consulta
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {resultado.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {Object.keys(pageResults[0]).map((key) => (
                        <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                          {getColumnDescription(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pageResults.map((row, i) => (
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

              <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {endIndex} de {resultado.length} registros
                </div>

                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" onClick={goToPrev} disabled={page === 1} className="bg-white">
                    Anterior
                  </Button>

                  <div className="flex items-center space-x-2 text-sm">
                    <span>Página</span>
                    <Input
                      type="text"
                      value={inputPage}
                      onChange={handleInputPageChange}
                      onBlur={goToInputPage}
                      onKeyDown={(e) => e.key === "Enter" && goToInputPage()}
                      className="w-16 text-center bg-white"
                    />
                    <span>de {totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={page === totalPages}
                    className="bg-white"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default BalanceGeneralPorSucursalPage