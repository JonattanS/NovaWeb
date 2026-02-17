"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Code, Database, FolderOpen, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { ModuleCarousel } from "@/components/ModuleCarousel"
import { ModuleRepository } from "@/components/ModuleRepository"
import type { PersistentModule } from "@/services/moduleService"
import { useUser } from "@/contexts/UserContext"
import { routesByMencod } from "@/routesByMencod"

const HomePage = () => {
  const navigate = useNavigate()
  const [isDbConfigured, setIsDbConfigured] = useState(false)
  const [mostUsedModules, setMostUsedModules] = useState<PersistentModule[]>([])
  const [personalModules, setPersonalModules] = useState<PersistentModule[]>([])
  const [showRepository, setShowRepository] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { user } = useUser()
  const userPortafolios = user?.portafolios || []

  // Mapeo de rutas a nombres amigables
  const menuOptions = useMemo(() => [
    { name: "Consulta de Documentos", route: "/ConsultaDocumentosPage" },
    { name: "Diario por Documentos", route: "/DiarioPorDocumentosPage" },
    { name: "Auxiliar de Cuentas", route: "/AuxiliarDeCuentasPage" },
    { name: "Auxiliar de Cuentas Extranjeras", route: "/AuxiliarDeCuentasExtranjerasPage" },
    { name: "Comprobante Diario", route: "/ComprobanteDiarioPage" },
    { name: "Libro Diario por Sucursal", route: "/LibroDiarioPorSucursalPage" },
    { name: "Libro Mayor y Balances por Sucursal", route: "/LibroMayorBalancesPorSucursalPage" },
    { name: "Libro Mayor y Balances Simplificado", route: "/LibroMayorBalancesSimplificadoPage" },
    { name: "Libros de Inventarios y Balances", route: "/LibrosInventariosBalancesPage" },
    { name: "Balance de Comprobación", route: "/ConsultaBalanceComprobacionPage" },
    { name: "Balance de Comprobación Rango Fechas", route: "/BalanceComprobacionRangoFechasCentroTercerosPage" },
    { name: "Balance General por Sucursal", route: "/BalanceGeneralPorSucursalPage" },
    { name: "Estado de Resultados por Centro de Actividad", route: "/EstadoResultadosPorCentroActividadPage" },
    { name: "Consulta de Saldos", route: "/ConsultaSaldoPage" },
    { name: "Reporte de Saldos por Cuenta", route: "/ReporteSaldosPorCuentaPage" },
    { name: "Reporte de Saldos por NIT", route: "/ReporteSaldosPorNitPage" },
    { name: "Reporte de Saldos por Centro", route: "/ReporteSaldosPorCentroPage" },
    { name: "Reporte de Saldos por Centro y NIT", route: "/ReporteSaldosPorCentroNitPage" },
    { name: "Reporte de Saldos de Bancos", route: "/ReporteDeSaldosDeBancosPage" },
    { name: "Reporte Estado de Múltiples Anexos", route: "/ReporteEstadoDeMultiplesAnexosPage" },
    { name: "Hoja de Vida de Anexo", route: "/HojaDeVidaAnexoPage" },
    { name: "Reporte Análisis Anexos Vencidos por Edades", route: "/ReporteAnalisisAnexosVencidosPorEdadesPage" },
    { name: "Reporte Anexos Vencidos por Edades", route: "/ReporteAnexosVencidosEdadesPage" },
    { name: "Reporte Análisis Anexos Vencidos Semanal", route: "/ReporteAnalisisAnexosVencidosSemanalPage" },
    { name: "Reporte Vencidos Fechas de Corte", route: "/ReporteVencidosFechasCortePage" },
    { name: "Reporte Anexos Vencidos Rangos Personalizados", route: "/ReporteAnexosVencidosRangosPersonalizadosPage" },
    { name: "Reporte Anexos Por Vencer Dolar/Moneda Local", route: "/ReporteAnexosPorVencerDolarMonLocalPage" },
    { name: "Reporte Anexos Vencidos Dolar/Moneda Local", route: "/ReporteAnexosVencidosDolarMonLocalPage" },
    { name: "Consulta Anexos por NIT", route: "/ConsultaAnexosPorNitPage" },
  ], [])

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return menuOptions.filter(option => 
      option.name.toLowerCase().includes(query)
    ).slice(0, 10)
  }, [searchQuery, menuOptions])

  const handlePersonalModuleClick = (module: PersistentModule) => {
    navigate("/query-manual", { state: { loadModule: module } })
  }

  const handleOptionClick = (route: string) => {
    navigate(route)
    setSearchQuery("")
  }

  if (showRepository) {
    return <ModuleRepository onClose={() => setShowRepository(false)} />
  }

  return (
    <div className="min-h-screen w-full py-6">
      <div className="px-6">
        <h1 className="text-3xl font-bold tracking-tight leading-tight bg-[#F7722F] bg-clip-text text-transparent mb-8">
          ¿Qué quieres hacer hoy?
        </h1>

        {/* Buscador de Opciones de Menú */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400" />
            <Input
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 h-20 shadow-2xl border-2 focus:border-blue-500 rounded-2xl font-medium"
              style={{ fontSize: '1.2rem' }}
            />
          </div>
          
          {filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleOptionClick(option.route)}
                  className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{option.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full space-y-12">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Opciones más usadas</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Accede rápidamente a las opciones que más utilizas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/portafolios")}
                  className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Portafolios
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <ModuleCarousel modules={mostUsedModules} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card
                  className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-md"
                  onClick={() => navigate("/ConsultaDocumentosPage")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-800 dark:text-slate-200">
                          Consulta de Documentos
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                      Consulta avanzada de documentos contables con filtros personalizados.
                    </CardDescription>

                    <div className="mt-6">
                      <Button
                        className="w-full shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        variant="default"
                      >
                        Ir a Consulta de Documentos
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-md"
                  onClick={() => navigate("/AuxiliarDeCuentasPage")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-800 dark:text-slate-200">
                          Auxiliar de Cuentas
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                      Consulta detallada del auxiliar de cuentas contables con filtros avanzados.
                    </CardDescription>

                    <div className="mt-6">
                      <Button
                        className="w-full shadow-lg transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        variant="default"
                      >
                        Ir a Auxiliar de Cuentas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Herramientas de Desarrollo</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Herramientas avanzadas para desarrolladores y usuarios técnicos
              </p>
            </div>

            <div className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Card
                  className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-md"
                  onClick={() => navigate("/query-manual")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
                        <Code className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-800 dark:text-slate-200">Consultas Manuales</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                      Ejecuta consultas SQL personalizadas y crea módulos reutilizables
                    </CardDescription>
                    <div className="mt-6">
                      <Button
                        className="w-full shadow-lg transition-all duration-200 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        variant="default"
                      >
                        Acceder al Editor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {personalModules.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Módulos Personalizados Recientes
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">Tus módulos creados recientemente</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRepository(true)}
                    className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Todos los Módulos
                  </Button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {personalModules.slice(0, 6).map((module) => (
                    <Card
                      key={module.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 shadow-md"
                      onClick={() => handlePersonalModuleClick(module)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg">
                            <Database className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-200">{module.name}</CardTitle>
                            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded-full">
                              Módulo Personal
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                          {module.description || "Módulo personalizado creado desde Query Manual"}
                        </CardDescription>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Creado: {new Date(module.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Último uso: {new Date(module.lastUsed).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-4">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all duration-200">
                            Ejecutar Módulo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
