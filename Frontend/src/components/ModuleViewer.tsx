import type React from "react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { formatCellValue } from "@/utils/formatters"
import { schemaService } from "@/services/schemaService"
import { ArrowLeft, Table, Loader2 } from "lucide-react"

const ROWS_PER_PAGE = 30

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="relative">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      <div
        className="absolute inset-0 h-12 w-12 border-4 border-blue-200 border-t-transparent rounded-full animate-spin"
        style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
      />
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-gray-700 mb-1">Cargando datos</p>
      <p className="text-sm text-gray-500">Por favor espera un momento...</p>
    </div>
  </div>
)

export const ModuleViewer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const module = location.state?.loadModule

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [inputPage, setInputPage] = useState("1")

  useEffect(() => {
    if (!module) {
      navigate("/portafolios")
      return
    }
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await databaseService.executeCustomQuery(module.query)
        setData(rows)
        setPage(1)
        setInputPage("1")
      } catch (err) {
        setError("Error al ejecutar la consulta")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [module, navigate])

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
  const startIndex = (page - 1) * ROWS_PER_PAGE
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, data.length)
  const pageData = data.slice(startIndex, endIndex)

  const goToPage = (p: number) => {
    if (p < 1) p = 1
    if (p > totalPages) p = totalPages
    setPage(p)
    setInputPage(p.toString())
  }

  const goToPrev = () => goToPage(page - 1)
  const goToNext = () => goToPage(page + 1)

  const handleInputPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/[^0-9]/g, ""))
  }

  const goToInputPage = () => {
    const p = Number.parseInt(inputPage, 10)
    if (!isNaN(p)) goToPage(p)
  }

  if (!module) return null
  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>
  if (data.length === 0) return <div>No se encontraron datos.</div>

  return (
    <div>
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portafolios")} className="hover:bg-white/80">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a módulos
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Table className="h-6 w-6 mr-2 text-blue-600" />
          {module.name}
        </h1>
      </div>

      <p className="mb-4 text-gray-600">{module.description}</p>

      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <Table className="w-5 h-5 mr-2" /> Resultados de la consulta
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 border-white/30 text-white">
              {data.length} registros
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {Object.keys(pageData[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
                      {schemaService.getTableColumns().find((c) => c.name === key)?.description || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                    {Object.keys(row).map((colKey) => (
                      <td key={colKey} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                        {formatCellValue(colKey, row[colKey])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {endIndex} de {data.length} registros
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={goToPrev} disabled={page === 1} variant="outline" size="sm" className="bg-white">
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
                  className="w-16 text-center"
                />
                <span>de {totalPages}</span>
              </div>
              <Button
                onClick={goToNext}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
