import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code, Database, FolderOpen } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ModuleCarousel } from "@/components/ModuleCarousel"
import { ModuleRepository } from "@/components/ModuleRepository"
import type { PersistentModule } from "@/services/moduleService"
import { useUser } from "@/contexts/UserContext"

const HomePage = () => {
  const navigate = useNavigate()
  const [isDbConfigured, setIsDbConfigured] = useState(false)
  const [mostUsedModules, setMostUsedModules] = useState<PersistentModule[]>([])
  const [personalModules, setPersonalModules] = useState<PersistentModule[]>([])
  const [showRepository, setShowRepository] = useState(false)

  const { user } = useUser()
  const userPortafolios = user?.portafolios || []

  const handlePersonalModuleClick = (module: PersistentModule) => {
    navigate("/query-manual", { state: { loadModule: module } })
  }

  if (showRepository) {
    return <ModuleRepository onClose={() => setShowRepository(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero section with better styling and container */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-[#F7722F] bg-clip-text text-transparent">
          Página de Inicio
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
          Accede rápidamente a tus herramientas y módulos más utilizados
        </p>
        {/* Mostrar mensaje de error si ocurre */}
        
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Funciones / Módulos más usados
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Accede rápidamente a las funciones que más utilizas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/portafolios")}
                className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Ver Todas
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
  )
}

export default HomePage
