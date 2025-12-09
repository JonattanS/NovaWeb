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
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  
  const module = location.state?.loadModule
  const isDynamicModule = location.state?.isDynamicModule
  const systemModule = location.state?.systemModule

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
        let rows: any[] = []

        // Si es un módulo dinámico del sistema
        if (isDynamicModule && systemModule) {
          // Para módulos del sistema, construir una query básica
          // o cargar datos según el módulo específico
          console.log("Módulo dinámico del sistema:", systemModule.mencod, systemModule.mennom)
          
          // OPCIÓN 1: Si el módulo tiene una query en systemModule.parameters
          if (systemModule.parameters) {
            try {
              rows = await databaseService.executeCustomQuery(systemModule.parameters)
            } catch (err) {
              console.error("Error ejecutando query del módulo:", err)
              // Fallback a tabla genérica
              rows = []
            }
          } else {
            // OPCIÓN 2: Query por defecto según el mencod
            // Esto mapea módulos del sistema a queries específicas
            const defaultQuery = getDefaultQueryByModuleCode(systemModule.mencod)
            if (defaultQuery) {
              try {
                rows = await databaseService.executeCustomQuery(defaultQuery)
              } catch (err) {
                console.error("Error ejecutando query por defecto:", err)
                rows = []
              }
            } else {
              // Sin datos disponibles
              rows = []
              setError(`No hay datos disponibles para el módulo: ${systemModule.mennom}`)
            }
          }
        } else {
          // Módulo personal con query definida
          rows = await databaseService.executeCustomQuery(module.query)
        }

        setData(rows)
        setPage(1)
        setInputPage("1")
      } catch (err) {
        console.error("Error al ejecutar la consulta:", err)
        setError("Error al ejecutar la consulta")
        toast({
          title: "Error",
          description: "Error al cargar los datos del módulo",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [module, navigate, isDynamicModule, systemModule, toast])

  // Mapeo de códigos de módulo del sistema a queries SQL
  const getDefaultQueryByModuleCode = (mencod: string): string | null => {
    const queryMap: { [key: string]: string } = {
      // Procesos de Documentos
      "CONSDC": `SELECT * FROM public.con_his LIMIT 100`,
      "AUXCTA": `SELECT * FROM public.con_cta LIMIT 100`,
      "AUXCTE": `SELECT * FROM public.con_ctaext LIMIT 100`,
      "DIAPDC": `SELECT * FROM public.con_his WHERE anf_cla = 1 LIMIT 100`,
      
      // Libros Oficiales
      "COMPDB": `SELECT * FROM public.con_his WHERE mov_tip = 'DB' LIMIT 100`,
      "LIBDPS": `SELECT * FROM public.con_his LIMIT 100`,
      "MAYBAL": `SELECT * FROM public.con_cta LIMIT 100`,
      "MAYSIN": `SELECT * FROM public.con_cta LIMIT 100`,
      "LIBINV": `SELECT * FROM public.con_his LIMIT 100`,
      
      // Estados Financieros
      "BALCPB": `SELECT * FROM public.con_cta LIMIT 100`,
      "BALPRF": `SELECT * FROM public.con_cta LIMIT 100`,
      "BLGNRL": `SELECT * FROM public.con_cta LIMIT 100`,
      "ESRPDO": `SELECT * FROM public.con_his LIMIT 100`,
      "ESRCAC": `SELECT * FROM public.con_his LIMIT 100`,
      "ESRCPS": `SELECT * FROM public.con_his LIMIT 100`,
      
      // Estado de Saldos
      "CONSLD": `SELECT * FROM public.con_cta LIMIT 100`,
      "REPSDC": `SELECT * FROM public.con_cta LIMIT 100`,
      "REPSDN": `SELECT * FROM public.con_cta LIMIT 100`,
      "REPSDC2": `SELECT * FROM public.con_cta LIMIT 100`,
      "REPSDN2": `SELECT * FROM public.con_cta LIMIT 100`,
      "REPSDB": `SELECT * FROM public.con_cta LIMIT 100`,
      
      // Anexos Financieros
      "REPANX": `SELECT * FROM public.con_his LIMIT 100`,
      "VIDANX": `SELECT * FROM public.con_his LIMIT 100`,
      "REPAVN": `SELECT * FROM public.con_his LIMIT 100`,
      "REPAVE": `SELECT * FROM public.con_his LIMIT 100`,
    }

    return queryMap[mencod] || null
  }

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
  if (error && data.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4 text-lg">{error}</div>
        <Button onClick={() => navigate("/portafolios")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a módulos
        </Button>
      </div>
    )
  }
  if (data.length === 0)
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">No se encontraron datos.</div>
        <Button onClick={() => navigate("/portafolios")} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a módulos
        </Button>
      </div>
    )

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
        {isDynamicModule && (
          <Badge className="bg-blue-100 text-blue-800 ml-4">Módulo del Sistema</Badge>
        )}
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
            {pageData.length > 0 ? (
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
            ) : (
              <div className="p-8 text-center text-gray-500">No hay datos disponibles</div>
            )}
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
