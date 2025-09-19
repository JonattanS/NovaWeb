"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

interface ExcelExporterProps {
  data: any[]
  filename: string
  sheetName: string
  getColumnDescription?: (key: string) => string
  disabled?: boolean
  className?: string
  onProgressChange?: (progress: number) => void
  onGeneratingChange?: (generating: boolean) => void
  format?: "xlsx" | "csv"      // ← Nuevo prop para elegir formato
  delimiter?: string           // ← Separador para CSV
}

export const ExcelExporter: React.FC<ExcelExporterProps> = ({
  data,
  filename,
  sheetName,
  getColumnDescription = (key) => key,
  disabled = false,
  className = "",
  onProgressChange,
  onGeneratingChange,
  format = "xlsx",              // ← Por defecto exporta Excel
  delimiter = ",",              // ← Por defecto coma para CSV
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState("")

  const updateProgress = (p: number) => {
    setProgress(p)
    onProgressChange?.(p)
  }

  const updateGenerating = (g: boolean) => {
    setIsGenerating(g)
    onGeneratingChange?.(g)
  }

  const handleExport = async () => {
    if (data.length === 0) return
    updateGenerating(true)
    updateProgress(0)
    setError("")

    try {
      if (format === "csv") {
        // =====================
        // Lógica de exportar CSV
        // =====================
        const columns = Object.keys(data[0])
        // Cabeceras
        const headerRow = columns.map(col => getColumnDescription(col)).join(delimiter)
        // Filas de datos
        const dataRows = data.map(row =>
          columns
            .map(col => {
              const val = row[col]
              return `"${val == null ? "" : String(val).replace(/"/g, '""')}"`
            })
            .join(delimiter)
        )
        // Ensamblar CSV
        const csvContent = [headerRow, ...dataRows].join("\r\n")
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        updateProgress(100)
      } else {
        // =====================
        // Lógica existente de exportar Excel
        // =====================
        const columns = Object.keys(data[0] ?? {})
        const headers = columns.map(col => getColumnDescription(col))
        const workbook = XLSX.utils.book_new()
        const CHUNK_SIZE = 5000
        const totalChunks = Math.ceil(data.length / CHUNK_SIZE)
        const worksheetData: any[][] = [headers]

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, data.length)
          const chunk = data.slice(start, end)
          const rows = chunk.map(row =>
            columns.map(col => {
              const val = row[col]
              return val == null ? "" : String(val)
            })
          )
          worksheetData.push(...rows)
          updateProgress(Math.round(((i + 1) / totalChunks) * 90))

          // Ceder thread para no bloquear UI
          if (i % 3 === 0) {
            await new Promise(resolve => {
              if (window.requestIdleCallback) {
                window.requestIdleCallback(resolve, { timeout: 50 })
              } else {
                setTimeout(resolve, 10)
              }
            })
          }
        }

        updateProgress(95)
        const ws = XLSX.utils.aoa_to_sheet(worksheetData)
        ws["!cols"] = columns.map(() => ({ wch: 15 }))
        XLSX.utils.book_append_sheet(workbook, ws, sheetName)
        updateProgress(98)

        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
          compression: true,
        })
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        updateProgress(100)
      }
    } catch (err: any) {
      console.error("Error exporting file:", err)
      setError(
        err instanceof Error
          ? `Error al generar el archivo: ${err.message}`
          : "Error inesperado al generar el archivo."
      )
    } finally {
      updateGenerating(false)
      setTimeout(() => updateProgress(0), 500)
      // Forzar GC en entornos que lo soporten
      setTimeout(() => {
        if ((window as any).gc) (window as any).gc()
      }, 500)
    }
  }

  return (
    <>
      <Button
        className={`
          ${className}
          ${format === "csv"
            ? "bg-white hover:bg-green-50 border-green-200 text-green-700"
            : "bg-green-700 hover:bg-green-800 border-green-800 text-white"}
        `}
        variant="outline"
        onClick={handleExport}
        disabled={disabled || data.length === 0 || isGenerating}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {isGenerating
          ? `Generando ${format === "csv" ? "CSV" : "Excel"}... ${progress}%`
          : format === "csv"
          ? "CSV"
          : "Excel"}
      </Button>

      {error && (
        <Card className="mt-2 bg-red-50 border-red-200">
          <CardContent className="text-red-600">{error}</CardContent>
        </Card>
      )}
    </>
  )
}
