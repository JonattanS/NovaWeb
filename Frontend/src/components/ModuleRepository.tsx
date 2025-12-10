"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Folder,
  Plus,
  Search,
  Zap,
  Database,
  Play,
  Trash2,
  Shield,
  ArrowLeft,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { moduleService, type PersistentModule, type ModuleFolder } from "@/services/moduleService"
import { getUserModules } from "@/services/userModulesApi"
import { getModulesByPortfolio, type NovModule } from "@/services/novModulesApi"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useNavigate, useLocation } from "react-router-dom"
import { routesByMencod } from '../routesByMencod'

interface ModuleRepositoryProps {
  onClose: () => void
}

export const ModuleRepository = ({ onClose }: ModuleRepositoryProps) => {
  const { user, canCreateMainFunctions, canDeleteMainFunctions } = useUser()
  const portafoliosPermitidos: number[] = user?.portafolios || []
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [modules, setModules] = useState<PersistentModule[]>([])
  const [folders, setFolders] = useState<ModuleFolder[]>([])
  const [selectedPortafolio, setSelectedPortafolio] = useState<ModuleFolder | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [moduleToPromote, setModuleToPromote] = useState<PersistentModule | null>(null)
  const [selectedFolderForPromotion, setSelectedFolderForPromotion] = useState<string>("")

  // System modules state
  const [novModules, setNovModules] = useState<NovModule[]>([])
  const [showingSystemModules, setShowingSystemModules] = useState(false)
  const [expandedModuleCode, setExpandedModuleCode] = useState<string | null>(null)
  const [subModules, setSubModules] = useState<NovModule[]>([])
  const [expandedCardContent, setExpandedCardContent] = useState<Set<number>>(new Set())
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})

  // Combina módulos evitando duplicados por id
  const mergeModulesWithoutDuplicates = (
    hardcoded: PersistentModule[],
    backend: PersistentModule[],
  ): PersistentModule[] => {
    const backendIds = new Set(backend.map((m) => m.id))
    return [...backend, ...hardcoded.filter((m) => !backendIds.has(m.id))]
  }

  // Load system modules
  const loadSystemModules = useCallback(
    async (porcod: number) => {
      if (!user) return

      try {
        const systemModules = await getModulesByPortfolio(porcod, user.token)
        setNovModules(systemModules)
      } catch (err) {
        console.error("Error cargando módulos del sistema:", err)
      }
    },
    [user],
  )

  // Carga datos: carpetas y módulos y combina
  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const allFolders = moduleService.getAllFolders()
      setFolders(allFolders.filter((f) => portafoliosPermitidos.includes(f.porcod ?? -1)))

      const hardcodedModules = moduleService.getAllModules()
      const backendModules = await getUserModules(user.token)

      const combined = mergeModulesWithoutDuplicates(hardcodedModules, backendModules)
      setModules(combined)

      if (selectedPortafolio) {
        await loadSystemModules(selectedPortafolio.porcod || 1)
      }
    } catch (err) {
      setError("No se pudieron cargar los módulos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los módulos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, portafoliosPermitidos, selectedPortafolio, toast, loadSystemModules])

  // Ejecutar carga inicial y cuando cambie usuario
  useEffect(() => {
    loadData()
  }, [loadData])

  // Load system modules when portfolio is selected
  useEffect(() => {
    if (selectedPortafolio && user) {
      loadSystemModules(selectedPortafolio.porcod || 1)
    }
  }, [selectedPortafolio, user, loadSystemModules])

  // Detectar si viene del sidebar y establecer portafolio automáticamente
  useEffect(() => {
    if (location.state?.selectedPortfolio) {
      const portfolio = folders.find(
        (f) => f.porcod === location.state.selectedPortfolio.porcod
      )
      if (portfolio) {
        setSelectedPortafolio(portfolio)
        
        // Si viene del sidebar, mostrar módulos del sistema
        if (location.state?.showSystemModules) {
          setShowingSystemModules(true)
        }
        
        // Si especifica un módulo, expandirlo
        if (location.state?.selectedModuleCode) {
          setExpandedModuleCode(location.state.selectedModuleCode)
          
          // Encontrar el módulo padre y expandir su card
          const parentModule = novModules.find(
            (m) => m.mencod === location.state.selectedModuleCode && !m.menter
          )
          if (parentModule) {
            setExpandedCards((prev) => ({
              ...prev,
              [parentModule.id]: true,
            }))
            const children = novModules.filter(
              (m2) => m2.menter && m2.mencodpad === parentModule.mencod
            )
            setSubModules(children)
          }
        }
      }
    }
  }, [location.state, folders, novModules])

  // Filtrado por portafolio y búsqueda
  const filteredModules = selectedPortafolio
    ? modules.filter(
        (m) =>
          m.porcod === selectedPortafolio.porcod &&
          (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : []

  const filteredSystemModules = novModules
    .filter((m) => !m.menter)
    .filter(
      (m) =>
        m.mennom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.mencod.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  // Manejo creación de nuevas carpetas
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      moduleService.createFolder(newFolderName.trim())
      setNewFolderName("")
      setShowCreateFolder(false)
      loadData()
      toast({
        title: "Carpeta creada",
        description: `La carpeta "${newFolderName}" se creó correctamente`,
      })
    }
  }

  // Manejo promover módulo a función principal
  const handlePromoteModule = (mod: PersistentModule) => {
    if (!canCreateMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden crear funciones principales",
        variant: "destructive",
      })
      return
    }
    setModuleToPromote(mod)
    setSelectedFolderForPromotion(mod.folderId || folders[0]?.id || "")
    setShowPromoteDialog(true)
  }

  const confirmPromoteModule = () => {
    if (!moduleToPromote) return
    const success = moduleService.promoteToMainFunction(moduleToPromote.id, selectedFolderForPromotion)
    if (success) {
      setShowPromoteDialog(false)
      setModuleToPromote(null)
      loadData()
      toast({
        title: "Función principal creada",
        description: `${moduleToPromote.name} ahora es una función principal`,
      })
      setTimeout(() => {
        navigate(`/dynamic-function/${moduleToPromote.id}`)
      }, 500)
    }
  }

  // Manejo eliminar módulo
  const handleDeleteModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId)
    if (mod?.isMainFunction && !canDeleteMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden eliminar funciones principales",
        variant: "destructive",
      })
      return
    }
    moduleService.deleteModule(moduleId)
    loadData()
    toast({
      title: "Módulo eliminado",
      description: "El módulo se eliminó correctamente",
    })
  }

  // Manejo click sobre módulo para navegar a la función o query manual
  const handleModuleClick = (mod: PersistentModule) => {
    moduleService.updateModuleLastUsed(mod.id)
    if (mod.isMainFunction) {
      navigate(`/dynamic-function/${mod.id}`)
    } else {
      navigate("/module-viewer", { state: { loadModule: mod } })
    }
  }

  const handleSystemModuleClick = (mod: NovModule) => {
    if (!mod.menter) {
      // Es módulo padre, expandir/contraer
      setExpandedCardContent((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(mod.id)) {
          newSet.delete(mod.id)
          if (expandedModuleCode === mod.mencod) {
            setExpandedModuleCode(null)
            setSubModules([])
          }
        } else {
          newSet.add(mod.id)
        }
        return newSet
      })
      return
    }

    // Es submódulo, navegar
    if (mod.menurl) {
      window.open(mod.menurl, "_blank")
    } else {
      const path = routesByMencod[mod.mencod]
      if (path) {
        navigate(path)
      } else {
        navigate("/system-module-viewer", {
          state: {
            module: mod,
            moduleCode: mod.mencod,
            moduleName: mod.mennom,
          },
        })
        console.warn(`Ruta no definida para mencod ${mod.mencod}, se usa fallback.`)
      }
    }
  }

  const handleExpandSubmodules = (mod: NovModule, e: React.MouseEvent) => {
    e.stopPropagation()
    if (expandedModuleCode === mod.mencod) {
      setExpandedModuleCode(null)
      setSubModules([])
    } else {
      setExpandedModuleCode(mod.mencod)
      const children = novModules.filter((m2) => m2.menter && m2.mencodpad === mod.mencod)
      setSubModules(children)
    }
  }

  // Renderizado controlador estados
  if (!user) return <div>Debes iniciar sesión</div>
  if (loading) return <div>Cargando módulos...</div>
  if (error) return <div>{error}</div>
  if (modules.length === 0 && !selectedPortafolio) return <div>No hay módulos guardados para este usuario.</div>
  
  // Renderizado principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header visual destacado */}
        <div className="relative overflow-hidden rounded-3xl bg-[#F7722F] p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                      {selectedPortafolio ? selectedPortafolio.name : "Portafolios Disponibles"}
                    </h1>
                    <p className="text-indigo-100 text-lg">
                      {selectedPortafolio 
                        ? showingSystemModules
                          ? `${filteredSystemModules.length} Módulos del Portafolio disponibles`
                          : `${filteredModules.length} módulos de usuario disponibles`
                        : `${folders.length} portafolios para explorar`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!selectedPortafolio ? (
          // Vista Portafolios
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </div>

            {folders.length ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
                    onClick={() => setSelectedPortafolio(folder)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-[#F7722F] rounded-2xl text-white group-hover:from-[#F7722F] group-hover:to-blue-500 transition-all duration-300">
                          <Folder className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-[#F7722F] transition-colors">
                            {folder.name}
                          </CardTitle>
                          <p className="text-sm text-slate-500 mt-1">Portafolio de módulos</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Explorar contenido</span>
                        <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-300">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                    <FolderOpen className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg text-slate-600">No tienes portafolios disponibles.</p>
                  <p className="text-sm text-slate-500">Contacta al administrador para obtener acceso.</p>
                </div>
              </Card>
            )}
          </div>
        ) : (
          // Vista Módulos del portafolio seleccionado
          <div className="space-y-6">
            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
              <Button
                variant="outline"
                onClick={() => setSelectedPortafolio(null)}
                className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a portafolios
              </Button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200 focus:bg-white transition-all duration-200"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={!showingSystemModules ? "default" : "outline"}
                  onClick={() => setShowingSystemModules(false)}
                  size="sm"
                  className={!showingSystemModules ? "bg-[#F7722F] hover:bg-[#78B437]" : ""}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Usuario ({filteredModules.length})
                </Button>
                <Button
                  variant={showingSystemModules ? "default" : "outline"}
                  onClick={() => setShowingSystemModules(true)}
                  size="sm"
                  className={showingSystemModules ? "bg-[#F7722F] hover:bg-[#78B437]" : ""}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Modulos del Portafolio ({filteredSystemModules.length})
                </Button>
              </div>
            </div>

            {!showingSystemModules ? (
              // Grid de Módulos de Usuario
              filteredModules.length === 0 ? (
                <Card className="p-12 text-center bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-300">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                      <Database className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg text-slate-600">No hay módulos para este portafolio.</p>
                    <p className="text-sm text-slate-500">Los módulos aparecerán aquí cuando sean creados.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredModules.map((mod) => (
                    <Card
                      key={mod.id}
                      className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-3 rounded-xl transition-all duration-300 ${
                              mod.isMainFunction
                                ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white group-hover:from-purple-600 group-hover:to-pink-700"
                                : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white group-hover:from-emerald-600 group-hover:to-teal-700"
                            }`}
                          >
                            {mod.isMainFunction ? <Zap className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {mod.name}
                            </CardTitle>
                            <Badge
                              variant={mod.isMainFunction ? "default" : "secondary"}
                              className={`mt-1 ${
                                mod.isMainFunction
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                  : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              } transition-colors`}
                            >
                              {mod.isMainFunction ? "Función Principal" : "Módulo Personal"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm text-slate-600 line-clamp-2">
                          {mod.description || "Sin descripción"}
                        </CardDescription>
                        <div className="space-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                          <div className="flex justify-between">
                            <span>Carpeta:</span>
                            <span className="font-medium">{selectedPortafolio.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Usos:</span>
                            <span className="font-medium">{mod.usageCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Último uso:</span>
                            <span className="font-medium">
                              {mod.lastUsed ? new Date(mod.lastUsed).toLocaleDateString() : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#F7722F] hover:bg-[#78B437] text-white transition-all duration-200"
                            onClick={() => handleModuleClick(mod)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Ejecutar
                          </Button>
                          {!mod.isMainFunction && canCreateMainFunctions() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromoteModule(mod)}
                              className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all duration-200"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteModule(mod.id)}
                            disabled={mod.isMainFunction && !canDeleteMainFunctions()}
                            className="hover:bg-red-600 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : filteredSystemModules.length === 0 ? (
              <Card className="p-12 text-center bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-300">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                    <Settings className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg text-slate-600">No hay módulos del sistema para este portafolio.</p>
                  <p className="text-sm text-slate-500">
                    Los módulos del sistema aparecerán aquí cuando estén disponibles.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSystemModules.map((mod) => {
                  const isCardExpanded = expandedCardContent.has(mod.id)
                  const hasSubmodules = novModules.some((m2) => m2.menter && m2.mencodpad === mod.mencod)

                  return (
                    <div key={mod.id} className="space-y-2">
                      <Card
                        className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-102 bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedCards(prev => ({
                            ...prev,
                            [mod.id]: !prev[mod.id]
                          }))
                          
                          if (!expandedCards[mod.id]) {
                            const children = novModules.filter(
                              (m2) => m2.menter && m2.mencodpad === mod.mencod
                            )
                            setSubModules(children)
                            setExpandedModuleCode(mod.mencod)
                          } else {
                            setSubModules([])
                            setExpandedModuleCode(null)
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="p-3 rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600 text-white group-hover:from-blue-600 group-hover:to-indigo-700">
                                <Settings className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                  {mod.mennom}
                                </CardTitle>
                                <Badge
                                  variant="default"
                                  className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                >
                                  <CardDescription className="text-sm text-slate-600">
                                    Código: {mod.mencod}
                                  </CardDescription>
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {expandedCards[mod.id] ? (
                                <ChevronDown className="h-5 w-5 text-slate-400 transition-transform" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-400 transition-transform" />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {expandedCards[mod.id] && (
                          <CardContent className="space-y-4">
                            {expandedModuleCode === mod.mencod && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Opciones:
                                </h4>
                                {subModules.length === 0 ? (
                                  <p className="text-sm text-slate-500 py-2 bg-slate-50 rounded-lg px-3">
                                    No hay Opciones disponibles.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {subModules.map((sub) => (
                                      <Card
                                        key={sub.id}
                                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white/70 backdrop-blur-sm border border-slate-200 hover:border-blue-300"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSystemModuleClick(sub)
                                        }}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                {sub.mennom}
                                              </p>
                                              <p className="text-xs text-slate-500 mt-1">Código: {sub.mencod}</p>
                                            </div>
                                            <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Dialog para promover módulo */}
            <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Función Principal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    ¿En qué carpeta deseas guardar la función principal "{moduleToPromote?.name}"?
                  </p>
                  <Select value={selectedFolderForPromotion} onValueChange={setSelectedFolderForPromotion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar carpeta" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center space-x-2">
                            <Folder className="h-4 w-4" />
                            <span>{folder.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={confirmPromoteModule} className="bg-purple-600 hover:bg-purple-700">
                      Crear Función Principal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}